import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Products", icon: "\uD83C\uDF3F" },
  { to: "/scan", label: "Scan", icon: "\uD83D\uDCF7" },
  { to: "/compare", label: "Compare", icon: "\u2696\uFE0F" },
  { to: "/favorites", label: "Favorites", icon: "\u2665" },
  { to: "/about", label: "About", icon: "\u2139\uFE0F" },
];

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c4 0 8.68-3.3 12-11" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8c-4 0-8 2-10 6" stroke="#52b788" strokeWidth="2" strokeLinecap="round"/>
    <path d="M17 8C20 2 22 2 22 2s0 4-5 6" stroke="#74c69d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
        color: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 60,
        boxShadow: "0 2px 20px rgba(27, 67, 50, 0.3)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link to="/" style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.4rem", textDecoration: "none", display: "flex", alignItems: "center", letterSpacing: "-0.02em" }}>
        <LeafIcon />
        Consciobite
      </Link>

      <div style={{ display: "flex", gap: 4, fontSize: "0.88rem" }} className="nav-desktop">
        {NAV_LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to} style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: active ? 600 : 400, textDecoration: "none", padding: "8px 14px", borderRadius: 8, background: active ? "rgba(255,255,255,0.15)" : "transparent", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.9rem" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen} className="nav-hamburger" style={{ display: "none", background: menuOpen ? "rgba(255,255,255,0.15)" : "none", border: "none", color: "#fff", fontSize: "1.4rem", cursor: "pointer", padding: "6px 8px", borderRadius: 8 }}>
        {menuOpen ? "\u2715" : "\u2630"}
      </button>

      {menuOpen && (
        <div className="nav-mobile" style={{ display: "none", position: "absolute", top: "100%", left: 0, right: 0, background: "linear-gradient(180deg, #2d6a4f 0%, #1b4332 100%)", padding: "8px 16px 16px", flexDirection: "column", gap: 4, zIndex: 100, boxShadow: "0 8px 30px rgba(27,67,50,0.3)", animation: "slideDown 0.25s ease" }}>
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: active ? 600 : 400, textDecoration: "none", fontSize: "1rem", padding: "10px 12px", borderRadius: 8, background: active ? "rgba(255,255,255,0.12)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                <span>{link.icon}</span> {link.label}
              </Link>
            );
          })}
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
