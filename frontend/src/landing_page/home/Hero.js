import React from 'react';
import { Link } from 'react-router-dom';
function Hero() {
    return ( 
       <div className='container p-5 mb-5 '>
        <div className='row text-center'>
             <img src='/Media/stashflow-hero.png' alt='A clear view of a growing investment portfolio' className='mb-5 section-art hero-art'></img>
             <p className='eyebrow'>INVESTING, WITHOUT THE NOISE</p>
             <h1 className='display-4 fw-semibold'>Let your money find its flow.</h1>
             <p className='text-muted fs-5 mx-auto'>One thoughtfully designed place to invest in stocks, funds, and more.</p>
             <Link to='/signup' className='p-2 btn btn-primary fs-5 mb-5' style={{width: '20%',margin: '0 auto'}}>Sign up now</Link>
       
        </div>
       </div>
     );
}

export default Hero;
