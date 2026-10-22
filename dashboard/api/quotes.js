const { requireUser } = require("../lib/auth");
const { quotes } = require("../lib/market");
const { connectDatabase } = require("../lib/database");
const { orderBook } = require("../lib/trading");
module.exports = async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    const book = await orderBook(user.sub);
    return res.json({ source: "PAPER_USER_ORDERS", quotes: quotes().map(item => ({ ...item, availableToBuy: book[item.name]?.availableToBuy || 0, availableToSell: book[item.name]?.availableToSell || 0 })) });
  } catch (error) { console.error("Quotes error", error.message); return res.status(500).json({ error: "Could not load paper order book." }); }
};
