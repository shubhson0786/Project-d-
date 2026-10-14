import React from "react";
import { Link } from "react-router-dom";
function Nav() {
  return (

      <nav class="navbar navbar-expand-lg border-bottom" style={{ backgroundColor: "#FFF" }}>
        <div class="container p-2">
          <Link className="navbar-brand stashflow-brand" to="/">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>Stashflow</span>
          </Link>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
          
            <form class="d-flex" role="search">
               <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <Link class="nav-link active fs-6 " aria-current="page" to="/signup?mode=login">
                  Log in
                </Link>
              </li>
              <li class="nav-item"><Link class="nav-link active fs-6" to="/signup">Sign up</Link></li>
              <li class="nav-item">
                <Link class="nav-link active fs-6" to="/about">
                  About
                </Link>
              </li>
               <li class="nav-item">
                <Link class="nav-link  active fs-6" to="/products">
                  Products
                </Link>
              </li>
               <li class="nav-item">
                <Link class="nav-link  active fs-6 " to="/pricing">
                  Pricing 
                </Link>
              </li>
               <li class="nav-item">
                <Link class="nav-link  active fs-6" to="/support">
                  Support
                </Link >
              </li>
              </ul>
            </form>
          </div>
        </div>
      </nav>
    
  );
}

export default Nav;
