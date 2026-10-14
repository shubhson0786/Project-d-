import React from 'react';
function Leftsection({imageURL,productName,productDescription,tryDemo,learnMore,googlePlay,appStore}) {
    return ( <div className='container '>
        <div className='row '>
    <div className='col-5 p-5'>
        <img src={imageURL} alt={productName} className='img-fluid ' />
    </div>
    <div className='col-1'></div>
    <div className='col-6 p-5 mt-5'>
        <h3>{productName}</h3>
        <p>{productDescription}</p>
      <div>
          <a href={tryDemo} className='p-3' style={{textDecoration:"none"}} >Try Demo</a>
            <a href={learnMore} className='p-3' style={{textDecoration:"none"}}>Learn More</a>
      </div>
          
         <div className='mt-3 d-flex gap-2'>
           <a className='store-link' href={googlePlay}>Get it on Google Play</a>
           <a className='store-link' href={appStore}>Download on the App Store</a>
         </div>
    </div>
        </div>
    </div>
    );
}

export default Leftsection;
