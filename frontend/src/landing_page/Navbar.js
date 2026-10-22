import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
export default function Nav() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><nav className="site-nav site-width" aria-label="Main navigation">
    <Link className="wordmark" to="/" onClick={() => setOpen(false)}>stashflow<span>.</span></Link>
    <button className="mobile-nav-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
    <div id="main-navigation" className={'site-nav-links ' + (open ? 'is-open' : '')}>
      {[['/products', 'Platform'], ['/about', 'About us'], ['/pricing', 'Pricing'], ['/support', 'Support']].map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)}>{label}</NavLink>)}
      <Link className="nav-login" to="/signup?mode=login" onClick={() => setOpen(false)}>Log in</Link>
      <Link className="nav-signup" to="/signup" onClick={() => setOpen(false)}>Get started ↗</Link>
    </div>
  </nav></header>;
}
