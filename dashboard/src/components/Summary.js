import React from "react";
import { Link } from "react-router-dom";
import { loadProfile } from "../profile";
import useAccountData, { money } from "../useAccountData";
const Summary = () => {
  const { data, error, loading, refresh } = useAccountData("/api/summary");
  if (loading) return <p>Loading your account…</p>;
  if (error) return <p role="alert">{error} <button onClick={refresh}>Retry</button></p>;
  return <section><div className="username"><h2>Hi, {loadProfile().name}!</h2><p>Your paper trading account</p></div>
    <div className="balance-grid summary-grid">
      <article className="balance-card featured"><span>Available cash</span><strong>{money(data.balance)}</strong><Link to="/funds">Add or withdraw funds →</Link></article>
      <article className="balance-card"><span>Total equity</span><strong>{money(data.equity)}</strong><small>Cash plus current holdings</small></article>
      <article className="balance-card"><span>Holdings ({data.holdingsCount})</span><strong>{money(data.currentValue)}</strong><small>Invested {money(data.investment)}</small></article>
      <article className="balance-card"><span>Unrealized P&amp;L</span><strong className={data.unrealizedProfit >= 0 ? "profit" : "loss"}>{money(data.unrealizedProfit)}</strong><small>Based on simulated quotes</small></article>
      <article className="balance-card"><span>Realized P&amp;L</span><strong className={data.realizedProfit >= 0 ? "profit" : "loss"}>{money(data.realizedProfit)}</strong><small>Profit or loss on completed sales</small></article>
    </div>
    {!data.holdingsCount && <div className="empty-transactions"><h3>Make your first trade</h3><p>Add paper funds, then choose Buy beside a stock in the watchlist.</p><Link to="/funds">Add funds →</Link></div>}
  </section>;
};
export default Summary;
