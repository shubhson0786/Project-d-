import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import { loadProfile, saveProfile } from "./profile";

const incoming = new URLSearchParams(window.location.search);
if (incoming.has("name") || incoming.has("email")) {
  saveProfile({ ...loadProfile(), name: incoming.get("name") || "Stashflow User", email: incoming.get("email") || "" });
  window.history.replaceState({}, "", window.location.pathname);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
