"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const STORAGE_KEY = "consciobite_theme";

// The pages are prerendered at build time, where there is no localStorage and
// no prefers-color-scheme, so the static HTML is always rendered in light mode.
// The first client render must produce the same output or React throws a
// hydration error (#418) and throws away the server HTML. So state starts as
// "light" on both sides, and the visitor's real preference is read after mount.
export function getPreferredTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* localStorage unavailable */
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

// Runs in <head> before first paint so dark-mode visitors don't see a flash of
// the light theme while React hydrates. It only sets the attribute on <html>,
// which React does not render, so it can't cause a mismatch itself.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- must run after hydration, see above
    setTheme(getPreferredTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    // Until the real preference is loaded, don't overwrite the stored choice
    // or the attribute the head script already set.
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* localStorage unavailable */
    }
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
