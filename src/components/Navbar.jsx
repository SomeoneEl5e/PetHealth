/**
 * Navbar Component
 * ----------------
 * Top navigation bar visible on every page.
 *
 * Features:
 * - Logo link to home
 * - About page link
 * - Conditional navigation based on login state:
 *   - Logged in: greeting, Pets link, Manage link (editors+), Logout
 *   - Logged out: Log in, Sign Up
 * - Dark/light theme toggle (persisted in localStorage)
 * - Role-based "Manage" link shown only for editor/sub-admin/admin
 *
 * Props:
 * - isLoggedIn: boolean
 * - setIsLoggedIn: state setter to update login status on logout
 */
import React, { useState, useEffect } from "react";
import "./Navbar.css"
import { Link, useNavigate } from "react-router-dom";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const firstName = sessionStorage.getItem("firstName") || "";
  const role = sessionStorage.getItem("role") || "user";

  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("firstName");
    sessionStorage.removeItem("role");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">PetHealth</Link>
        <Link to="/about" className="nav-link">About</Link>
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <>
            <Link to="/edit-profile" className="nav-link user-name-link">Hello {firstName}</Link>
            <Link to="/profile" className="nav-link">Pets</Link>
            {["editor", "sub-admin", "admin"].includes(role) && (
              <Link to="/manage" className="nav-link">Manage</Link>
            )}
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Log in</Link>
            <Link to="/signup" className="nav-link nav-cta">Sign Up</Link>
          </>
        )}
        <label className="theme-switch" title={dark ? "Light mode" : "Dark mode"}>
          <input type="checkbox" checked={dark} onChange={() => setDark(d => !d)} />
          <span className="switch-track">
            <span className="switch-icon sun">☀️</span>
            <span className="switch-icon moon">🌙</span>
          </span>
        </label>
      </div>
    </header>
  );
}

export default Navbar;