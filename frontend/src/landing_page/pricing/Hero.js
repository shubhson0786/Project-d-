import React from 'react';
function Hero() {
    return (
        <div className='container'>
            <div className='row text-center'>
                <h2 className='text-muted'>Pricing</h2>
                <p>Free equity investments and flat ₹ 20 traday and F&O trades</p>
            </div>
            <div className='row'>
                <div className='col-4 text-center text-muted p-5'>
                    <div className='price-orb'>₹0</div>
                    <h4>Free equity delivery</h4>
                    <p>All equity delivery investments(NSE,<br/>BSE),are absolutely free--₹ 0<br/> brokerage</p>
                </div>
                <div className='col-4 text-muted text-center p-5'>
                       <div className='price-orb'>₹20</div>
                       <h4>Intraday and F&O <br/>trades</h4>
                       <p>Flat ₹20 or 0.003% (whichever is <br/>lower) per excuted order on intraday<br/> trades across equity,currency and <br/>commodity trades.Flat ₹20 on all option trades </p>
                </div>
                <div className='col-4 text-center text-muted p-5'>
                       <div className='price-orb'>₹0</div>
                       <h4>Free direct MF</h4>
                       <p>All direct mutual fund investments are <br/> absolutely free --₹ 0 commissions &<br/>DP charges.</p>
                </div>
            </div>
            

        </div>
     );
}

export default Hero;
