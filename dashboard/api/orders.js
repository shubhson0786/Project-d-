const mongoose = require("mongoose");
const { connectDatabase } = require("./_database");

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, uppercase: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0.01 },
  mode: { type: String, required: true, enum: ["BUY", "SELL"] },
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await connectDatabase();
      return res.json(await Order.find().sort({ createdAt: -1 }).lean());
    } catch (error) {
      console.error("Orders API error", error);
      return res.status(500).json({ error: "Failed to load orders." });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const name = typeof req.body.name === "string" ? req.body.name.trim().toUpperCase() : "";
  const qty = Number(req.body.qty);
  const price = Number(req.body.price);
  const mode = typeof req.body.mode === "string" ? req.body.mode.toUpperCase() : "";
  if (!name || !Number.isInteger(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0 || !["BUY", "SELL"].includes(mode)) {
    return res.status(400).json({ error: "Enter a valid stock, quantity, price, and order side." });
  }
  try {
    await connectDatabase();
    const order = await Order.create({ name, qty, price, mode });
    return res.status(201).json(order);
  } catch (error) {
    console.error("Order API error", error);
    return res.status(500).json({ error: "Failed to place order." });
  }
};
