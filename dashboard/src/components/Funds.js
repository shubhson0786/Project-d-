import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import useAccountData, { accountChanged } from "../useAccountData";
import "./Funds.css";

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(window.Razorpay);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(window.Razorpay);
  script.onerror = () => reject(new Error("Could not load Razorpay Checkout."));
  document.body.appendChild(script);
});

const money = (value) => Number(value || 0).toLocaleString("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

const Funds = () => {
  const { data: account, setData: setAccount, loading, error: loadError, refresh } = useAccountData("/api/funds");
  const key = useRef(crypto.randomUUID());
  const busy = useRef(false);
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 1 && numericAmount <= 500000;
  const projectedBalance = useMemo(() => {
    if (!account || !validAmount || !action) return account?.balance || 0;
    return action === "ADD" ? account.balance + numericAmount : account.balance - numericAmount;
  }, [account, action, numericAmount, validAmount]);

  useEffect(() => {
    if (account?.paymentMode !== "razorpay_test") return;
    api.post("/api/razorpay-reconcile").then(refresh).catch(() => setError("Pending payment check unavailable. Please reopen Funds to retry."));
  }, [account?.paymentMode, refresh]);

  useEffect(() => {
    if (!action) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && !submitting && closeDialog();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const openDialog = (nextAction) => {
    key.current = crypto.randomUUID();
    setAction(nextAction);
    setAmount("");
    setError("");
    setNotice("");
  };

  const closeDialog = () => {
    if (busy.current) return;
    setAction(null);
    setAmount("");
    setError("");
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    if (!validAmount) return setError("Enter an amount between ₹1 and ₹5,00,000.");
    if (action === "WITHDRAW" && numericAmount > account.balance) {
      return setError("Withdrawal amount cannot exceed your available cash.");
    }
    try {
      busy.current = true;
      setSubmitting(true);
      let data;
      if (action === "ADD" && account.paymentMode === "razorpay_test") {
        const Razorpay = await loadRazorpay();
        const { data: order } = await api.post("/api/razorpay-order", { amount: numericAmount });
        const payment = await new Promise((resolve, reject) => {
          const checkout = new Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: "Stashflow",
            description: "Add funds to trading balance",
            order_id: order.orderId,
            handler: resolve,
            theme: { color: "#3168d8" },
            modal: { ondismiss: () => reject(new Error("PAYMENT_CANCELLED")) },
          });
          checkout.on("payment.failed", (response) => reject(new Error(response.error?.description || "Payment failed.")));
          checkout.open();
        });
        ({ data } = await api.post("/api/razorpay-verify", payment));
      } else {
        ({ data } = await api.post("/api/funds", { type: action, amount: numericAmount, requestId: key.current }));
      }
      setAccount(data);
      accountChanged();
      setNotice(`${action === "ADD" ? "Deposit" : "Withdrawal"} of ${money(numericAmount)} completed.`);
      setAction(null);
      setAmount("");
    } catch (requestError) {
      setError(requestError.message === "PAYMENT_CANCELLED"
        ? "Payment was cancelled. Your balance was not changed."
        : requestError.response?.data?.error || requestError.message || "The transfer could not be completed. Try again.");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  if (loading) return <div className="funds-state">Loading funds…</div>;
  if (!account) return <div className="funds-state error-message" role="alert">{loadError || error}<button onClick={refresh}>Retry</button></div>;

  return (
    <div className="funds-page">
      <header className="funds-hero">
        <div><span className="eyebrow">Equity account</span><h2>Funds</h2><p>Add paper funds, buy stocks, and withdraw unused cash. Every account starts at zero.</p></div>
        <div className="fund-actions">
          <button className="fund-btn add" onClick={() => openDialog("ADD")}>+ Add funds</button>
          <button className="fund-btn withdraw" onClick={() => openDialog("WITHDRAW")}>Withdraw</button>
        </div>
      </header>

      {(error || loadError) && !action && <p role="alert" className="fund-error">{error || loadError}</p>}
      {notice && <div className="fund-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}

      <section className="balance-grid" aria-label="Fund balances">
        <article className="balance-card featured"><span>Available cash</span><strong>{money(account.balance)}</strong><small>Ready to invest or withdraw</small></article>
        <article className="balance-card"><span>Realized P&amp;L</span><strong>{money(account.realizedProfit)}</strong><small>Profit or loss from completed sales</small></article>
        <article className="balance-card"><span>Funding mode</span><strong style={{ fontSize: "20px" }}>{account.paymentMode === "paper" ? "Paper wallet" : "Razorpay Test"}</strong><small>No real money or bank payouts</small></article>
      </section>

      <section className="fund-history">
        <div className="section-heading"><div><h3>Recent transactions</h3><p>Deposits, withdrawals, buys, and sells</p></div></div>
        {account.transactions.length ? (
          <div className="transaction-list">
            {account.transactions.map((transaction) => (
              <div className="transaction" key={transaction._id}>
                <span className={`transaction-icon ${transaction.type.toLowerCase()}`}>{["ADD", "SELL"].includes(transaction.type) ? "+" : "−"}</span>
                <div><strong>{transaction.type === "ADD" ? "Funds added" : transaction.type === "WITHDRAW" ? "Withdrawal" : `${transaction.type === "BUY" ? "Bought" : "Sold"} ${transaction.qty} ${transaction.symbol}`}</strong><small>{transaction.method === "RAZORPAY" ? "Razorpay Test Mode" : transaction.method === "TRADE" ? "Paper market fill" : "Paper wallet"} · {new Date(transaction.createdAt).toLocaleString("en-IN")}</small></div>
                <span className={["ADD", "SELL"].includes(transaction.type) ? "credit" : "debit"}>{["ADD", "SELL"].includes(transaction.type) ? "+" : "−"}{money(transaction.amount)}</span>
              </div>
            ))}
          </div>
        ) : <div className="empty-transactions">No fund transactions yet.</div>}
      </section>

      {action && (
        <div className="fund-dialog-backdrop" onMouseDown={closeDialog} role="presentation">
          <form className="fund-dialog" onSubmit={submitTransfer} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="fund-dialog-title">
            <div className="fund-dialog-header"><div><span>{action === "ADD" ? "Deposit" : "Withdrawal"}</span><h3 id="fund-dialog-title">{action === "ADD" ? "Add funds" : "Withdraw funds"}</h3></div><button type="button" onClick={closeDialog} aria-label="Close">×</button></div>
            <div className="fund-dialog-body">
              <label>Amount<div className="fund-amount-input"><span>₹</span><input type="number" min="1" step="0.01" autoFocus value={amount} disabled={submitting} onChange={(event) => { setAmount(event.target.value); key.current = crypto.randomUUID(); }} placeholder="0.00" /></div></label>
              <fieldset className="payment-methods">
                <legend>Payment method</legend>
                {action === "ADD" ? (
                  <label className="selected">
                    <input type="radio" name="paymentMethod" checked readOnly />
                    <span className="method-icon upi">R</span><span><strong>{account.paymentMode === "paper" ? "Paper wallet deposit" : "Razorpay Test Checkout"}</strong><small>{account.paymentMode === "paper" ? "Instant simulated funds" : "Test payment methods"}</small></span><b>›</b>
                  </label>
                ) : <label className="selected">
                  <input type="radio" name="paymentMethod" checked readOnly />
                  <span className="method-icon bank">₹</span><span><strong>Paper wallet withdrawal</strong><small>Deduct funds from your available cash</small></span><b>›</b>
                </label>}
              </fieldset>
              <div className="fund-balance-row"><span>Available cash</span><strong>{money(account.balance)}</strong></div>
              {validAmount && projectedBalance >= 0 && <div className="fund-balance-row projected"><span>Balance after transfer</span><strong>{money(projectedBalance)}</strong></div>}
              {error && <p className="fund-error" role="alert">{error}</p>}
              <p className="fund-disclaimer">{"Simulation only. No real money is added, deducted, or transferred to a bank."}</p>
            </div>
            <div className="fund-dialog-footer"><button type="button" className="fund-cancel" onClick={closeDialog} disabled={submitting}>Cancel</button><button type="submit" className={`fund-confirm ${action === "ADD" ? "add" : "withdraw"}`} disabled={!validAmount || submitting}>{submitting ? "Processing…" : action === "ADD" ? (account.paymentMode === "paper" ? "Add paper funds" : "Pay with Razorpay Test") : "Withdraw paper funds"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Funds;
