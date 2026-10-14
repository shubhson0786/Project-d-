import React from "react";
function Rightsection({
  imageURL,
  productName,
  productDescription,
  tryDemo,
  learnMore,
  googlePlay,
  appStore,
}) {
  return (
    <div className="container ">
      <div className="row ">
        <div className="col-5 p-5 mt-5">
          <h3>{productName}</h3>
          <p>{productDescription}</p>
          <div>
         
            <a
              href={learnMore}
              className="p-3"
              style={{ textDecoration: "none" }}
            >
              Learn More
            </a>
          </div>

         
          <div className="col-1"></div>
        </div>
         <div className='col-6 p-5'>
            <img src={imageURL} alt={productName} className='img-fluid ' />
        </div>
      </div>
    </div>
  );
}

export default Rightsection;
