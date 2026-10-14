import React from 'react';

const tools = [
  ['Flow Themes', 'Curated thematic portfolios'],
  ['Flow Funds', 'Direct mutual fund investing'],
  ['Flow Automate', 'Rules and investing strategies'],
  ['Flow Bonds', 'Fixed-income discovery'],
  ['Flow Options', 'Options analysis tools'],
  ['Flow Protect', 'Insurance made understandable'],
];

function Universe() {
  return (
    <div className='container border-bottom py-5'>
      <div className='row text-center mb-5'>
        <p className='eyebrow'>ONE CONNECTED WORKSPACE</p>
        <h1>The Stashflow universe</h1>
        <p>Extend your investing experience with tools designed to work together.</p>
      </div>
      <div className='row g-4 mb-5'>
        {tools.map(([name, description]) => (
          <div className='col-md-4' key={name}>
            <div className='universe-card h-100'>
              <span className='mini-mark'>S</span>
              <h3 className='fs-5 mt-3'>{name}</h3>
              <p className='text-muted mb-0'>{description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className='text-center'><button className='btn btn-primary'>Start with Stashflow</button></div>
    </div>
  );
}

export default Universe;
