import React from "react";
import { Link, useLocation } from "react-router-dom";

const BOTTOM_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/scan", label: "Scan" },
  { to: "/compare", label: "Compare" },
  { to: "/carbon", label: "Carbon" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="bottom-nav-spacer" style={{ display: "none", height: 64 }} />
      <nav
        className="bottom-nav"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
          boxShadow: "0 -2px 20px rgba(27, 67, 50, 0.3)",
          padding: "6px 8px env(safe-area-inset-bottom, 6px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          {BOTTOM_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "6px 8px",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: active ? "#fff" : "rgba(255,255,255,0.5)",
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  transition: "all 0.2s ease",
                  minWidth: 48,
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: active ? 700 : 400 }}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .bottom-nav { display: block !important; }
          .bottom-nav-spacer { display: block !important; }
        }
      `}</style>
    </>
  );
}
