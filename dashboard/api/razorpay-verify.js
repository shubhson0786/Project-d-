const crypto = require("crypto");
const mongoose = require("mongoose");
const { connectDatabase } = require("./_database");
const { FundAccount, PaymentOrder, ACCOUNT_KEY, responseAccount } = require("./_funds");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![orderId, paymentId, signature].every((value) => typeof value === "string" && value)) {
    return res.status(400).json({ error: "Incomplete payment response." });
  }
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: "Razorpay is not configured." });

  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!valid) return res.status(400).json({ error: "Payment verification failed." });

  await connectDatabase();
  const session = await mongoose.startSession();
  try {
    let response;
    await session.withTransaction(async () => {
      const order = await PaymentOrder.findOne({ razorpayOrderId: orderId }).session(session);
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (order.status === "PAID") {
        const account = await FundAccount.findOne({ accountKey: ACCOUNT_KEY }).session(session);
        response = responseAccount(account);
        return;
      }
      order.status = "PAID";
      order.paymentId = paymentId;
      await order.save({ session });
      const account = await FundAccount.findOneAndUpdate(
        { accountKey: ACCOUNT_KEY },
        { $inc: { balance: order.amount }, $push: { transactions: { type: "ADD", amount: order.amount, method: "RAZORPAY", paymentId, orderId, createdAt: new Date() } } },
        { new: true, upsert: true, setDefaultsOnInsert: true, session }
      );
      response = responseAccount(account);
    });
    return res.json(response);
  } catch (error) {
    console.error("Razorpay verification error", error);
    return res.status(error.message === "ORDER_NOT_FOUND" ? 404 : 500).json({ error: "Could not verify and record the payment." });
  } finally {
    await session.endSession();
  }
};
