const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { PaymentOrder } = require("../lib/funds");
const { validSignature, gateway, creditPayment } = require("../lib/payments");
module.exports = async function handler(req, res) {
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![orderId, paymentId, signature].every(value => typeof value === "string" && value)) return res.status(400).json({ error: "Incomplete payment response." });
  if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: "Razorpay is not configured." });
  if (!validSignature(`${orderId}|${paymentId}`, signature, process.env.RAZORPAY_KEY_SECRET)) return res.status(400).json({ error: "Payment verification failed." });
  try {
    await connectDatabase();
    if (!await PaymentOrder.exists({ razorpayOrderId: orderId, userId: user.sub })) return res.status(404).json({ error: "Payment order not found." });
    const payment = await gateway().payments.fetch(paymentId);
    if (payment.order_id !== orderId) return res.status(400).json({ error: "Payment order mismatch." });
    return res.json(await creditPayment(payment, user.sub));
  } catch (error) {
    console.error("Payment verification failed", error);
    return res.status(error.status || 500).json({ error: "Payment pending confirmation. Your balance will update after reconciliation." });
  }
};
