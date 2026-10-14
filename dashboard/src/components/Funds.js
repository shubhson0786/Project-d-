import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
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
  const [account, setAccount] = useState(null);
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 1;
  const projectedBalance = useMemo(() => {
    if (!account || !validAmount || !action) return account?.balance || 0;
    return action === "ADD" ? account.balance + numericAmount : account.balance - numericAmount;
  }, [account, action, numericAmount, validAmount]);

  useEffect(() => {
    let active = true;
    api.get("/api/funds")
      .then(({ data }) => active && setAccount(data))
      .catch(() => active && setError("Could not load your funds."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!action) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && !submitting && closeDialog();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const openDialog = (nextAction) => {
    setAction(nextAction);
    setAmount("");
    setError("");
    setNotice("");
  };

  const closeDialog = () => {
    setAction(null);
    setAmount("");
    setError("");
  };

  const submitTransfer = async (event) => {
    event.preventDefault();
    setError("");
    if (!validAmount) return setError("Enter an amount of at least ₹1.");
    if (action === "WITHDRAW" && numericAmount > account.balance) {
      return setError("Withdrawal amount cannot exceed your available cash.");
    }
    try {
      setSubmitting(true);
      let data;
      if (action === "ADD") {
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
        ({ data } = await api.post("/api/funds", { type: action, amount: numericAmount, method: "BANK" }));
      }
      setAccount(data);
      setNotice(`${action === "ADD" ? "Deposit" : "Withdrawal"} of ${money(numericAmount)} completed.`);
      setAction(null);
      setAmount("");
    } catch (requestError) {
      setError(requestError.message === "PAYMENT_CANCELLED"
        ? "Payment was cancelled. Your balance was not changed."
        : requestError.response?.data?.error || requestError.message || "The transfer could not be completed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="funds-state">Loading funds…</div>;
  if (!account) return <div className="funds-state error-message" role="alert">{error}</div>;

  return (
    <div className="funds-page">
      <header className="funds-hero">
        <div><span className="eyebrow">Equity account</span><h2>Funds</h2><p>Manage your demo trading balance.</p></div>
        <div className="fund-actions">
          <button className="fund-btn add" onClick={() => openDialog("ADD")}>+ Add funds</button>
          <button className="fund-btn withdraw" onClick={() => openDialog("WITHDRAW")}>Withdraw</button>
        </div>
      </header>

      {notice && <div className="fund-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}

      <section className="balance-grid" aria-label="Fund balances">
        <article className="balance-card featured"><span>Available cash</span><strong>{money(account.balance)}</strong><small>Ready to invest or withdraw</small></article>
        <article className="balance-card"><span>Used margin</span><strong>{money(account.usedMargin)}</strong><small>Blocked against open positions</small></article>
        <article className="balance-card"><span>Total account value</span><strong>{money(account.balance + account.usedMargin)}</strong><small>Cash plus used margin</small></article>
      </section>

      <section className="fund-history">
        <div className="section-heading"><div><h3>Recent transactions</h3><p>Your latest deposits and withdrawals</p></div></div>
        {account.transactions.length ? (
          <div className="transaction-list">
            {account.transactions.map((transaction) => (
              <div className="transaction" key={transaction._id}>
                <span className={`transaction-icon ${transaction.type.toLowerCase()}`}>{transaction.type === "ADD" ? "+" : "−"}</span>
                <div><strong>{transaction.type === "ADD" ? "Funds added" : "Withdrawal"}</strong><small>{transaction.method === "RAZORPAY" ? "Razorpay Test Mode" : transaction.method === "BANK" ? "Linked bank account" : "Account balance"} · {new Date(transaction.createdAt).toLocaleString("en-IN")}</small></div>
                <span className={transaction.type === "ADD" ? "credit" : "debit"}>{transaction.type === "ADD" ? "+" : "−"}{money(transaction.amount)}</span>
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
              <label>Amount<div className="fund-amount-input"><span>₹</span><input type="number" min="1" step="0.01" autoFocus value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div></label>
              <fieldset className="payment-methods">
                <legend>Payment method</legend>
                {action === "ADD" ? (
                  <label className="selected">
                    <input type="radio" name="paymentMethod" checked readOnly />
                    <span className="method-icon upi">R</span><span><strong>Razorpay Test Checkout</strong><small>UPI, card, netbanking and wallets</small></span><b>›</b>
                  </label>
                ) : <label className="selected">
                  <input type="radio" name="paymentMethod" checked readOnly />
                  <span className="method-icon bank">₹</span><span><strong>Linked bank account</strong><small>HDFC Bank ···· 4821</small></span><b>›</b>
                </label>}
              </fieldset>
              <div className="fund-balance-row"><span>Available cash</span><strong>{money(account.balance)}</strong></div>
              {validAmount && projectedBalance >= 0 && <div className="fund-balance-row projected"><span>Balance after transfer</span><strong>{money(projectedBalance)}</strong></div>}
              {error && <p className="fund-error" role="alert">{error}</p>}
              <p className="fund-disclaimer">{action === "ADD" ? "Razorpay Test Mode: no real money will be deducted." : "Demo withdrawal only. No bank transfer will occur."}</p>
            </div>
            <div className="fund-dialog-footer"><button type="button" className="fund-cancel" onClick={closeDialog} disabled={submitting}>Cancel</button><button type="submit" className={`fund-confirm ${action === "ADD" ? "add" : "withdraw"}`} disabled={!validAmount || submitting}>{submitting ? "Processing…" : action === "ADD" ? "Pay with Razorpay" : "Withdraw"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Funds;
