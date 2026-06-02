"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

const ADMIN_TABS = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/conflict-log", label: "Score Audit", exact: false },
  { to: "/admin/manufacturers", label: "Manufacturers", exact: false },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div>
      <nav
        style={{
          background: isDark ? "#0f1a13" : "#f0f7f2",
          borderBottom: `1px solid ${isDark ? "#1c2e22" : "#d1e7da"}`,
          padding: "0 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {ADMIN_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                href={tab.to}
                style={{
                  padding: "12px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: active ? "#2d6a4f" : isDark ? "#6b8a6e" : "#888",
                  borderBottom: active ? "2px solid #2d6a4f" : "2px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
