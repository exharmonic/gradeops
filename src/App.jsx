/* ─────────────────────────────────────────────
   src/App.jsx  —  ROUTER SHELL ONLY
   No UI code lives here.
   Add new routes below as you build dashboards.
───────────────────────────────────────────── */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import { UserContext } from "./context/UserContext";

// Pages
import Home               from "./pages/Home";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import Dashboard          from "./pages/Dashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import TADashboard        from "./pages/TADashboard";

/* ── Route guard: redirect to /login if not authenticated ── */
function PrivateRoute({ children, allowedRoles }) {
  const { user } = useContext(UserContext);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — any authenticated user */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* Protected — Instructor only */}
        <Route path="/instructor/*" element={
          <PrivateRoute allowedRoles={["instructor"]}>
            <InstructorDashboard />
          </PrivateRoute>
        } />

        {/* Protected — TA only */}
        <Route path="/ta/*" element={
          <PrivateRoute allowedRoles={["ta"]}>
            <TADashboard />
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}