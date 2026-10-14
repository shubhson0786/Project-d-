import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { VerticalGraph } from "./VerticalGraph";

const money = (value) => Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Holdings = () => {
  const [holdings, setHoldings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/api/holdings")
      .then(({ data }) => active && setHoldings(data))
      .catch(() => active && setError("Could not load holdings. Check that the backend is running."));
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => holdings.reduce((result, stock) => ({
    investment: result.investment + stock.avg * stock.qty,
    current: result.current + stock.price * stock.qty,
  }), { investment: 0, current: 0 }), [holdings]);
  const profit = totals.current - totals.investment;
  const profitPercent = totals.investment ? (profit / totals.investment) * 100 : 0;
  const chartData = {
    labels: holdings.map((stock) => stock.name),
    datasets: [{ label: "Stock price", data: holdings.map((stock) => stock.price), backgroundColor: "rgba(65, 132, 243, 0.55)" }],
  };

  return <>
    <h3 className="title">Holdings ({holdings.length})</h3>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="order-table"><table>
      <thead><tr><th>Instrument</th><th>Qty.</th><th>Avg. cost</th><th>LTP</th><th>Cur. val</th><th>P&amp;L</th><th>Net chg.</th><th>Day chg.</th></tr></thead>
      <tbody>{holdings.map((stock) => {
        const current = stock.price * stock.qty;
        const stockProfit = current - stock.avg * stock.qty;
        const dayLoss = String(stock.day).startsWith("-");
        return <tr key={stock._id || stock.name}><td>{stock.name}</td><td>{stock.qty}</td><td>{money(stock.avg)}</td><td>{money(stock.price)}</td><td>{money(current)}</td><td className={stockProfit >= 0 ? "profit" : "loss"}>{money(stockProfit)}</td><td className={stockProfit >= 0 ? "profit" : "loss"}>{stock.net}</td><td className={dayLoss ? "loss" : "profit"}>{stock.day}</td></tr>;
      })}</tbody>
    </table></div>
    <div className="row"><div className="col"><h5>{money(totals.investment)}</h5><p>Total investment</p></div><div className="col"><h5>{money(totals.current)}</h5><p>Current value</p></div><div className="col"><h5 className={profit >= 0 ? "profit" : "loss"}>{money(profit)} ({profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%)</h5><p>P&amp;L</p></div></div>
    {holdings.length > 0 && <VerticalGraph data={chartData} />}
  </>;
};

export default Holdings;
