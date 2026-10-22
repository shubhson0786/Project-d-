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
  return <><h3 className="title">Orders ({orders.length})</h3><p className="paper-label">Paper orders start Open, then fill at a simulated quote or get rejected. Prices can change before fill. No exchange order book or real stock is involved.</p>
    {actionError && <p role="alert" className="order-error">{actionError}</p>}
    {!orders.length ? <p>No orders yet. Add funds, then choose a stock to buy.</p> : <div className="order-table"><table><thead><tr><th>Side</th><th>Stock</th><th>Quantity</th><th>Price</th><th>Value</th><th>Status</th><th>Placed</th><th>Action</th></tr></thead><tbody>{orders.map(order => <tr key={order._id}><td className={order.mode === "BUY" ? "profit" : "loss"}>{order.mode}</td><td>{order.name}</td><td>{order.qty}</td><td>{money(order.price)}{order.status === "OPEN" && " est."}</td><td>{money(order.totalPaise == null ? order.qty * order.price : order.totalPaise / 100)}</td><td>{order.status || "LEGACY RECORD"}{order.rejectionReason && <small> — {order.rejectionReason}</small>}</td><td>{new Date(order.createdAt).toLocaleString()}</td><td>{order.status === "OPEN" && <button type="button" disabled={cancelling === order._id} onClick={() => cancel(order._id)}>{cancelling === order._id ? "Cancelling…" : "Cancel"}</button>}</td></tr>)}</tbody></table></div>}</>;
};
export default Orders;
