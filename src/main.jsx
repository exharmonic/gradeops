/* ─────────────────────────────────────────────
   src/main.jsx  —  Entry point
   Wraps App in UserProvider and mounts to #root.
   Global styles imported once here.
───────────────────────────────────────────── */

import { StrictMode } from "react";
import { createRoot }  from "react-dom/client";

import "./style.css";          // ← global styles (replaces old GlobalStyle component)
import { UserProvider } from "./context/UserContext";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Film grain overlay — fixed, pointer-events:none, z-index:1 */}
    <div className="g-grain" aria-hidden="true" />

    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
);