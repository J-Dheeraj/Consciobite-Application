"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

const ADMIN_TABS = [
  { href: "/admin/conflict-log", label: "Score Audit" },
  { href: "/admin/manufacturers", label: "Manufacturers" },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      <div
        style={{
          background: isDark ? "#0e1e16" : "#f0f7f2",
          borderBottom: `1px solid ${isDark ? "#2d4a35" : "#c8e6c9"}`,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 4,
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: isDark ? "#4a7a55" : "#7aaf85",
              padding: "12px 12px 12px 0",
              marginRight: 8,
            }}
          >
            Admin
          </span>
          {ADMIN_TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: "10px 16px",
                  fontSize: "0.88rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? (isDark ? "#a7f3d0" : "#2d6a4f") : isDark ? "#6b8a6e" : "#777",
                  textDecoration: "none",
                  borderBottom: active
                    ? `2px solid ${isDark ? "#52b788" : "#2d6a4f"}`
                    : "2px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
