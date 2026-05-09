"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const NAV_LINKS = [
  { to: "/products", label: "Products" },
  { to: "/scan", label: "Scan" },
  { to: "/compare", label: "Compare" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipes", label: "Recipes" },
  { to: "/carbon", label: "Carbon" },
  { to: "/tips", label: "Tips" },
];

const LeafIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
    <path
      d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c4 0 8.68-3.3 12-11"
      stroke="#74c69d"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 8c-4 0-8 2-10 6" stroke="#52b788" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M17 8C20 2 22 2 22 2s0 4-5 6"
      stroke="#74c69d"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <nav
      style={{
        background: "#0d1f17",
        color: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 56,
        borderBottom: "1px solid rgba(45,106,79,0.2)",
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        style={{
          color: "#fff",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.4rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          letterSpacing: "-0.02em",
        }}
      >
        <LeafIcon />
        Consciobite
      </Link>

      <div
        style={{ display: "flex", gap: 2, fontSize: "0.85rem", alignItems: "center" }}
        className="nav-desktop"
      >
        {NAV_LINKS.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              href={link.to}
              aria-current={active ? "page" : undefined}
              style={{
                color: active ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: active ? 600 : 400,
                textDecoration: "none",
                padding: "7px 11px",
                borderRadius: 8,
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              {link.label}
            </Link>
          );
        })}
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", padding: "0 6px" }}>
              {user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: "0.82rem",
                fontWeight: 500,
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              color: "#fff",
              fontWeight: 500,
              textDecoration: "none",
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              fontSize: "0.85rem",
              marginLeft: 4,
            }}
          >
            Sign In
          </Link>
        )}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            padding: "7px 10px",
            borderRadius: 8,
            fontSize: "1rem",
            marginLeft: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 4 }} className="nav-mobile-buttons">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="nav-theme-mobile"
          style={{
            display: "none",
            background: "rgba(255,255,255,0.12)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 8,
            fontSize: "1rem",
          }}
        >
          {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="nav-hamburger"
          style={{
            display: "none",
            background: menuOpen ? "rgba(255,255,255,0.15)" : "none",
            border: "none",
            color: "#fff",
            fontSize: "1.4rem",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 8,
          }}
        >
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
      </div>

      {menuOpen && (
        <div
          className="nav-mobile"
          style={{
            display: "none",
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#0d1f17",
            padding: "8px 16px 16px",
            flexDirection: "column",
            gap: 4,
            zIndex: 100,
            boxShadow: "0 8px 30px rgba(27,67,50,0.3)",
            animation: "slideDown 0.25s ease",
          }}
        >
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                style={{
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  fontSize: "1rem",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: active ? "rgba(255,255,255,0.12)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "4px 0" }} />
          {isAuthenticated ? (
            <>
              <div
                style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem", padding: "8px 12px" }}
              >
                {user?.name}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  color: "rgba(255,255,255,0.7)",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontSize: "1rem",
                  padding: "10px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  fontSize: "1rem",
                  padding: "10px 12px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  fontSize: "1rem",
                  padding: "10px 12px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
