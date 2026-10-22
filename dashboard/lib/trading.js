const mongoose = require("mongoose");
const { FundAccount } = require("./funds");
const { Holding, Order } = require("./trading-models");
const { quote } = require("./market");
const { fail, requestId, ensureAccount } = require("./accounts");

const FILL_DELAY_MS = 3000;

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
  if (mode === "BUY" && (account.balancePaise ?? 0) < estimatedTotal) throw fail("Insufficient available cash. Add funds before buying.", 409);
  if (mode === "SELL") {
    const holding = await Holding.findOne({ userId, name });
    if ((holding?.qty || 0) < qty) throw fail("You do not own enough shares to sell this quantity.", 409);
  }
  try {
    return await Order.create({ userId, requestId: key, name, qty, price: market.price, totalPaise: estimatedTotal, mode, orderType: "MARKET", status: "OPEN" });
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Order.findOne({ userId, requestId: key });
      if (replay) return sameRequest(replay, params);
    }
    throw error;
  }
}

async function settleOrder(order) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const current = await Order.findOne({ _id: order._id, status: "OPEN" }).session(session);
      if (!current) return;
      const market = quote(current.name);
      if (!market || !Number.isSafeInteger(market.pricePaise * current.qty)) {
        current.status = "REJECTED";
        current.rejectionReason = "Simulated quote is unavailable.";
        await current.save({ session });
        return;
      }
      const totalPaise = market.pricePaise * current.qty;
      const holding = await Holding.findOne({ userId: current.userId, name: current.name }).session(session);
      const oldQty = holding?.qty || 0;
      const oldCost = holding?.costBasisPaise ?? Math.round((holding?.get("avg") || 0) * oldQty * 100);
      if (current.mode === "SELL" && oldQty < current.qty) {
        current.status = "REJECTED";
        current.rejectionReason = "Not enough shares available at execution.";
        await current.save({ session });
        return;
      }
      const allocatedCost = current.mode === "SELL" ? Math.round(oldCost * current.qty / oldQty) : 0;
      const realizedProfitPaise = current.mode === "SELL" ? totalPaise - allocatedCost : 0;
      const delta = current.mode === "BUY" ? -totalPaise : totalPaise;
      const filter = { accountKey: current.userId };
      if (current.mode === "BUY") filter.balancePaise = { $gte: totalPaise };
      const account = await FundAccount.findOneAndUpdate(filter, {
        $inc: { balancePaise: delta, balance: delta / 100, realizedProfitPaise },
        $push: { transactions: { type: current.mode, amount: totalPaise / 100, method: "TRADE", symbol: current.name, qty: current.qty, requestId: current.requestId } },
      }, { new: true, session });
      if (!account) {
        current.status = "REJECTED";
        current.rejectionReason = "Insufficient cash at execution price.";
        await current.save({ session });
        return;
      }
      const nextQty = current.mode === "BUY" ? oldQty + current.qty : oldQty - current.qty;
      if (!Number.isSafeInteger(nextQty)) throw fail("Holding quantity is too large.");
      if (nextQty === 0) await Holding.deleteOne({ userId: current.userId, name: current.name }, { session });
      else await Holding.updateOne({ userId: current.userId, name: current.name }, { $set: { qty: nextQty, costBasisPaise: current.mode === "BUY" ? oldCost + totalPaise : oldCost - allocatedCost } }, { upsert: true, session, runValidators: true });
      current.price = market.price;
      current.totalPaise = totalPaise;
      current.realizedProfitPaise = realizedProfitPaise;
      current.status = "FILLED";
      current.filledAt = new Date();
      await current.save({ session });
    });
  } finally { await session.endSession(); }
}

async function settleDueOrders(userId) {
  const due = await Order.find({ userId, status: "OPEN", createdAt: { $lte: new Date(Date.now() - FILL_DELAY_MS) } }).sort({ createdAt: 1 }).limit(20);
  for (const order of due) await settleOrder(order);
}

async function cancelOrder(userId, orderId) {
  if (!mongoose.isValidObjectId(orderId)) throw fail("Invalid order ID.");
  const order = await Order.findOneAndUpdate({ _id: orderId, userId, status: "OPEN" }, { $set: { status: "CANCELLED" } }, { new: true });
  if (!order) throw fail("Only open orders can be cancelled.", 409);
  return order;
}

module.exports = { executeOrder, settleDueOrders, cancelOrder };
