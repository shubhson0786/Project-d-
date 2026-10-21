import React, { useContext, useState } from "react";
import GeneralContext from "./GeneralContext";
import useAccountData, { money } from "../useAccountData";
const WatchList = () => {
  const [query, setQuery] = useState("");
  const { data, error, loading, refresh } = useAccountData("/api/quotes");
  const { openOrderWindow } = useContext(GeneralContext);
  const stocks = (data?.quotes || []).filter(stock => stock.name.toLowerCase().includes(query.trim().toLowerCase()));
  return <aside className="watchlist-container">
    <div className="search-container"><input className="search" aria-label="Search stocks" placeholder="Search stocks, e.g. INFY" value={query} onChange={event => setQuery(event.target.value)} /><span className="counts">{stocks.length} stocks</span></div>
    <p className="paper-label">Paper market · simulated prices · refreshes every 15s</p>
    {loading && <p>Loading stocks…</p>}
    {error && <p role="alert">{error} <button onClick={refresh}>Retry</button></p>}
    <ul className="list">{stocks.map(stock => <li key={stock.name}>
      <div className="item"><strong>{stock.name}</strong><div className="item-info"><span className={stock.isDown ? "loss" : "profit"}>{stock.percent}</span><span>{money(stock.price)}</span></div></div>
      <div className="stock-actions"><button className="trade-buy" onClick={() => openOrderWindow(stock.name, "BUY", stock.price)} aria-label={`Buy ${stock.name}`}>Buy</button><button className="trade-sell" onClick={() => openOrderWindow(stock.name, "SELL", stock.price)} aria-label={`Sell ${stock.name}`}>Sell</button></div>
    </li>)}</ul>
    {!loading && !stocks.length && <p className="paper-label">No matching stocks.</p>}
  </aside>;
};
export default WatchList;
