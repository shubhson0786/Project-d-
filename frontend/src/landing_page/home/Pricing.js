import React from 'react';
function Pricing() {
    return ( 
        <div className='container'>
            <div className='row'>
                <div className='col-4'>
                    <h2 className='mb-3 fs-2'>Unbeatble Pricing</h2>
                    <p className='fs-6'>We pioneered the concept of discount broking and price transparency in India. Flat fees and no hidden charges.</p>
                     <a href=''className='fs-6 ' style={{textDecoration:"none"}}>See pricing<i class="fa fa-long-arrow-right" aria-hidden="true"></i></a>
                </div>
                <div className='col-2'></div>
                <div className='col-6'>
                    <div className='row text-center'>
                        <div className='col p-3 border'>
                            <h1 className='mb-3'>₹0</h1>
                            <p className='fs-6 '>
                                Free equity delivery and <br/> direct mutual funds
                            </p>
                        </div>
                        <div className='col p-3 border'>
                            <h1 className='mb-3'>₹20</h1>
                            <p className='fs-6'>Intraday and F&O</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
     );
}

export default Pricing;