import React from 'react';
import { Link } from 'react-router-dom';
export default function Openaccount() {
  return <section className="account-invitation site-width"><div><h2>Your next step starts here.</h2><p>Create an account and make yourself at home.</p></div><Link className="primary-link" to="/signup">Create an account <span aria-hidden="true">↗</span></Link></section>;
}
