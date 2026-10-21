const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { PaymentOrder } = require("../lib/funds");
const { gateway, creditPayment } = require("../lib/payments");
module.exports = async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    const pending = await PaymentOrder.find({ userId: user.sub, status: "CREATED" }).sort({ createdAt: -1 }).limit(10).lean();
    if (!pending.length) return res.json({ reconciled: 0 });
    const client = gateway();
    let reconciled = 0;
    for (const order of pending) {
      const payments = await client.orders.fetchPayments(order.razorpayOrderId);
      const payment = payments.items.find(item => item.status === "captured");
      if (payment) { await creditPayment(payment, user.sub); reconciled++; }
    }
    return res.json({ reconciled });
  } catch (error) {
    console.error("Reconciliation failed", error);
    return res.status(503).json({ error: "Payment reconciliation unavailable. Please retry." });
  }
};
