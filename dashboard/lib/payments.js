const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { ensureAccount } = require("./accounts");
const { FundAccount, PaymentOrder, responseAccount } = require("./funds");
function validSignature(body, signature, secret) {
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}
function gateway() {
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}
// Both webhook retries and browser callbacks use this transaction. Only captured
// payments with the stored amount/currency can credit their original owner.
async function creditPayment(payment, userId) {
  const stored = await PaymentOrder.findOne({ razorpayOrderId: payment.order_id, ...(userId ? { userId } : {}) });
  if (!stored?.userId) throw Object.assign(new Error("Payment order not found"), { status: 404 });
  await ensureAccount(stored.userId);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const query = { razorpayOrderId: payment.order_id };
      if (userId) query.userId = userId;
      const order = await PaymentOrder.findOne(query).session(session);
      if (!order || !order.userId) throw Object.assign(new Error("Payment order not found"), { status: 404 });
      if (payment.status !== "captured" || payment.amount !== Math.round(order.amount * 100) || payment.currency !== order.currency) {
        throw Object.assign(new Error("Payment is not captured or does not match the order"), { status: 409 });
      }
      if (order.status === "PAID") {
        if (order.paymentId !== payment.id) throw Object.assign(new Error("Payment mismatch"), { status: 409 });
        const account = await FundAccount.findOne({ accountKey: order.userId }).session(session);
        result = responseAccount(account);
        return;
      }
      // All new accounts start at zero.
      await FundAccount.updateOne({ accountKey: order.userId },
        { $setOnInsert: { balance: 0, balancePaise: 0, usedMargin: 0 } },
        { upsert: true, setDefaultsOnInsert: true, session });
      order.status = "PAID";
      order.paymentId = payment.id;
      await order.save({ session });
      const account = await FundAccount.findOneAndUpdate(
        { accountKey: order.userId },
        { $inc: { balance: order.amount, balancePaise: Math.round(order.amount * 100) }, $push: { transactions: { type: "ADD", amount: order.amount, method: "RAZORPAY", paymentId: payment.id, orderId: payment.order_id, createdAt: new Date() } } },
        { new: true, session });
      result = responseAccount(account);
    });
    return result;
  } finally { await session.endSession(); }
}
module.exports = { validSignature, gateway, creditPayment };
