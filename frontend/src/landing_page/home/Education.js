import React from 'react';
function Education() {
    return (  
        <div className='container'>
            <div className='row p-5'>
                <div className='col-6'>
                       <img src='/Media/stashflow-learning.png' alt='Financial learning made visual and approachable' className='section-art'/>
                </div>
                 <div className='col-6'>
                     <h1 className='fs-2 mb-5'>Free and open market education</h1>
                     <p className='text-muted fs-6 '>Flow School turns market basics and advanced investing ideas into focused, approachable lessons.</p>
                       <div className=' mt-5'>
                    <a className=' fs-6 ' style={{textDecoration:"none"}} href=''>Explore Flow School <i className="fa fa-long-arrow-right" aria-hidden="true"></i> </a>
                    
                 </div>
                     <p className='text-muted fs-6 '>Learn at your pace, test an idea, and return to your portfolio with more confidence.</p>
                   <div className='mt-5'>
                    <a className=' fs-6 ' style={{textDecoration:"none"}}  href=''>Trading Q&A <i class="fa fa-long-arrow-right" aria-hidden="true"></i> </a>
                   
                 </div>
                 </div>
            </div>
        </div>
    );
}

export default Education;
