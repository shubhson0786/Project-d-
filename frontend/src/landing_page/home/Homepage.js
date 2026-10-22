import React from 'react';
import { Link } from 'react-router-dom';
import Openaccount from '../OpenAccount';
import './home.css';

const stocks = [['HDFCBANK', 'HDFC Bank', '₹1,680.50', '+1.24%'], ['INFY', 'Infosys', '₹1,842.30', '+0.86%'], ['TCS', 'Tata Consultancy Services', '₹4,125.00', '−0.32%']];
export default function Homepage() {
  return <main className="home-page">
    <section className="home-hero site-width">
      <div className="hero-copy">
        <p className="section-label"><span /> THE PAPER TRADING WORKSPACE</p>
        <h1>A little practice.<br />A clearer perspective.</h1>
        <p className="hero-description">Get to know the market by taking part. Build a portfolio, try a trade, and follow your progress with virtual money.</p>
        <div className="hero-links"><Link className="primary-link" to="/signup">Start practising <span aria-hidden="true">↗</span></Link><a className="text-link" href="#how-it-works">Take a look inside ↓</a></div>
        <p className="hero-footnote">Simulated trades. Real learning. No money at risk.</p>
      </div>
      <div className="portfolio-preview" aria-label="Illustrative portfolio with sample data">
        <div className="preview-top"><span className="preview-brand">stashflow<span>.</span></span><span className="sample-label">Demo portfolio</span></div>
        <div className="preview-heading"><span>Portfolio overview</span><span>Sample account</span></div>
        <div className="preview-value">₹1,24,850<span>.00</span></div>
        <p className="preview-gain">+₹4,850.00 (4.04%) <span>overall return</span></p>
        <svg className="portfolio-chart" viewBox="0 0 500 150" role="img" aria-label="Illustrative portfolio value fluctuating upward">
          {[30, 70, 110].map(y => <line key={y} x1="0" x2="500" y1={y} y2={y} stroke="#e9ede9" strokeDasharray="3 5" />)}
          <path d="M0 131 L18 126 L34 131 L52 112 L71 119 L90 99 L108 106 L125 95 L147 102 L166 76 L183 84 L202 70 L220 88 L239 73 L257 79 L275 48 L295 56 L312 43 L330 58 L348 38 L366 44 L387 27 L403 35 L422 15 L441 28 L460 19 L480 22 L500 8" fill="none" stroke="#28654c" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <div className="chart-axis"><span>01 JUN</span><span>15 JUN</span><span>30 JUN</span></div>
        <div className="preview-holdings"><span>Holdings</span><span>Last price / change</span></div>
        {stocks.map(([symbol, name, price, change]) => <div className="preview-stock" key={symbol}><div><strong>{symbol}</strong><small>{name}</small></div><div><strong>{price}</strong><small className={change.startsWith('−') ? 'negative' : 'positive'}>{change}</small></div></div>)}
        <div className="preview-bottom">Illustrative data · Prices are simulated</div>
      </div>
    </section>
    <div className="home-caption site-width"><span>YOUR SPACE TO LEARN THE MARKET</span><p>Watchlists. Orders. Holdings. All in one place.</p><span className="caption-number">01 — 03</span></div>
    <section id="how-it-works" className="workflow-section site-width">
      <div className="section-heading-home"><p className="section-label">FROM YOUR FIRST ORDER ONWARDS</p><h2>Learn by doing.<br />At your own pace.</h2><p>You don’t need to have it all figured out.<br />Start small, then build on what you learn.</p></div>
      <div className="workflow-list">
        {[
          ['01', 'Build your watchlist', 'Keep the stocks you are interested in close by. Compare simulated prices before deciding what to trade.'],
          ['02', 'Put an idea into practice', 'Add virtual funds and place a buy or sell order. Get familiar with the process without committing real money.'],
          ['03', 'See the bigger picture', 'Review your holdings, account balance, and profit or loss. Keep track of how each decision plays out.'],
        ].map(([number, title, description]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}
      </div>
    </section>
    <section className="practice-note site-width"><span className="note-symbol" aria-hidden="true">↗</span><div><p className="section-label">A PLACE TO FIND YOUR FEET</p><h2>Make your first trade a practice trade.</h2><p>Stashflow is a paper-trading environment. Orders and funds are simulated, so you can focus on understanding how trading works.</p></div><Link className="text-link" to="/products">Explore the platform ↗</Link></section>
    <Openaccount />
  </main>;
}
