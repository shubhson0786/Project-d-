import React from 'react';
function Stats() {
    return (
        <div  className='container p-5 '>
            <div className='row'>
                <div className='col-6 p-5'>
                 
                    <h1 className='fs-2 mb-5'>Trust with confidence</h1>
                    <h2 className='fs-4'>Costumer-first always</h2>
                    <p className='text-muted fs-6 mx-auto'>Every detail is designed around clearer decisions and a more confident investing experience.</p>
                    
                    <h2  className='fs-4'>No spam or gimmicks</h2>
                    <p className='text-muted fs-6 mx-auto'>No gimmicks,spam,"gimification,or annoying path notification. High quality apps that you use at your pace,the way you like.</p>
                   
                    <h2 className='fs-4'>The Stashflow ecosystem</h2>
                    <p className='text-muted fs-6 mx-auto'>More than an app: investing, analytics, learning, and support that work as one.</p>
                    
                    <h2  className='fs-4'>Do better with money</h2>
                    <p className='text-muted fs-6 mx-auto'>With initiative like Nudge and Kill Switch,we don't just facillate transactions,but actively help you do better with your money</p>
                </div>
                  <div className='col-6 '>
                   <img src='/Media/stashflow-ecosystem.png' alt='The connected Stashflow investing ecosystem' className='section-art'/>
                 <div className='text-center '>
                    <a className='mx-5 fs-6 ' style={{textDecoration:"none"}}  href=''>Explore our products <i class="fa fa-long-arrow-right" aria-hidden="true"></i> </a>
                    <a href='' className='fs-6 mx-auto ml-5' style={{textDecoration:"none"}}>View the demo <i className="fa fa-long-arrow-right" aria-hidden="true"></i></a>
                 </div>
                  </div>

            </div>
        </div>
      );
}

export default Stats;
