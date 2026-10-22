import React, { useState } from "react";
import api from "../api";
import useAccountData, { accountChanged, money } from "../useAccountData";

const Orders = () => {
  const { data: orders, error, loading, refresh } = useAccountData("/api/orders", [], 3000);
  const [actionError, setActionError] = useState("");
  const [cancelling, setCancelling] = useState("");
  const cancel = async orderId => {
    setCancelling(orderId); setActionError("");
    try {
      await api.delete("/api/orders", { data: { orderId } });
      refresh(); accountChanged();
    } catch (requestError) {
      setActionError(requestError.response?.data?.error || "Could not cancel order. Refresh to check its status.");
      refresh();
    } finally { setCancelling(""); }
  };
  if (loading) return <p>Loading orders…</p>;
  if (error) return <p role="alert">{error} <button onClick={refresh}>Retry</button></p>;
  return <><h3 className="title">Orders ({orders.length})</h3><p className="paper-label">Buy fills immediately from listed user sells first, then demo inventory. Sell remains listed until another user buys. These are virtual trades, not exchange trades.</p>
    {actionError && <p role="alert" className="order-error">{actionError}</p>}
    {!orders.length ? <p>No orders yet. Add funds, then choose a stock to buy.</p> : <div className="order-table"><table><thead><tr><th>Side</th><th>Stock</th><th>Filled / Ordered</th><th>Price</th><th>Value</th><th>Status</th><th>Placed</th><th>Action</th></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td className={order.mode === "BUY" ? "profit" : "loss"}>{order.mode}</td><td>{order.name}</td><td>{order.filledQty ?? (order.status === "FILLED" ? order.qty : 0)} / {order.qty}</td><td>{money(order.price)}{order.status === "OPEN" && " est."}</td><td>{money(order.status === "OPEN" ? (order.estimatedTotalPaise ?? order.totalPaise) / 100 : (order.totalPaise == null ? order.qty * order.price : order.totalPaise / 100))}</td><td>{order.status || "LEGACY RECORD"}{order.fillSource && <small> — {order.fillSource === "USER" ? "User match" : order.fillSource === "DEMO" ? "Demo inventory" : "User + demo"}</small>}{["OPEN", "PARTIALLY_FILLED"].includes(order.status) && <small> — {order.mode === "SELL" ? "waiting for another user's buy" : "processing buy"}</small>}{order.rejectionReason && <small> — {order.rejectionReason}</small>}</td><td>{new Date(order.createdAt).toLocaleString()}</td><td>{["OPEN", "PARTIALLY_FILLED"].includes(order.status) && <button type="button" disabled={cancelling === order._id} onClick={() => cancel(order._id)}>{cancelling === order._id ? "Cancelling…" : "Cancel remaining"}</button>}</td></tr>)}</tbody></table></div>}</>;
};
export default Orders;
