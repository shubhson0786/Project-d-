const mongoose = require("mongoose");
const { FundAccount } = require("./funds");
const { Holding, Order, Trade } = require("./trading-models");
const { quote } = require("./market");
const { fail, requestId, ensureAccount } = require("./accounts");

const active = ["OPEN", "PARTIALLY_FILLED"];
const remaining = order => order.qty - (order.filledQty || 0);

function sameRequest(order, input) {
  if (order.name !== input.name || order.mode !== input.mode || order.qty !== input.qty) throw fail("This request ID was already used for a different order.", 409);
  return order;
}

async function executeOrder(userId, input) {
  const name = typeof input.name === "string" ? input.name.trim().toUpperCase() : "";
  const qty = Number(input.qty);
  const mode = String(input.mode || "").toUpperCase();
  const key = requestId(input.requestId);
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 1000000 || !["BUY", "SELL"].includes(mode)) throw fail("Choose Buy or Sell and a whole quantity from 1 to 1,000,000.");
  const market = quote(name);
  if (!market) throw fail("This stock is not available for paper trading.");
  if (input.orderType && input.orderType !== "MARKET") throw fail("Only market orders are supported.");
  const params = { name, qty, mode };
  const existing = await Order.findOne({ userId, requestId: key });
  if (existing) return sameRequest(existing, params);
  const account = await ensureAccount(userId);
  const estimatedTotal = market.pricePaise * qty;
  if (!Number.isSafeInteger(estimatedTotal)) throw fail("Order value is too large.");
  if (mode === "SELL") {
    const [holding, pending] = await Promise.all([
      Holding.findOne({ userId, name }),
      Order.find({ userId, name, mode: "SELL", status: { $in: active } }).lean(),
    ]);
    const reserved = pending.reduce((sum, order) => sum + remaining(order), 0);
    if ((holding?.qty || 0) - reserved < qty) throw fail("Not enough uncommitted shares for this sell order.", 409);
  } else {
    const pending = await Order.find({ userId, mode: "BUY", status: { $in: active } }).lean();
    const reserved = pending.reduce((sum, order) => sum + Math.max(0, Math.round((order.orderPricePaise || Math.round(order.price * 100)) * remaining(order))), 0);
    if ((account.balancePaise ?? 0) - reserved < estimatedTotal) throw fail("Not enough uncommitted virtual cash for this buy order.", 409);
  }
  let placed;
  try {
    placed = await Order.create({ userId, requestId: key, name, qty, price: market.price, orderPricePaise: market.pricePaise, totalPaise: 0, estimatedTotalPaise: estimatedTotal, mode, orderType: "MARKET", status: "OPEN", filledQty: 0 });
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Order.findOne({ userId, requestId: key });
      if (replay) return sameRequest(replay, params);
    }
    throw error;
  }
  try {
    await matchOpenOrders(name);
    if (mode === "BUY") await fillDemoBuy(placed._id);
  } catch (error) { console.error("Paper order matching deferred", error.message); }
  return Order.findById(placed._id);
}

function fillOrder(order, qty, totalPaise) {
  order.filledQty = (order.filledQty || 0) + qty;
  order.totalPaise += totalPaise;
  order.price = Math.round(order.totalPaise / order.filledQty) / 100;
  order.status = remaining(order) === 0 ? "FILLED" : "PARTIALLY_FILLED";
  if (order.status === "FILLED") order.filledAt = new Date();
}

async function settlePair(buyId, sellId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [buy, sell] = await Promise.all([
        Order.findOne({ _id: buyId, status: { $in: active } }).session(session),
        Order.findOne({ _id: sellId, status: { $in: active } }).session(session),
      ]);
      if (!buy || !sell || buy.mode !== "BUY" || sell.mode !== "SELL" || buy.name !== sell.name || buy.userId === sell.userId) return;
      const first = buy.createdAt <= sell.createdAt ? buy : sell;
      const pricePaise = first.orderPricePaise || Math.round(first.price * 100);
      if (!Number.isSafeInteger(pricePaise) || pricePaise < 1) throw fail("Invalid paper order price.");
      const [sellerHolding, buyerHolding, buyerAccount] = await Promise.all([
        Holding.findOne({ userId: sell.userId, name: sell.name }).session(session),
        Holding.findOne({ userId: buy.userId, name: buy.name }).session(session),
        FundAccount.findOne({ accountKey: buy.userId }).session(session),
      ]);
      const sellerQty = sellerHolding?.qty || 0;
      const affordableQty = Math.floor((buyerAccount?.balancePaise || 0) / pricePaise);
      const qty = Math.min(remaining(buy), remaining(sell), sellerQty, affordableQty);
      if (qty < 1) {
        if (sellerQty < 1) { sell.status = "REJECTED"; sell.rejectionReason = "Seller no longer owns the shares."; await sell.save({ session }); }
        if (affordableQty < 1) { buy.status = "REJECTED"; buy.rejectionReason = "Buyer has insufficient virtual cash."; await buy.save({ session }); }
        return;
      }
      const totalPaise = pricePaise * qty;
      if (!Number.isSafeInteger(totalPaise)) throw fail("Trade value is too large.");
      const oldCost = sellerHolding.costBasisPaise ?? Math.round((sellerHolding.get("avg") || 0) * sellerQty * 100);
      const allocatedCost = Math.round(oldCost * qty / sellerQty);
      const realizedProfitPaise = totalPaise - allocatedCost;
      const buyer = await FundAccount.findOneAndUpdate({ accountKey: buy.userId, balancePaise: { $gte: totalPaise } }, {
        $inc: { balancePaise: -totalPaise, balance: -totalPaise / 100 },
        $push: { transactions: { type: "BUY", amount: totalPaise / 100, method: "TRADE", symbol: buy.name, qty, requestId: buy.requestId } },
      }, { session });
      if (!buyer) throw fail("Buyer balance changed during matching.", 409);
      await FundAccount.updateOne({ accountKey: sell.userId }, {
        $inc: { balancePaise: totalPaise, balance: totalPaise / 100, realizedProfitPaise },
        $push: { transactions: { type: "SELL", amount: totalPaise / 100, method: "TRADE", symbol: sell.name, qty, requestId: sell.requestId } },
      }, { session });
      if (sellerQty === qty) await Holding.deleteOne({ userId: sell.userId, name: sell.name }, { session });
      else await Holding.updateOne({ userId: sell.userId, name: sell.name }, { $set: { qty: sellerQty - qty, costBasisPaise: oldCost - allocatedCost } }, { session });
      const buyerQty = buyerHolding?.qty || 0;
      const buyerCost = buyerHolding?.costBasisPaise ?? Math.round((buyerHolding?.get("avg") || 0) * buyerQty * 100);
      await Holding.updateOne({ userId: buy.userId, name: buy.name }, { $set: { qty: buyerQty + qty, costBasisPaise: buyerCost + totalPaise } }, { upsert: true, session, runValidators: true });
      fillOrder(buy, qty, totalPaise);
      fillOrder(sell, qty, totalPaise);
      buy.fillSource = buy.fillSource === "DEMO" ? "MIXED" : "USER";
      sell.fillSource = "USER";
      sell.realizedProfitPaise += realizedProfitPaise;
      await Promise.all([buy.save({ session }), sell.save({ session })]);
      await Trade.create([{ name: buy.name, qty, pricePaise, buyOrderId: buy._id, sellOrderId: sell._id, buyerUserId: buy.userId, sellerUserId: sell.userId }], { session });
    });
  } finally { await session.endSession(); }
}

async function fillDemoBuy(orderId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const buy = await Order.findOne({ _id: orderId, mode: "BUY", status: { $in: active } }).session(session);
      if (!buy) return;
      const pricePaise = quote(buy.name)?.pricePaise;
      if (!Number.isSafeInteger(pricePaise) || pricePaise < 1) throw fail("Stock quote unavailable.");
      const [account, holding] = await Promise.all([
        FundAccount.findOne({ accountKey: buy.userId }).session(session),
        Holding.findOne({ userId: buy.userId, name: buy.name }).session(session),
      ]);
      const qty = Math.min(remaining(buy), Math.floor((account?.balancePaise || 0) / pricePaise));
      if (qty < 1) {
        buy.status = "REJECTED";
        buy.rejectionReason = "Insufficient virtual cash at the current quote.";
        await buy.save({ session });
        return;
      }
      const totalPaise = qty * pricePaise;
      if (!Number.isSafeInteger(totalPaise)) throw fail("Trade value is too large.");
      const debited = await FundAccount.findOneAndUpdate({ accountKey: buy.userId, balancePaise: { $gte: totalPaise } }, {
        $inc: { balancePaise: -totalPaise, balance: -totalPaise / 100 },
        $push: { transactions: { type: "BUY", amount: totalPaise / 100, method: "TRADE", symbol: buy.name, qty, requestId: buy.requestId } },
      }, { session });
      if (!debited) throw fail("Balance changed while buying.", 409);
      const oldQty = holding?.qty || 0;
      const oldCost = holding?.costBasisPaise ?? Math.round((holding?.get("avg") || 0) * oldQty * 100);
      await Holding.updateOne({ userId: buy.userId, name: buy.name }, { $set: { qty: oldQty + qty, costBasisPaise: oldCost + totalPaise } }, { upsert: true, session, runValidators: true });
      fillOrder(buy, qty, totalPaise);
      buy.fillSource = buy.fillSource === "USER" ? "MIXED" : "DEMO";
      if (remaining(buy) > 0) {
        buy.status = "REJECTED";
        buy.rejectionReason = "Remaining shares could not be bought with available virtual cash.";
      }
      await buy.save({ session });
      await Trade.create([{ name: buy.name, qty, pricePaise, buyOrderId: buy._id, buyerUserId: buy.userId, sellerUserId: "PAPER_DEMO_INVENTORY", source: "DEMO" }], { session });
    });
  } finally { await session.endSession(); }
}

async function matchOpenOrders(name) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const orders = await Order.find({ name, status: { $in: active } }).sort({ createdAt: 1, _id: 1 }).limit(200).lean();
    let pair;
    for (const order of orders) {
      const opposite = orders.find(other => other.mode !== order.mode && other.userId !== order.userId);
      if (opposite) { pair = order.mode === "BUY" ? [order, opposite] : [opposite, order]; break; }
    }
    if (!pair) return;
    await settlePair(pair[0]._id, pair[1]._id);
  }
}

async function settleDueOrders(userId) {
  const names = await Order.distinct("name", { userId, status: { $in: active } });
  for (const name of names) await matchOpenOrders(name);
  const pendingBuys = await Order.find({ userId, mode: "BUY", status: { $in: active } }).lean();
  for (const buy of pendingBuys) await fillDemoBuy(buy._id);
}

async function cancelOrder(userId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) throw fail("Invalid order ID.");
  const order = await Order.findOneAndUpdate({ _id: orderId, userId, status: { $in: active } }, { $set: { status: "CANCELLED" } }, { new: true });
  if (!order) throw fail("Only open or partially filled orders can be cancelled.", 409);
  return order;
}

async function orderBook(userId) {
  const orders = await Order.find({ status: { $in: active }, userId: { $ne: userId } }).select("name mode qty filledQty").lean();
  const book = {};
  for (const order of orders) {
    const entry = book[order.name] || (book[order.name] = { availableToBuy: 0, availableToSell: 0 });
    entry[order.mode === "SELL" ? "availableToBuy" : "availableToSell"] += remaining(order);
  }
  return book;
}

module.exports = { executeOrder, settleDueOrders, cancelOrder, orderBook };
