import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/api/orders").then(({ data }) => active && setOrders(data)).catch(() => active && setError("Could not load orders."));
    return () => { active = false; };
  }, []);

  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!orders.length) return <div className="orders"><div className="no-orders"><p>You haven't placed any orders yet</p><Link to="/" className="btn">Get started</Link></div></div>;
  return <><h3 className="title">Orders ({orders.length})</h3><div className="order-table"><table><thead><tr><th>Type</th><th>Instrument</th><th>Qty.</th><th>Price</th><th>Placed</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id}><td className={order.mode === "BUY" ? "profit" : "loss"}>{order.mode}</td><td>{order.name}</td><td>{order.qty}</td><td>{Number(order.price).toFixed(2)}</td><td>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</td></tr>)}</tbody></table></div></>;
};

export default Orders;
