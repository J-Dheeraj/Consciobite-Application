"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function AdminLayout({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!isAuthenticated) {
    return (
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          color: isDark ? "#b0c4b1" : "#555",
        }}
      >
        <p style={{ fontSize: "1.1rem", marginBottom: 12 }}>Sign in to continue.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        style={{
          padding: "80px 24px",
          textAlign: "center",
          color: isDark ? "#b0c4b1" : "#555",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1.4rem",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            marginBottom: 8,
          }}
        >
          Admin Access Required
        </h2>
        <p style={{ maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
          This section is restricted to Consciobite administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
