import React, { useEffect, useRef, useState } from "react";

import { Link, useLocation } from "react-router-dom";
import { initials, loadProfile } from "../profile";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(loadProfile);
  const profileRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const updateProfile = ({ detail }) => setProfile(detail);
    const close = (event) => !profileRef.current?.contains(event.target) && setIsProfileDropdownOpen(false);
    window.addEventListener("stashflow:profile", updateProfile);
    document.addEventListener("mousedown", close);
    return () => { window.removeEventListener("stashflow:profile", updateProfile); document.removeEventListener("mousedown", close); };
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";
  const routeIndex = { "/": 0, "/orders": 1, "/holdings": 2, "/positions": 3, "/funds": 4, "/apps": 6, "/profile": 7 }[location.pathname];
  const activeIndex = routeIndex ?? selectedMenu;

  return (
    <div className="menu-container">
      <div className="dashboard-brand" aria-label="Stashflow"><span>S</span> Stashflow</div>
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => handleMenuClick(0)}
            >
              <p className={activeIndex === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/orders"
              onClick={() => handleMenuClick(1)}
            >
              <p className={activeIndex === 1 ? activeMenuClass : menuClass}>
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={activeIndex === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/positions"
              onClick={() => handleMenuClick(3)}
            >
              <p className={activeIndex === 3 ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={activeIndex === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => handleMenuClick(6)}
            >
              <p className={activeIndex === 6 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div className="profile-wrap" ref={profileRef}>
        <button className="profile" type="button" onClick={handleProfileClick} aria-expanded={isProfileDropdownOpen} aria-haspopup="menu">
          <div className="avatar">{initials(profile.name)}</div>
          <p className="username">{profile.name.split(" ")[0]}</p><span className="profile-chevron">⌄</span>
        </button>
        {isProfileDropdownOpen && <div className="profile-dropdown" role="menu">
          <div><strong>{profile.name}</strong><small>{profile.email || "Complete your profile"}</small></div>
          <Link to="/profile" role="menuitem" onClick={() => setIsProfileDropdownOpen(false)}>View profile <span>→</span></Link>
        </div>}
        </div>
      </div>
    </div>
  );
};

export default Menu;
