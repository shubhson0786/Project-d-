import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../api";
import useAccountData from "../useAccountData";
import { clearProfile, initials, loadProfile, saveProfile } from "../profile";
const PUBLIC_SITE = process.env.REACT_APP_PUBLIC_SITE_URL || "http://localhost:3000";
const editable = ["name", "phone", "city", "occupation", "bio"];
const Profile = () => {
  const { userId } = useParams();
  const { data: profile, error: loadError, loading, refresh, setData } = useAccountData("/api/profile", loadProfile());
  const [draft, setDraft] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!profile?.id) return;
    saveProfile(profile);
    if (!editing) setDraft(profile);
  }, [profile, editing]);
  const close = () => { if (!busy.current) { setEditing(false); setError(""); } };
  const update = ({ target: { name, value } }) => { setDraft(current => ({ ...current, [name]: value })); setError(""); setMessage(""); };
  const submit = async event => {
    event.preventDefault(); if (busy.current) return;
    const next = Object.fromEntries(editable.map(key => [key, String(draft[key] || "").trim()]));
    if (next.name.length < 2) return setError("Enter your full name.");
    busy.current = true; setSaving(true); setError("");
    try {
      const { data } = await api.patch("/api/profile", next);
      setData(data); saveProfile(data); setEditing(false); setMessage("Your profile has been saved to your account.");
    } catch (requestError) { setError(requestError.response?.data?.error || "Could not save your profile. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  };
  const signOut = async () => {
    if (busy.current) return;
    busy.current = true;
    try { await api.delete("/api/session"); clearProfile(); window.location.assign(`${PUBLIC_SITE}/signup?mode=login`); }
    catch { setError("Could not sign out. Please retry."); }
    finally { busy.current = false; }
  };
  if (loading) return <p>Loading your profile…</p>;
  if (loadError) return <p role="alert">{loadError} <button onClick={refresh}>Retry</button></p>;
  if (!userId) return <Navigate to={`/profile/${profile.id}`} replace />;
  if (userId !== profile.id) return <section><h2>This profile is private</h2><p>You can view and edit your own account profile.</p><Link to={`/profile/${profile.id}`}>Go to my profile</Link></section>;
  return <section className="profile-page">
    <header className="profile-hero">
      <div className="profile-avatar-large" aria-hidden="true">{initials(profile.name)}</div>
      <div><span className="eyebrow">Your account</span><h1>{profile.name}</h1><p>{profile.email}</p><p className="profile-id">User ID: <code>{profile.id}</code></p></div>
      <button className="profile-primary" type="button" onClick={() => { setDraft(profile); setEditing(true); setMessage(""); setError(""); }}>Edit profile</button>
    </header>
    {message && <p className="profile-success" role="status">{message}</p>}
    {error && !editing && <p className="profile-error" role="alert">{error}</p>}
    <div className="profile-grid">
      <article className="profile-card"><div className="profile-card-title"><h2>Personal details</h2><span>Private profile</span></div><dl>
        <div><dt>Full name</dt><dd>{profile.name}</dd></div><div><dt>Login email</dt><dd>{profile.email}</dd></div>
        <div><dt>Phone</dt><dd>{profile.phone || "Not added"}</dd></div><div><dt>City</dt><dd>{profile.city || "Not added"}</dd></div>
        <div><dt>Occupation</dt><dd>{profile.occupation || "Not added"}</dd></div>
        <div><dt>Member since</dt><dd>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Not available"}</dd></div>
      </dl></article>
      <article className="profile-card profile-about"><div className="profile-card-title"><h2>About</h2><span>Visible only to you</span></div><p style={{ whiteSpace: "pre-wrap" }}>{profile.bio || "Add a short note about your investment goals and experience."}</p></article>
      <article className="profile-card profile-security"><div><h2>Account access</h2><p>Your profile is linked to your unique user ID and saved across logins.</p></div><button type="button" onClick={signOut}>Sign out</button></article>
    </div>
    {editing && <div className="profile-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
        <div className="profile-modal-head"><div><span className="eyebrow">Your account</span><h2 id="profile-edit-title">Edit profile</h2></div><button type="button" disabled={saving} aria-label="Close profile editor" onClick={close}>×</button></div>
        <form onSubmit={submit}><div className="profile-form-grid">
          <label>Full name<input name="name" value={draft.name} onChange={update} maxLength={80} autoComplete="name" disabled={saving} required /></label>
          <label>Login email<input type="email" value={profile.email} readOnly autoComplete="email" /><small>Your registered login email</small></label>
          <label>Phone number<input name="phone" value={draft.phone} onChange={update} maxLength={24} autoComplete="tel" disabled={saving} placeholder="+91 98765 43210" /></label>
          <label>City<input name="city" value={draft.city} onChange={update} maxLength={80} autoComplete="address-level2" disabled={saving} placeholder="Mumbai" /></label>
          <label className="profile-wide">Occupation<input name="occupation" value={draft.occupation} onChange={update} maxLength={100} disabled={saving} placeholder="Student, professional, entrepreneur…" /></label>
          <label className="profile-wide">About you<textarea name="bio" value={draft.bio} onChange={update} maxLength={240} rows={4} disabled={saving} placeholder="Your investment goals or experience" /><small>{draft.bio.length}/240</small></label>
        </div>{error && <p className="profile-error" role="alert">{error}</p>}
        <div className="profile-actions"><button type="button" disabled={saving} onClick={close}>Cancel</button><button className="profile-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form>
      </div>
    </div>}
  </section>;
};
export default Profile;
