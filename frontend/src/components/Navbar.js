import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Products" },
  { to: "/scan", label: "Scan" },
  { to: "/compare", label: "Compare" },
  { to: "/favorites", label: "Favorites" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        background: "#2d6a4f",
        color: "#fff",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link to="/" style={{ color: "#fff", fontWeight: 700, fontSize: "1.3rem", textDecoration: "none" }}>
        Consciobite
      </Link>

      {/* Desktop nav */}
      <div style={{ display: "flex", gap: 20, fontSize: "0.9rem" }}
        className="nav-desktop"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              color: location.pathname === link.to ? "#fff" : "#cde4d5",
              fontWeight: location.pathname === link.to ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        className="nav-hamburger"
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "1.5rem",
          cursor: "pointer",
          padding: 4,
        }}
      >
        {menuOpen ? "\u2715" : "\u2630"}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="nav-mobile"
          style={{
            display: "none",
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#2d6a4f",
            padding: "8px 24px 16px",
            flexDirection: "column",
            gap: 12,
            zIndex: 100,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                color: location.pathname === link.to ? "#fff" : "#cde4d5",
                fontWeight: location.pathname === link.to ? 600 : 400,
                textDecoration: "none",
                fontSize: "1rem",
                padding: "4px 0",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
          .nav-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
