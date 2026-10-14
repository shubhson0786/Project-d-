import React from 'react';
function Createticket() {
    return ( 
      <div className='container'>
        <div className='row mb-5'>
            <h2>To create a ticket, select the relevent topic</h2>
        </div>
        <div className='row'>
            <div className='col-4 text-muted'>
              <h2 className='mx-2 fs-3'>Account Opening</h2>
            <ul className='p-2'>
              <a href='' style={{textDecoration:"none"}}>  Online Account Opening</a> <br/>
               <a href='' style={{textDecoration:"none"}}>Offline Account Opening</a> <br/>
               <a href='' style={{textDecoration:"none"}}> Company, Partnership and HUF Account Opening</a><br/>
               <a href='' style={{textDecoration:"none"}}>NRI Account Opening</a> <br/>
               <a href='' style={{textDecoration:"none"}}>Charges at Stashflow</a><br/> 
               <a href='' style={{textDecoration:"none"}}>Stashflow linked bank account</a> <br/>
               <a href='' style={{textDecoration:"none"}}>Getting Started</a> 
            </ul>
            </div>
           
            <div className='col-4 text-muted'>
                <h2 className='mx-2 fs-3'>Your Stashflow Account</h2>
            <ul className='p-2'>
                <a href="" style={{textDecoration:"none"}}>Login Credentials</a><br/>
                <a href="" style={{textDecoration:"none"}}> Account Modification and Segment Addition</a><br/>
                <a href="" style={{textDecoration:"none"}}>DP and Bank details</a><br/>
                <a href="" style={{textDecoration:"none"}}>Your Profile</a><br/>
                <a href="" style={{textDecoration:"none"}}>Transfer and conversion of shares</a>
            </ul>
            </div>
           
            <div className='col-4 text-muted'>
                <h2 className='mx-2 fs-3'>Trading and investing</h2>
    <ul >
      <a href="" style={{textDecoration:"none"}}>Margin/leverage, Product and Order types</a><br/>
      <a href="" style={{textDecoration:"none"}}>Stashflow Web and Mobile</a><br/>
      <a href="" style={{textDecoration:"none"}}>Trading FAQs</a><br/>
      <a href="" style={{textDecoration:"none"}}>Corporate Actions</a><br/>
      <a href="" style={{textDecoration:"none"}}>Sentinel</a><br/>
      <a href="" style={{textDecoration:"none"}}>Stashflow API</a><br/>
      <a href="" style={{textDecoration:"none"}}>Pi and other platforms</a><br/>
      <a href="" style={{textDecoration:"none"}}>Stockreports+</a><br/>
      <a href="" style={{textDecoration:"none"}}>GTT</a>
    </ul>
            </div>
        </div>
         <div className='row'>
            <div className='col-3'></div>
            <div className='col-1'></div>
            <div className='col-3'></div>
            <div className='col-1'></div>
            <div className='col-3'></div>
        </div>
      </div>
     );
}

export default Createticket;
