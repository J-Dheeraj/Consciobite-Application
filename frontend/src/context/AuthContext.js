"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AUTH_EXPIRED_EVENT } from "../utils/constants";
import { API_BASE, setAuthToken } from "../services/httpClient";

const AuthContext = createContext();

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000;
  } catch {
    return 0;
  }
}

// The access token is held in memory only (React state + httpClient module
// state) — never persisted to localStorage — so XSS cannot steal a stored
// copy. Sessions survive reloads via the httpOnly cookie: on mount we call
// /auth/refresh, which rotates the cookie and returns a fresh in-memory token.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  // True until the initial cookie-based session restore attempt finishes,
  // so auth-gated pages can wait instead of flashing a signed-out state.
  const [initializing, setInitializing] = useState(true);

  const refreshTimer = useRef(null);

  const applySession = useCallback((userData, authToken, expiry) => {
    setUser(userData);
    setToken(authToken);
    setExpiresAt(expiry ?? getTokenExpiry(authToken));
    setAuthToken(authToken);
  }, []);

  const login = useCallback(
    (userData, authToken, expiry) => {
      applySession(userData, authToken, expiry);
    },
    [applySession]
  );

  // Refresh only the user profile (e.g. after saving settings) without
  // touching the token or its expiry.
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    setExpiresAt(null);
    setAuthToken(null);
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    try {
      // Revokes the presented token server-side and clears the cookie
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Best-effort revocation
    }
  }, []);

  // Session restore on mount: exchange the httpOnly cookie for a fresh token
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();

        const meRes = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (!meRes.ok || cancelled) return;
        const me = await meRes.json();

        applySession(me.user, data.token, data.expiresAt);
      } catch {
        // No active session
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // Scheduled refresh 5 minutes before expiry
  useEffect(() => {
    if (!token || !expiresAt) return;

    if (expiresAt < Date.now()) {
      logout();
      return;
    }

    const refreshIn = Math.max(0, expiresAt - Date.now() - 5 * 60 * 1000);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.token);
          setExpiresAt(data.expiresAt ?? getTokenExpiry(data.token));
          setAuthToken(data.token);
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
  }, [token, expiresAt, logout]);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, isAuthenticated: !!token, initializing }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
