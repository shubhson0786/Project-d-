// Sample prices for paper trading. These are not live exchange quotes.
const catalog = {"INFY": 1555.45, "ONGC": 116.8, "TCS": 3194.8, "KPITTECH": 266.45, "QUICKHEAL": 308.55, "WIPRO": 577.75, "M&M": 779.8, "RELIANCE": 2112.4, "HUL": 512.4, "BHARTIARTL": 541.15, "HDFCBANK": 1522.35, "HINDUNILVR": 2417.4, "ITC": 207.9, "SBIN": 430.2, "TATAPOWER": 124.15};
function quotes(now = Date.now()) {
  const tick = Math.floor(now / 15000);
  return Object.entries(catalog).map(([name, base], index) => {
    const pricePaise = Math.round(base * 100 * (1 + Math.sin(tick / 8 + index) * 0.004));
    const change = (pricePaise / (base * 100) - 1) * 100;
    return { name, price: pricePaise / 100, pricePaise, percent: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`, isDown: change < 0, asOf: new Date(tick * 15000).toISOString(), source: "SIMULATED" };
  });
}
function quote(name) { return quotes().find(item => item.name === name); }
function simulatedLiquidity(name, mode, now = Date.now()) {
  const names = Object.keys(catalog);
  const index = names.indexOf(name);
  if (index < 0 || !["BUY", "SELL"].includes(mode)) return null;
  const tick = Math.floor(now / 15000);
  // Sparse, deterministic demo counterparties: sell orders need buyers;
  // buy orders need sellers. This is not real exchange depth.
  const active = tick % 4 === (index + (mode === "SELL" ? 2 : 0)) % 4;
  return { tick, availableQty: active ? 1 + ((tick + index) % 3) : 0 };
}
module.exports = { quotes, quote, simulatedLiquidity };
