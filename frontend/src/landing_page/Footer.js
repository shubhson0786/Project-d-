import React from 'react';
import { Link } from 'react-router-dom';
export default function Footer() {
  return <footer className="site-footer"><div className="site-width"><div className="footer-main"><div><Link className="wordmark" to="/">stashflow<span>.</span></Link><p>A place to practise. Room to learn.</p></div><nav aria-label="Footer navigation"><Link to="/about">About us</Link><Link to="/products">Platform</Link><Link to="/support">Help & support</Link><Link to="/signup?mode=login">Your account</Link></nav></div><div className="footer-bottom"><span>© 2026 Stashflow</span><p>A paper-trading project for educational use. Funds, prices, and trades are simulated.</p></div></div></footer>;
}
