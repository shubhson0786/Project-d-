import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Homepage from './landing_page/home/Homepage';
import Aboutpage from './landing_page/about/Aboutpage';
import Signup from './landing_page/signup/Signup';
import Productpage from './landing_page/products/ProductPage';
import Pricingpage from './landing_page/pricing/pricingPage';
import Supportpage from './landing_page/support/SupportPage'; 
import Nav from './landing_page/Navbar';
import Footer from './landing_page/Footer';
 import Notfound from './landing_page/Notfound';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 <BrowserRouter>
 <Nav />

    <Routes>
        <Route path='/' element={<Homepage/>}/>
         <Route path='/signup' element={<Signup/>}/>
         <Route path='/about' element={<Aboutpage/>}/>
          <Route path='/products' element={<Productpage/>}/>
           <Route path='/pricing' element={<Pricingpage/>}/>
            <Route path='/support' element={<Supportpage/>}/>
             <Route path='/*' element={<Notfound/>}/>
            
        
    </Routes>
    <Footer />
 </BrowserRouter>
);
