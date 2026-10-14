const Razorpay = require("razorpay");
const { connectDatabase } = require("./_database");
const { PaymentOrder } = require("./_funds");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const amount = Math.round(Number(req.body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 1 || amount > 500000) {
    return res.status(400).json({ error: "Enter an amount between ₹1 and ₹5,00,000." });
  }
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ error: "Razorpay test keys are not configured." });
  }

  try {
    await connectDatabase();
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `fund_${Date.now()}`,
      notes: { purpose: "Add funds" },
    });
    await PaymentOrder.create({ razorpayOrderId: order.id, amount, currency: order.currency });
    return res.status(201).json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error("Razorpay order error", error);
    return res.status(500).json({ error: "Could not start the Razorpay payment." });
  }
};
