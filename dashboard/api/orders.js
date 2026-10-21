const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { Order } = require("../lib/trading-models");
const { executeOrder } = require("../lib/trading");
module.exports = async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    if (req.method === "GET") return res.json(await Order.find({ userId: user.sub }).sort({ createdAt: -1 }).limit(200).lean());
    return res.status(201).json(await executeOrder(user.sub, req.body || {}));
  } catch (error) {
    console.error("Order error", error.message);
    return res.status(error.status || 500).json({ error: error.status ? error.message : "Could not execute order. Retry with the same request ID." });
  }
};
