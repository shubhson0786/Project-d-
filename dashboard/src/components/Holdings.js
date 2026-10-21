import React, { useContext } from "react";
import GeneralContext from "./GeneralContext";
import useAccountData, { money } from "../useAccountData";
const Holdings = ({ positions = false }) => {
  const { data: holdings, error, loading, refresh } = useAccountData("/api/holdings", []);
  const { openOrderWindow } = useContext(GeneralContext);
  if (loading) return <p>Loading portfolio…</p>;
  if (error) return <p role="alert">{error} <button onClick={refresh}>Retry</button></p>;
  const investment = holdings.reduce((total, stock) => total + stock.costBasis, 0);
  const currentValue = holdings.reduce((total, stock) => total + stock.currentValue, 0);
  const profit = currentValue - investment;
  return <><h3 className="title">{positions ? "Open delivery positions" : "Holdings"} ({holdings.length})</h3><p className="paper-label">Valued at simulated market prices. Short selling and intraday margin are not enabled.</p>
    {!holdings.length ? <p>You do not own any shares yet. Buy a stock from the watchlist to get started.</p> : <div className="order-table"><table><thead><tr><th>Stock</th><th>Qty</th><th>Avg. cost</th><th>Market price</th><th>Value</th><th>P&amp;L</th><th>Trade</th></tr></thead><tbody>{holdings.map(stock => <tr key={stock._id}><td>{stock.name}</td><td>{stock.qty}</td><td>{money(stock.avg)}</td><td>{money(stock.price)}</td><td>{money(stock.currentValue)}</td><td className={stock.currentValue >= stock.costBasis ? "profit" : "loss"}>{money(stock.currentValue - stock.costBasis)}</td><td><div className="stock-actions"><button className="trade-buy" disabled={stock.quoteSource !== "SIMULATED"} onClick={() => openOrderWindow(stock.name, "BUY", stock.price)}>Buy</button><button className="trade-sell" disabled={stock.quoteSource !== "SIMULATED"} onClick={() => openOrderWindow(stock.name, "SELL", stock.price)}>Sell</button></div></td></tr>)}</tbody></table></div>}
    {!positions && holdings.length > 0 && <>
      <div className="holdings-totals"><div><strong>{money(investment)}</strong><p>Total investment</p></div><div><strong>{money(currentValue)}</strong><p>Current value</p></div><div><strong className={profit >= 0 ? "profit" : "loss"}>{money(profit)} ({investment ? (profit / investment * 100).toFixed(2) : "0.00"}%)</strong><p>P&amp;L</p></div></div>
    </>}
  </>;
};
export default Holdings;
