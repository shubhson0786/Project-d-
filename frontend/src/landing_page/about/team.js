import React from 'react';
function Team() {
    return ( 
    <div className='container '>
        <div className='row text-center border-top p-5'>
            <h1>people</h1>
        </div>
        <div className='row text-center border-top p-5'>
            <div className='col-6 p-5'>
              <div className=''> 
                <img src='/Media/stashflow-founder.png' alt='Aarohi Mehta, founder of Stashflow' className='founder-portrait'/>
               
              </div>  
               <h4 className='mt-5'>Aarohi Mehta</h4>
                <p>Founder & CEO</p>
            </div>
            <div className='col-6 p-5'>
              
<p>
Aarohi founded Stashflow to make investing feel less intimidating and more intentional. Her vision is a transparent, low-cost platform that gives people a clear view of their money.
</p>
<p> Under her leadership, Stashflow has become a product-led community helping investors build confidence at every stage.
</p>

<p>
She contributes to market education initiatives and advocates for more inclusive financial products. Outside work, Aarohi enjoys design, long walks, and mentoring early-stage founders.
</p>

<p >
Connect with him on <a style={{textDecoration:"none"}} href='#'>Homepage</a>/<a style={{textDecoration:"none"}} href='#'>TradingQnA</a> / <a style={{textDecoration:"none"}} href='#'>Twitter</a>.
</p>
            </div>
        </div>
    </div>
     );
}

export default Team;
