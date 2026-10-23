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
  const [recoveryStage, setRecoveryStage] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const switchMode = (nextMode) => { setSearchParams(nextMode === "login" ? { mode: "login" } : {}); setRecoveryStage(""); setError(""); };
  const handleChange = ({ target: { name, value } }) => { setFormData((current) => ({ ...current, [name]: value })); setError(""); };
  const postAuth = async (payload) => {
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not continue.");
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); setError("");
    if (formData.password.length < 8) return setError("Use at least 8 characters for your password.");
    if (mode === "signup" && formData.password !== formData.confirmPassword) return setError("The passwords do not match.");
    if (mode === "signup" && !agreed) return setError("Please accept the terms to continue.");
    try {
      setIsSubmitting(true);
      const data = await postAuth({ action: mode === "signup" ? "REGISTER" : "LOGIN", name: formData.name, email: formData.email, password: formData.password });
      const destination = new URL(DASHBOARD_URL);
      destination.hash = new URLSearchParams({ handoff: data.handoff }).toString();
      window.location.assign(destination.toString());
    } catch (requestError) { setError(requestError.message); } finally { setIsSubmitting(false); }
  };

  const requestReset = async (event) => {
    event.preventDefault(); setError("");
    try { setIsSubmitting(true); const data = await postAuth({ action: "REQUEST_RESET", email: formData.email }); setDemoCode(data.resetCode || ""); setRecoveryStage("confirm"); }
    catch (requestError) { setError(requestError.message); } finally { setIsSubmitting(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault(); setError("");
    if (newPassword.length < 8) return setError("Use at least 8 characters for your new password.");
    if (newPassword !== confirmNewPassword) return setError("The new passwords do not match.");
    try {
      setIsSubmitting(true); await postAuth({ action: "RESET_PASSWORD", email: formData.email, resetCode, newPassword });
      setRecoveryStage(""); setResetCode(""); setDemoCode(""); setNewPassword(""); setConfirmNewPassword(""); setFormData((current) => ({ ...current, password: "" }));
      window.alert("Password updated. You can now log in.");
    } catch (requestError) { setError(requestError.message); } finally { setIsSubmitting(false); }
  };

  const recoveryForm = <form onSubmit={recoveryStage === "confirm" ? resetPassword : requestReset} noValidate>
    <label htmlFor="recovery-email">Registered email</label><input id="recovery-email" type="email" name="email" value={formData.email} onChange={handleChange} required disabled={recoveryStage === "confirm"} />
    {recoveryStage === "confirm" && <><p className="reset-demo-code" role="status">Demo code: <strong>{demoCode}</strong><small>Expires in 10 minutes</small></p><label htmlFor="reset-code">6-digit reset code</label><input id="reset-code" inputMode="numeric" maxLength="6" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" required /><div className="signup-password-row"><div><label htmlFor="new-password">New password</label><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" required /></div><div><label htmlFor="confirm-new-password">Confirm password</label><input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required /></div></div></>}
    {error && <p className="signup-error" role="alert">{error}</p>}<button className="signup-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : recoveryStage === "confirm" ? "Update password" : "Send reset code"}</button><p className="signup-signin"><button type="button" onClick={() => { setRecoveryStage(""); setError(""); }}>← Back to login</button></p>
  </form>;

  return <main className="signup-page"><section className="signup-shell" aria-labelledby="auth-title"><div className="signup-intro"><span className="signup-kicker">YOUR MONEY, IN ONE PLACE</span><h1>{recoveryStage ? "Recover your Stashflow account." : mode === "login" ? "Welcome back to Stashflow." : "Start building your financial future."}</h1><p>{recoveryStage ? "Reset your password securely and return to your investments." : mode === "login" ? "Log in to continue to your investments, funds, and orders." : "Create your free Stashflow account and get a clear view of your investments from day one."}</p><div className="signup-benefits"><div><span>01</span><p><strong>One simple dashboard</strong>Track holdings, positions, and orders.</p></div><div><span>02</span><p><strong>Secure access</strong>Your password is encrypted before storage.</p></div><div><span>03</span><p><strong>Ready in minutes</strong>Create an account and start exploring.</p></div></div></div><div className="signup-card">
    {!recoveryStage && <div className="auth-tabs" role="tablist"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Log in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Sign up</button></div>}
    <div className="signup-card-heading"><span className="mini-mark">S</span><div><h2 id="auth-title">{recoveryStage ? "Reset your password" : mode === "login" ? "Log in to your account" : "Create your account"}</h2><p>{recoveryStage === "confirm" ? "Enter your code and a new password." : recoveryStage ? "Use your registered email." : mode === "login" ? "Use your registered email." : "No setup fee. No paperwork."}</p></div></div>
    {recoveryStage ? recoveryForm : <><form onSubmit={handleSubmit} noValidate>{mode === "signup" && <><label htmlFor="name">Full name</label><input id="name" name="name" value={formData.name} onChange={handleChange} required /></>}<label htmlFor="email">Email address</label><input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />{mode === "signup" ? <div className="signup-password-row"><div><label htmlFor="password">Password</label><input id="password" type="password" name="password" value={formData.password} onChange={handleChange} minLength="8" required /></div><div><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required /></div></div> : <><label htmlFor="password">Password</label><input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required /><button className="forgot-password-link" type="button" onClick={() => { setRecoveryStage("request"); setError(""); }}>Forgot password?</button></>}{mode === "signup" && <label className="signup-checkbox"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /><span>I agree to the Terms of Service and Privacy Policy.</span></label>}{error && <p className="signup-error" role="alert">{error}</p>}<button className="signup-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button></form><p className="signup-signin">{mode === "login" ? "New to Stashflow? " : "Already registered? "}<button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Log in"}</button></p></>}
  </div></section></main>;
}

export default Signup;
