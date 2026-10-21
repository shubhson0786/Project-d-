const mongoose = require("mongoose");
const { FundAccount } = require("./funds");
const { Holding, Order } = require("./trading-models");
const { quote } = require("./market");
const { fail, requestId, ensureAccount } = require("./accounts");
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
  await ensureAccount(userId);
  const totalPaise = market.pricePaise * qty;
  if (!Number.isSafeInteger(totalPaise)) throw fail("Order value is too large.");
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const replay = await Order.findOne({ userId, requestId: key }).session(session);
      if (replay) { result = sameRequest(replay, params); return; }
      const holding = await Holding.findOne({ userId, name }).session(session);
      const oldQty = holding?.qty || 0;
      const oldCost = holding?.costBasisPaise ?? Math.round((holding?.get("avg") || 0) * oldQty * 100);
      if (mode === "SELL" && oldQty < qty) throw fail("You do not own enough shares to sell this quantity.", 409);
      const allocatedCost = mode === "SELL" ? Math.round(oldCost * qty / oldQty) : 0;
      const realizedProfitPaise = mode === "SELL" ? totalPaise - allocatedCost : 0;
      const delta = mode === "BUY" ? -totalPaise : totalPaise;
      const filter = { accountKey: userId };
      if (mode === "BUY") filter.balancePaise = { $gte: totalPaise };
      const account = await FundAccount.findOneAndUpdate(filter, {
        $inc: { balancePaise: delta, balance: delta / 100, realizedProfitPaise },
        $push: { transactions: { type: mode, amount: totalPaise / 100, method: "TRADE", symbol: name, qty, requestId: key } },
      }, { new: true, session });
      if (!account) throw fail("Insufficient available cash. Add funds before buying.", 409);
      const nextQty = mode === "BUY" ? oldQty + qty : oldQty - qty;
      if (!Number.isSafeInteger(nextQty)) throw fail("Holding quantity is too large.");
      if (nextQty === 0) await Holding.deleteOne({ userId, name }, { session });
      else await Holding.updateOne({ userId, name }, { $set: { qty: nextQty, costBasisPaise: mode === "BUY" ? oldCost + totalPaise : oldCost - allocatedCost } }, { upsert: true, session, runValidators: true });
      [result] = await Order.create([{ userId, requestId: key, name, qty, price: market.price, totalPaise, mode, status: "FILLED", realizedProfitPaise }], { session });
    });
    return result;
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Order.findOne({ userId, requestId: key });
      if (replay) return sameRequest(replay, params);
    }
    throw error;
  } finally { await session.endSession(); }
}
module.exports = { executeOrder };
