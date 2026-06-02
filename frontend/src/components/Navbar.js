"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { to: "/products", label: "Products" },
  { to: "/scan", label: "Scan" },
  { to: "/compare", label: "Compare" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/recipes", label: "Recipes" },
  { to: "/carbon", label: "Carbon" },
  { to: "/tips", label: "Tips" },
  { to: "/transparency", label: "Transparency" },
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
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <Link href="/" className={styles.brand}>
        <LeafIcon />
        Consciobite
      </Link>

      <div className={styles.desktopLinks}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              href={link.to}
              aria-current={active ? "page" : undefined}
              className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
        {isAuthenticated ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
            {isAdmin && (
              <Link
                href="/admin"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={`${styles.navLink} ${pathname.startsWith("/admin") ? styles.navLinkActive : ""}`}
              >
                Admin
              </Link>
            )}
            <span className={styles.userName}>{user?.name?.split(" ")[0]}</span>
            <button onClick={handleLogout} className={styles.btn}>
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className={styles.signInLink}>
            Sign In
          </Link>
        )}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className={styles.themeBtn}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className={styles.mobileButtons}>
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className={styles.mobileTheme}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className={styles.divider} />
          {isAuthenticated ? (
            <>
              <div
                className={styles.mobileLink}
                style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem" }}
              >
                {user?.name}
              </div>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={styles.mobileLink}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={styles.mobileLink}
                style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className={styles.mobileLink}>
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className={styles.mobileLink}
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
