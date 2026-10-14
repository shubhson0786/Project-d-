import React from 'react';
import Hero from './Hero';  
import Leftsection from './Leftsection';
import Rightsection from './Rightsection';
import Universe from './Universe';
function ProductPage() {
    return (
        <>
        <Hero/>
        <Leftsection 
        imageURL="/Media/stashflow-products.png"
        productName="Flow Trade"
        productDescription="Our ultra-fast flagship trading platform, with a sleek and intuitive interface. Available on web, mobile and desktop."
        tryDemo="https://example.com/try-demo"
        learnMore="https://example.com/learn-more"
        googlePlay="https://example.com/google-play"
        appStore="https://example.com/app-store"
        />
        <Rightsection 
        imageURL="/Media/stashflow-ecosystem.png"
        productName="Flow Insights"
        productDescription="Our web-based platform for tracking and analyzing your investments, with powerful tools to help you make informed decisions."
        tryDemo="https://example.com/try-demo"
        learnMore="https://example.com/learn-more"
        googlePlay="https://example.com/google-play"
        appStore="https://example.com/app-store"
        />
       
        <Leftsection 
        imageURL="/Media/stashflow-products.png"
        productName="Flow Funds"
        productDescription="Buy direct mutual funds online,commission free. Coin is a mutual fund investment platform that allows you to invest in direct mutual funds online."
        tryDemo="https://example.com/try-demo"
        learnMore="https://example.com/learn-more"
        googlePlay="https://example.com/google-play"
        appStore="https://example.com/app-store"
        />
          <Rightsection 
        imageURL="/Media/stashflow-ecosystem.png"
        productName="Stashflow APIs"
        productDescription="Our set of REST-like APIs and WebSocket feed to build your own trading platforms and tools. Powering 100+ third party platforms and apps."
        tryDemo="https://example.com/try-demo"
        learnMore="https://example.com/learn-more"
        googlePlay="https://example.com/google-play"
        appStore="https://example.com/app-store"
        />
        <Leftsection 
        imageURL="/Media/stashflow-learning.png"
        productName="Flow School"
        productDescription="An easy to grasp,collection of modules that cover everything from the basics of stock market to advanced trading strategies."
        tryDemo="https://example.com/try-demo"
        learnMore="https://example.com/learn-more"
        googlePlay="https://example.com/google-play"
        appStore="https://example.com/app-store"
        />
        <Universe/>
        </>
     );
}

export default ProductPage;
