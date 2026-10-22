import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import GeneralContext from "./GeneralContext";
import { accountChanged, money } from "../useAccountData";
import "./BuyActionWindow.css";
const BuyActionWindow = ({ uid, mode = "BUY", marketPrice = 0 }) => {
  const { closeOrderWindow } = useContext(GeneralContext);
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(marketPrice);
  const [cash, setCash] = useState(null);
  const [owned, setOwned] = useState(0);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const key = useRef(crypto.randomUUID());
  const busy = useRef(false);
  const isBuy = mode === "BUY";
  const qty = Number(quantity);
  const valid = ready && Number.isSafeInteger(qty) && qty > 0 && qty <= 1000000 && price > 0;
  const total = Math.round(price * 100) * qty / 100;
  const affordable = isBuy ? total <= cash : qty <= owned;
  const dismiss = () => { if (!busy.current) closeOrderWindow(); };
  useEffect(() => {
    let active = true;
    Promise.all([api.get("/api/quotes"), api.get("/api/funds"), api.get("/api/holdings")])
      .then(([market, funds, holdings]) => {
        if (!active) return;
        const quote = market.data.quotes.find(stock => stock.name === uid);
        if (!quote) throw new Error("Stock unavailable.");
        setPrice(quote.price); setCash(funds.data.balance); setOwned(holdings.data.find(stock => stock.name === uid)?.qty || 0); setReady(true);
      }).catch(() => { if (active) setError("Could not load trading balance and quote. Close and retry."); });
    const escape = event => { if (event.key === "Escape" && !busy.current) closeOrderWindow(); };
    window.addEventListener("keydown", escape);
    return () => { active = false; window.removeEventListener("keydown", escape); };
  }, [uid, closeOrderWindow]);
  const submit = async event => {
    event.preventDefault();
    if (busy.current || !valid || !affordable) return;
    busy.current = true; setSubmitting(true); setError("");
    try {
      await api.post("/api/orders", { name: uid, qty, mode, orderType: "MARKET", requestId: key.current });
      accountChanged(); closeOrderWindow(); navigate("/orders");
    } catch (requestError) { setError(requestError.response?.data?.error || "Order result unknown. Retry unchanged to safely check the same order."); }
    finally { busy.current = false; setSubmitting(false); }
  };
  return <div className="order-backdrop" role="presentation" onMouseDown={dismiss}>
    <form className={`order-window ${isBuy ? "order-buy" : "order-sell"}`} role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={event => event.stopPropagation()} onSubmit={submit}>
      <header className="order-header"><div><span className="order-side">Paper {isBuy ? "buy" : "sell"}</span><h2 id="order-title">{uid}</h2><p>User-to-user paper order</p></div><button type="button" className="order-close" disabled={submitting} onClick={dismiss} aria-label="Close order">×</button></header>
      <div className="order-body"><div className="order-fields">
        <label>Quantity<input type="number" min="1" max="1000000" step="1" autoFocus disabled={submitting} value={quantity} onChange={event => { setQuantity(event.target.value); key.current = crypto.randomUUID(); setError(""); }} /></label>
        <label>Indicative price<div className="price-input"><input aria-label="Indicative market price" readOnly value={price ? price.toFixed(2) : ""} /></div></label>
      </div><p>Available cash: {cash == null ? "Loading…" : money(cash)} · Shares owned: {owned}</p>
      <div className="order-summary"><span>Estimated order value</span><strong>{money(valid ? total : 0)}</strong></div>
      {valid && !affordable && <p role="alert" className="order-error">{isBuy ? "Add funds to buy this quantity." : "You cannot sell more shares than you own."}</p>}
      <p className="paper-label">This paper order matches only with another user's opposite order for {uid}. It may remain Open or fill partly. Virtual funds and shares move only for the matched quantity. No real stock is traded.</p>
      {error && <p role="alert" className="order-error">{error}</p>}</div>
      <footer className="order-footer"><span>Paper trading</span><div><button type="button" className="order-button secondary" onClick={dismiss} disabled={submitting}>Close</button><button className="order-button primary" type="submit" disabled={!valid || !affordable || submitting}>{submitting ? "Placing…" : `Place ${isBuy ? "buy" : "sell"} order`}</button></div></footer>
    </form>
  </div>;
};
export default BuyActionWindow;
