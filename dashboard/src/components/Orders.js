import React from "react";
import useAccountData, { money } from "../useAccountData";
const Orders = () => {
  const { data: orders, error, loading, refresh } = useAccountData("/api/orders", []);
  if (loading) return <p>Loading orders…</p>;
  if (error) return <p role="alert">{error} <button onClick={refresh}>Retry</button></p>;
  return <><h3 className="title">Orders ({orders.length})</h3><p className="paper-label">Latest 200 orders · paper market fills</p>
    {!orders.length ? <p>No orders yet. Add funds, then choose a stock to buy.</p> : <div className="order-table"><table><thead><tr><th>Side</th><th>Stock</th><th>Quantity</th><th>Fill price</th><th>Value</th><th>Status</th><th>Time</th></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td className={order.mode === "BUY" ? "profit" : "loss"}>{order.mode}</td><td>{order.name}</td><td>{order.qty}</td><td>{money(order.price)}</td><td>{money(order.totalPaise == null ? order.qty * order.price : order.totalPaise / 100)}</td><td>{order.status || "LEGACY RECORD"}</td><td>{new Date(order.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</>;
};
export default Orders;
