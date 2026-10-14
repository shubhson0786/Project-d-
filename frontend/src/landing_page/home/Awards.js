import React from 'react';
function Awards() {
    return ( 
       <div className='container'>
        <div className='row'>
             <div className='col-6 p-5'>
                <img src='/Media/stashflow-trust.png' alt='Connected investors growing together' className='section-art'></img>
             </div>
             <div className='col-6 p-5'>
                <p className='eyebrow'>BUILT FOR EVERY INVESTOR</p>
                <h1>Clarity at every step</h1>
                <p className='text-muted fs-5 mx-auto mb-5' style={{maxWidth:"700px"}}>Stashflow brings your investments, insights, and next move together in one calm workspace.</p>
             <div className='row'>
               <div className='col-6 text-muted fs-5 mx-auto '>
                  <ul>
                     <li>Features and Options</li>
                     <li>Commodity derivatives</li>
                     <li>Currency derivation</li>
                  </ul>
               </div>
               <div className='col-6 text-muted fs-5 mx-auto  '>
                  <ul>
                     <li>Stocks & IPOs</li>
                     <li>Direct mutual funds</li>
                     <li>Bonds and Govt. Securities</li>
                  </ul>
               </div>
             </div>
             <div className='proof-strip'><span>Secure by design</span><span>Clear pricing</span><span>Human support</span></div>
             </div>
        </div>
       </div>
     );
}

export default Awards;
