const { Holding } = require("./trading-models");
const { quotes } = require("./market");
async function portfolio(userId) {
  const holdings = await Holding.find({ userId }).lean();
  const prices = new Map(quotes().map(item => [item.name, item]));
  return holdings.filter(item => item.qty > 0).map(item => {
    const cost = item.costBasisPaise ?? Math.round((item.avg || 0) * item.qty * 100);
    const market = prices.get(item.name);
    const price = market?.price ?? cost / item.qty / 100;
    return { ...item, avg: cost / item.qty / 100, price, costBasis: cost / 100, currentValue: Math.round(price * 100) * item.qty / 100, net: cost ? `${((price * item.qty * 100 / cost - 1) * 100).toFixed(2)}%` : "0.00%", day: market?.percent || "0.00%", product: "DELIVERY", quoteSource: market ? "SIMULATED" : "UNAVAILABLE" };
  });
}
module.exports = { portfolio };
