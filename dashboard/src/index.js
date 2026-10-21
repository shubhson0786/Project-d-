import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import Home from "./components/Home";
import { saveProfile } from "./profile";

import api from "./api";

const root = ReactDOM.createRoot(document.getElementById("root"));

async function bootstrap() {
  const incoming = new URLSearchParams(window.location.hash.slice(1));
  const handoff = incoming.get("handoff");
  if (handoff) window.history.replaceState({}, "", window.location.pathname);
  try {
    await (handoff
      ? api.post("/api/session", { handoff })
      : api.get("/api/session"));
    const { data } = await api.get("/api/profile");
    saveProfile(data);
    renderApp();
  } catch (error) {
    if ([401, 404].includes(error.response?.status)) {
      window.location.replace(`${process.env.REACT_APP_PUBLIC_SITE_URL || "http://localhost:3000"}/signup?mode=login`);
    } else {
      root.render(<main className="funds-state"><p role="alert">Your account is temporarily unavailable.</p><button onClick={bootstrap}>Retry</button></main>);
    }
  }
}

function renderApp() {
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

}
bootstrap();
