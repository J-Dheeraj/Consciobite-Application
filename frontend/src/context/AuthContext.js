"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const AuthContext = createContext();

const TOKEN_KEY = "consciobite_token";
const USER_KEY = "consciobite_user";

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });

  const refreshTimer = useRef(null);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);
    if (expiry < Date.now()) {
      logout();
      return;
    }

    // Refresh 5 minutes before expiry
    const refreshIn = Math.max(0, expiry - Date.now() - 5 * 60 * 1000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          localStorage.setItem(TOKEN_KEY, data.token);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    }, refreshIn);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [token, logout]);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("auth-expired", handleExpired);
    return () => window.removeEventListener("auth-expired", handleExpired);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
