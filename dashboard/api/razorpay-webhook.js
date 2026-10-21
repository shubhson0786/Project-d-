const { connectDatabase } = require("../lib/database");
const { validSignature, creditPayment } = require("../lib/payments");
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).json({ error: "Webhook not configured" });
  try {
    // Express provides a Buffer; Vercel may expose a lazy parsed body getter.
    // Read data/end directly so its restored raw stream retains the signed bytes.
    let raw = Object.getOwnPropertyDescriptor(req, "body")?.value;
    if (!Buffer.isBuffer(raw)) {
      raw = await new Promise((resolve, reject) => {
        const chunks = [];
        let length = 0;
        req.on("data", chunk => {
          length += Buffer.byteLength(chunk);
          if (length > 1048576) { reject(Object.assign(new Error("Payload too large"), { status: 413 })); return; }
          chunks.push(Buffer.from(chunk));
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
      });
    }
    if (!validSignature(raw, req.headers["x-razorpay-signature"], process.env.RAZORPAY_WEBHOOK_SECRET)) return res.status(400).json({ error: "Invalid webhook signature" });
    let event;
    try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ error: "Invalid payload" }); }
    if (event.event !== "payment.captured") return res.json({ received: true });
    const payment = event.payload?.payment?.entity;
    if (!payment?.id || !payment?.order_id) return res.status(400).json({ error: "Incomplete payment" });
    await connectDatabase();
    await creditPayment(payment);
    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook failed", error);
    // Non-2xx preserves Razorpay's retry behaviour on database failures.
    return res.status(error.status || 500).json({ error: "Payment recording failed; retry delivery" });
  }
};
