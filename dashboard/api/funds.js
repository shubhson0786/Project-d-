const mongoose = require("mongoose");
const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { FundAccount, responseAccount } = require("../lib/funds");
const { Transfer } = require("../lib/trading-models");
const { ensureAccount, fail, paise, requestId } = require("../lib/accounts");
module.exports = async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  let session;
  try {
    await connectDatabase();
    const account = await ensureAccount(user.sub);
    if (req.method === "GET") return res.json(responseAccount(account));
    const type = String(req.body?.type || "").toUpperCase();
    const amount = paise(req.body?.amount);
    const key = requestId(req.body?.requestId);
    if (!["ADD", "WITHDRAW"].includes(type)) throw fail("Choose deposit or withdrawal.");
    const paper = process.env.PAYMENT_MODE !== "razorpay_test";
    if (type === "ADD" && !paper) throw fail("Deposits must be completed through Razorpay Test Checkout.");
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      const replay = await Transfer.findOne({ userId: user.sub, requestId: key }).session(session);
      if (replay) {
        if (replay.type !== type || replay.amountPaise !== amount) throw fail("Request ID already used for another transfer.", 409);
        result = await FundAccount.findOne({ accountKey: user.sub }).session(session); return;
      }
      const filter = { accountKey: user.sub };
      if (type === "WITHDRAW") filter.balancePaise = { $gte: amount };
      const delta = type === "ADD" ? amount : -amount;
      result = await FundAccount.findOneAndUpdate(filter, { $inc: { balancePaise: delta, balance: delta / 100 }, $push: { transactions: { type, amount: amount / 100, method: "PAPER", requestId: key } } }, { new: true, session });
      if (!result) throw fail("Insufficient available cash for this withdrawal.", 409);
      await Transfer.create([{ userId: user.sub, requestId: key, type, amountPaise: amount }], { session });
    });
    return res.json(responseAccount(result));
  } catch (error) {
    if (error.code === 11000) {
      const replay = await Transfer.findOne({ userId: user.sub, requestId: req.body?.requestId });
      if (replay && replay.type === String(req.body?.type).toUpperCase() && replay.amountPaise === Math.round(Number(req.body?.amount) * 100)) return res.json(responseAccount(await FundAccount.findOne({ accountKey: user.sub })));
    }
    console.error("Funds error", error.message);
    return res.status(error.status || 500).json({ error: error.status ? error.message : "Could not update funds. Retry with the same request ID." });
  } finally { if (session) await session.endSession(); }
};
