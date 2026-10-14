import React from "react";
import { Link } from "react-router-dom";
function Hero() {
  return (
    <div className="container">
      <div className="row text-center mt-5">
        <h1 className="mt-5 fs-3 p-5">
          We pioneered the discount broking model in india.<br/> Now, we are breaking
          ground with our technology
        </h1>
      </div>
      <div className="row text-center mb-5 border-top">
       <div className="col-md-6 p-5 text-muted " style={{lineHeight:"1.8", fontSize:"1.2em"}}>  
              <p>
Stashflow started with one goal: remove the clutter that keeps people from making confident financial decisions. Our name reflects a simple idea — your savings should move with purpose, not sit behind jargon and friction. </p>
<p> Today, our disruptive pricing models and in-house technology have made us the largest stock broker in India, empowering millions of users to take control of their financial future.
</p>

<p>
Over 1 crore clients place millions of orders every day through our powerful ecosystem of investment platforms, contributing to a significant share of the daily retail trading volumes in India. Our mission is to simplify investing and make financial markets accessible to everyone.
</p>
       </div>
       <div className="col-md-6 p-5 text-muted "  style={{lineHeight:"1.8", fontSize:"1.2em"}}>
        <p>
In addition, we run a number of popular open online educational and community initiatives to empower retail traders and investors. Through these initiatives, we aim to spread financial literacy and help individuals make informed investment decisions.
</p>

<p>
<Link to="/rainmatter">Rainmatter</Link>, our fintech fund and incubator, has invested in several fintech startups with the goal of growing the Indian capital markets ecosystem. We continue to innovate and stay ahead by building products that are simple, powerful, and transparent for our users.
</p>

<p>
And yet, we are always up to something new every day. Catch up on the latest updates on our blog or see what the media is saying about us.
</p>
       </div>
      </div>
    </div>
  );
}

export default Hero;
