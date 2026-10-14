import React from 'react';
import Awards from './Awards';
import Hero from './Hero';
import Education from './Education';
import Pricing from './Pricing';
import Stats from './Stats';

import Openaccount from '../OpenAccount';
function Homepage() {
    return ( 
       <>
      
       <Hero/>
       <Awards/>
       <Stats/>
       <Pricing/>
       <Education/>
       <Openaccount/>
      
       </>
     );
}

export default Homepage;