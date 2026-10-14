import React from 'react';

function Footer() {
  return (
    <footer className='site-footer'>
      <div className='container border-top py-5'>
        <div className='row g-4'>
          <div className='col-md-5'>
            <div className='stashflow-brand mb-3'><span className='brand-mark'>S</span><span>Stashflow</span></div>
            <p className='text-muted'>A calmer, clearer way to invest, learn, and grow.</p>
            <p className='small text-muted'>© 2026 Stashflow. All rights reserved.</p>
          </div>
          <div className='col-md-2'><h3 className='fs-6'>Company</h3><p className='text-muted'>About<br/>Products<br/>Pricing<br/>Careers</p></div>
          <div className='col-md-2'><h3 className='fs-6'>Support</h3><p className='text-muted'>Help centre<br/>Contact<br/>Status<br/>Resources</p></div>
          <div className='col-md-3'><h3 className='fs-6'>Account</h3><p className='text-muted'>Open an account<br/>Transfer funds<br/>Security</p></div>
        </div>
        <p className='small text-muted mt-5'>Investments in securities markets are subject to market risks. Information on this website is educational and is not financial advice. Please review applicable documents and consult a qualified adviser before investing.</p>
      </div>
    </footer>
  );
}

export default Footer;
