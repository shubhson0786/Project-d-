import React, { useEffect, useState } from "react";
import api from "../api";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/api/positions").then(({ data }) => active && setPositions(data)).catch(() => active && setError("Could not load positions."));
    return () => { active = false; };
  }, []);

  return <>
    <h3 className="title">Positions ({positions.length})</h3>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="order-table"><table><thead><tr><th>Product</th><th>Instrument</th><th>Qty.</th><th>Avg.</th><th>LTP</th><th>P&amp;L</th><th>Chg.</th></tr></thead>
      <tbody>{positions.map((stock) => {
        const profit = (stock.price - stock.avg) * stock.qty;
        return <tr key={stock._id || stock.name}><td>{stock.product}</td><td>{stock.name}</td><td>{stock.qty}</td><td>{stock.avg.toFixed(2)}</td><td>{stock.price.toFixed(2)}</td><td className={profit >= 0 ? "profit" : "loss"}>{profit.toFixed(2)}</td><td className={String(stock.day).startsWith("-") ? "loss" : "profit"}>{stock.day}</td></tr>;
      })}</tbody></table></div>
  </>;
};

export default Positions;
