import React from 'react';
function Hero() {
    return ( 
        <div className='container border-bottom  '>
            <div className='row text-center mt-5 mb-5'>
               <h2>Technology</h2>
               <h4 className='text-muted mb-3'>Sleek, modern and intuitive trading platforms</h4>
               <p >Check out our <a style={{textDecoration:"none"}} href='#'>investment offerings <i class="fa fa-long-arrow-right" aria-hidden="true"></i></a></p>
            </div>
        </div>
     );
}

export default Hero;