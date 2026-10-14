import React, { useContext, useEffect, useMemo, useState } from "react";
import api from "../api";
import GeneralContext from "./GeneralContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, mode = "BUY", marketPrice = 0 }) => {
  const { closeOrderWindow } = useContext(GeneralContext);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(marketPrice || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isBuy = mode === "BUY";
  const quantity = Number(stockQuantity);
  const price = Number(stockPrice);
  const isValid = Number.isInteger(quantity) && quantity > 0 && price > 0;
  const orderValue = useMemo(() => (isValid ? quantity * price : 0), [isValid, quantity, price]);

  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && !isSubmitting && closeOrderWindow();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOrderWindow, isSubmitting]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!isValid) {
      setError("Enter a whole quantity and a price greater than zero.");
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post("/api/orders", { name: uid, qty: quantity, price, mode });
      closeOrderWindow();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "The order could not be placed. Check the server and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-backdrop" role="presentation" onMouseDown={closeOrderWindow}>
      <form className={`order-window ${isBuy ? "order-buy" : "order-sell"}`} role="dialog" aria-modal="true" aria-labelledby="order-title" onMouseDown={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <header className="order-header">
          <div><span className="order-side">{isBuy ? "Buy" : "Sell"} order</span><h2 id="order-title">{uid}</h2><p>NSE · Regular</p></div>
          <button type="button" className="order-close" onClick={closeOrderWindow} aria-label="Close order window">×</button>
        </header>
        <div className="order-body">
          <div className="order-fields">
            <label>Quantity<input type="number" min="1" step="1" inputMode="numeric" autoFocus value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} /></label>
            <label>Limit price<div className="price-input"><span>₹</span><input type="number" min="0.05" step="0.05" inputMode="decimal" value={stockPrice} onChange={(event) => setStockPrice(event.target.value)} /></div></label>
          </div>
          <div className="order-summary"><span>Estimated order value</span><strong>₹{orderValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          {error && <p className="order-error" role="alert">{error}</p>}
        </div>
        <footer className="order-footer">
          <span>Press Esc to cancel</span>
          <div><button type="button" className="order-button secondary" onClick={closeOrderWindow} disabled={isSubmitting}>Cancel</button><button type="submit" className="order-button primary" disabled={!isValid || isSubmitting}>{isSubmitting ? "Placing…" : `${isBuy ? "Buy" : "Sell"} ${uid}`}</button></div>
        </footer>
      </form>
    </div>
  );
};

export default BuyActionWindow;
