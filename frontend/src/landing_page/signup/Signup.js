import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || "https://dashboard-eight-gamma-41.vercel.app";

function Signup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setSearchParams(nextMode === "login" ? { mode: "login" } : {});
    setError("");
  };

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (formData.password.length < 8) return setError("Use at least 8 characters for your password.");
    if (mode === "signup" && formData.password !== formData.confirmPassword) return setError("The passwords do not match.");
    if (mode === "signup" && !agreed) return setError("Please accept the terms to continue.");

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode === "signup" ? "REGISTER" : "LOGIN", name: formData.name, email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not continue.");
      const destination = new URL(DASHBOARD_URL);
      destination.hash = new URLSearchParams({ handoff: data.handoff }).toString();
      window.location.assign(destination.toString());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="signup-page">
      <section className="signup-shell" aria-labelledby="auth-title">
        <div className="signup-intro">
          <span className="signup-kicker">YOUR MONEY, IN ONE PLACE</span>
          <h1>{mode === "login" ? "Welcome back to Stashflow." : "Start building your financial future."}</h1>
          <p>{mode === "login" ? "Log in to continue to your investments, funds, and orders." : "Create your free Stashflow account and get a clear view of your investments from day one."}</p>
          <div className="signup-benefits" aria-label="Account benefits">
            <div><span>01</span><p><strong>One simple dashboard</strong>Track holdings, positions, and orders.</p></div>
            <div><span>02</span><p><strong>Secure access</strong>Your password is encrypted before storage.</p></div>
            <div><span>03</span><p><strong>Ready in minutes</strong>Create an account and start exploring.</p></div>
          </div>
        </div>

        <div className="signup-card">
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Log in</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Sign up</button>
          </div>
          <div className="signup-card-heading">
            <span className="mini-mark" aria-hidden="true">S</span>
            <div><h2 id="auth-title">{mode === "login" ? "Log in to your account" : "Create your account"}</h2><p>{mode === "login" ? "Use your registered email." : "No setup fee. No paperwork."}</p></div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === "signup" && <><label htmlFor="name">Full name</label><input id="name" type="text" name="name" placeholder="e.g. Aarav Sharma" value={formData.name} onChange={handleChange} autoComplete="name" required /></>}
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} autoComplete="email" required />
            {mode === "signup" ? <div className="signup-password-row">
              <div><label htmlFor="password">Password</label><input id="password" type="password" name="password" placeholder="At least 8 characters" value={formData.password} onChange={handleChange} autoComplete="new-password" minLength="8" required /></div>
              <div><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" name="confirmPassword" placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" required /></div>
            </div> : <><label htmlFor="password">Password</label><input id="password" type="password" name="password" placeholder="Your password" value={formData.password} onChange={handleChange} autoComplete="current-password" required /></>}
            {mode === "signup" && <label className="signup-checkbox"><input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); }} /><span>I agree to the Terms of Service and Privacy Policy.</span></label>}
            {error && <p className="signup-error" role="alert">{error}</p>}
            <button className="signup-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}{!isSubmitting && <span aria-hidden="true">→</span>}</button>
          </form>
          <p className="signup-signin">{mode === "login" ? "New to Stashflow? " : "Already registered? "}<button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></p>
        </div>
      </section>
    </main>
  );
}

export default Signup;
