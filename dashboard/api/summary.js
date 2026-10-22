const { requireUser } = require("../lib/auth");
const { connectDatabase } = require("../lib/database");
const { ensureAccount } = require("../lib/accounts");
const { responseAccount } = require("../lib/funds");
const { portfolio } = require("../lib/portfolio");
const { settleDueOrders } = require("../lib/trading");
module.exports = async (req, res) => {
  const user = requireUser(req, res); if (!user) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    await connectDatabase();
    await settleDueOrders(user.sub);
    const holdings = await portfolio(user.sub);
    const account = responseAccount(await ensureAccount(user.sub));
    const investment = holdings.reduce((sum, item) => sum + Math.round(item.costBasis * 100), 0) / 100;
    const currentValue = holdings.reduce((sum, item) => sum + Math.round(item.currentValue * 100), 0) / 100;
    return res.json({ ...account, holdingsCount: holdings.length, investment, currentValue, unrealizedProfit: Math.round((currentValue - investment) * 100) / 100, equity: Math.round((account.balance + currentValue) * 100) / 100 });
  } catch (error) { console.error(error.message); return res.status(500).json({ error: "Could not load account summary." }); }
};
