import React, { useEffect, useState } from "react";
import { defaultProfile, initials, loadProfile, saveProfile } from "../profile";

const PUBLIC_SITE = process.env.REACT_APP_PUBLIC_SITE_URL || "https://frontend-tau-ebon-x39d4vum02.vercel.app";

const Profile = () => {
  const [profile, setProfile] = useState(loadProfile);
  const [draft, setDraft] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = ({ detail }) => { setProfile(detail); setDraft(detail); };
    window.addEventListener("stashflow:profile", sync);
    return () => window.removeEventListener("stashflow:profile", sync);
  }, []);

  const update = ({ target: { name, value } }) => {
    setDraft((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
  };

  const submit = (event) => {
    event.preventDefault();
    const next = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, String(value).trim()]));
    if (next.name.length < 2) return setError("Enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) return setError("Enter a valid email address.");
    if (next.phone && !/^\+?[0-9\s-]{8,15}$/.test(next.phone)) return setError("Enter a valid phone number.");
    saveProfile({ ...defaultProfile, ...next });
    setProfile({ ...defaultProfile, ...next });
    setEditing(false);
    setMessage("Profile updated successfully.");
  };

  const signOut = () => {
    localStorage.removeItem("stashflowUser");
    window.location.assign(`${PUBLIC_SITE}/signup?mode=login`);
  };

  return (
    <section className="profile-page">
      <header className="profile-hero">
        <div className="profile-avatar-large" aria-hidden="true">{initials(profile.name)}</div>
        <div><span className="eyebrow">Account</span><h1>{profile.name}</h1><p>{profile.email || "Complete your profile to personalize Stashflow."}</p></div>
        <button className="profile-primary" type="button" onClick={() => { setDraft(profile); setEditing(true); setMessage(""); }}>Edit profile</button>
      </header>

      {message && <p className="profile-success" role="status">{message}</p>}
      <div className="profile-grid">
        <article className="profile-card">
          <div className="profile-card-title"><h2>Personal details</h2><span>Member profile</span></div>
          <dl>
            <div><dt>Full name</dt><dd>{profile.name}</dd></div>
            <div><dt>Email</dt><dd>{profile.email || "Not added"}</dd></div>
            <div><dt>Phone</dt><dd>{profile.phone || "Not added"}</dd></div>
            <div><dt>City</dt><dd>{profile.city || "Not added"}</dd></div>
            <div><dt>Occupation</dt><dd>{profile.occupation || "Not added"}</dd></div>
          </dl>
        </article>
        <article className="profile-card profile-about">
          <div className="profile-card-title"><h2>About</h2><span>Visible only to you</span></div>
          <p>{profile.bio || "Add a short note about your investment goals and experience."}</p>
        </article>
        <article className="profile-card profile-security">
          <div><h2>Account access</h2><p>Sign out securely on this device.</p></div>
          <button type="button" onClick={signOut}>Sign out</button>
        </article>
      </div>

      {editing && <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(false)}>
        <div className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
          <div className="profile-modal-head"><div><span className="eyebrow">Your account</span><h2 id="profile-edit-title">Edit profile</h2></div><button type="button" aria-label="Close profile editor" onClick={() => setEditing(false)}>×</button></div>
          <form onSubmit={submit}>
            <div className="profile-form-grid">
              <label>Full name<input name="name" value={draft.name} onChange={update} autoComplete="name" required /></label>
              <label>Email address<input type="email" name="email" value={draft.email} onChange={update} autoComplete="email" required /></label>
              <label>Phone number<input name="phone" value={draft.phone} onChange={update} autoComplete="tel" placeholder="+91 98765 43210" /></label>
              <label>City<input name="city" value={draft.city} onChange={update} autoComplete="address-level2" placeholder="Mumbai" /></label>
              <label className="profile-wide">Occupation<input name="occupation" value={draft.occupation} onChange={update} placeholder="Student, professional, entrepreneur…" /></label>
              <label className="profile-wide">About you<textarea name="bio" value={draft.bio} onChange={update} maxLength="240" rows="4" placeholder="Your investment goals or experience" /><small>{draft.bio.length}/240</small></label>
            </div>
            {error && <p className="profile-error" role="alert">{error}</p>}
            <div className="profile-actions"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button className="profile-primary" type="submit">Save changes</button></div>
          </form>
        </div>
      </div>}
    </section>
  );
};

export default Profile;
