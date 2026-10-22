import React, { useContext, useState } from "react";
import GeneralContext from "./GeneralContext";
import { DoughnutChart } from "./DoughnoutChart";
import useAccountData, { money } from "../useAccountData";
const WatchList = () => {
  const [query, setQuery] = useState("");
  const { data, error, loading, refresh } = useAccountData("/api/quotes");
  const { openOrderWindow } = useContext(GeneralContext);
  const stocks = (data?.quotes || []).filter(stock => stock.name.toLowerCase().includes(query.trim().toLowerCase()));
  const chartStocks = data?.quotes || [];
  const colors = ["255, 99, 132", "54, 162, 235", "255, 206, 86", "75, 192, 192", "153, 102, 255", "255, 159, 64"];
  const chartData = {
    labels: chartStocks.map(stock => stock.name),
    datasets: [{ label: "Stock price", data: chartStocks.map(stock => stock.price), backgroundColor: chartStocks.map((_, index) => `rgba(${colors[index % colors.length]}, 0.5)`), borderColor: chartStocks.map((_, index) => `rgb(${colors[index % colors.length]})`), borderWidth: 1 }],
  };
  return <aside className="watchlist-container">
    <div className="search-container"><input className="search" aria-label="Search stocks" placeholder="Search stocks, e.g. INFY" value={query} onChange={event => setQuery(event.target.value)} /><span className="counts">{stocks.length} stocks</span></div>
    <p className="paper-label">Paper user-to-user order book · simulated reference prices · refreshes every 15s</p>
    {loading && <p>Loading stocks…</p>}
    {error && <p role="alert">{error} <button onClick={refresh}>Retry</button></p>}
    <ul className="list">{stocks.map(stock => <li key={stock.name}>
      <div className="item"><strong>{stock.name}</strong><div className="item-info"><span className={stock.isDown ? "loss" : "profit"}>{stock.percent}</span><span>{money(stock.price)}</span></div><small>For you: {stock.availableToBuy || 0} shares offered · {stock.availableToSell || 0} wanted</small></div>
      <div className="stock-actions"><button className="trade-buy" onClick={() => openOrderWindow(stock.name, "BUY", stock.price)} aria-label={`Buy ${stock.name}`}>Buy</button><button className="trade-sell" onClick={() => openOrderWindow(stock.name, "SELL", stock.price)} aria-label={`Sell ${stock.name}`}>Sell</button></div>
    </li>)}</ul>
    {!loading && !stocks.length && <p className="paper-label">No matching stocks.</p>}
    {chartStocks.length > 0 && <section className="watchlist-chart" aria-label="Watchlist price chart"><h3>Watchlist prices</h3><div className="watchlist-chart-canvas"><DoughnutChart data={chartData} /></div></section>}
  </aside>;
};
export default WatchList;
