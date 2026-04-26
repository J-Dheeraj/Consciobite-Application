"use client";

import { useState } from "react";
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
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="mr-2">
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

  const themeIcon = theme === "dark" ? "☀️" : "🌙";

  return (
    <nav
      className="bg-[#0d1f17] text-white px-6 flex items-center justify-between sticky top-0 z-[100] h-14 border-b border-brand-800/20"
      role="navigation"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="text-white font-extrabold text-[1.4rem] no-underline flex items-center -tracking-[0.02em]"
      >
        <LeafIcon />
        Consciobite
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex gap-0.5 text-sm items-center">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.to;
          return (
            <Link
              key={link.to}
              href={link.to}
              aria-current={active ? "page" : undefined}
              className={`px-2.5 py-1.5 rounded-lg flex items-center whitespace-nowrap transition-all ${
                active
                  ? "text-white font-semibold bg-white/15"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isAuthenticated ? (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-white/70 px-1.5">{user?.name?.split(" ")[0]}</span>
            <button
              onClick={handleLogout}
              className="bg-white/12 border-0 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-white font-medium px-3.5 py-1.5 rounded-lg bg-white/15 text-sm ml-1 no-underline"
          >
            Sign In
          </Link>
        )}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="bg-white/12 border-0 text-white px-2.5 py-1.5 rounded-lg text-base ml-1 flex items-center cursor-pointer"
        >
          {themeIcon}
        </button>
      </div>

      {/* Mobile buttons */}
      <div className="md:hidden flex gap-1">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="bg-white/12 border-0 text-white p-2 rounded-lg text-base cursor-pointer"
        >
          {themeIcon}
        </button>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className={`border-0 text-white text-[1.4rem] p-2 rounded-lg cursor-pointer ${
            menuOpen ? "bg-white/15" : "bg-transparent"
          }`}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 bg-[#0d1f17] px-4 py-2 pb-4 flex flex-col gap-1 z-[100] shadow-lg"
          style={{ animation: "slideDown 0.25s ease" }}
        >
          {NAV_LINKS.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-2.5 rounded-lg flex items-center text-base no-underline ${
                  active ? "text-white font-semibold bg-white/12" : "text-white/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-white/15 my-1" />
          {isAuthenticated ? (
            <>
              <div className="text-white/70 text-sm px-3 py-2">{user?.name}</div>
              <button
                onClick={handleLogout}
                className="text-white/70 bg-transparent border-0 text-left text-base px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-2.5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-white/70 text-base px-3 py-2.5 rounded-lg flex items-center gap-2.5 no-underline"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="text-white/70 text-base px-3 py-2.5 rounded-lg flex items-center gap-2.5 no-underline"
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
