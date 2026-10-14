import React from 'react';
function Hero() {
    return (
        <div className='container-fluid' id='supporthero'>
            <div className='row p-5 mt-5 mb-5 fs-6' style={{color:"white"}}><div className='col-2'> </div>
             <div className='col-4  '>
                <h4 style={{color:"white"}} className='fs-6 mb-5'>Support Portal</h4>
                <p className='text-align'>Search for an answer or browse help topics <br/>to create a ticket</p>
                <input placeholder="Eg.how do i activate F&O "style={{borderRadius:"5px",paddingRight:"80px"}}/><br/>
             
                 <a style={{color:"white",marginRight:"5px"}} href=''>Track account opening</a>
                <a style={{color:"white",marginRight:"5px"}} href=''>Track segment activation</a><br/>
                <a style={{color:"white",marginRight:"5px"}} href=''>Intraday margin</a>
                <a style={{color:"white",marginRight:"5px"}} href=''>Stashflow user guide</a>
              


             </div>
             <div className='col-2'> </div>
              <div className='col-4 '>
                <a href='' style={{color:"white"}} >Track Tickets</a>
                 <h4 className='fs-6 mt-5 '>Featured</h4>
                 <div className='row'>
                
                <ol>
                    
                    <li>
                           <a style={{color:"white",}} href=''>current Takeovers and Delisting -January 2024</a>
                    </li>
                    <li>
                           <a style={{color:"white",}} href=''>Latest Intraday bravareges-MS &CO</a>
                    </li>
                </ol>
              </div>
              </div>
             
            </div>
            

        </div>
     );
}

export default Hero;
