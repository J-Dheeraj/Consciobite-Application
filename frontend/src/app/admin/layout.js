"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

const ADMIN_TABS = [
  { href: "/admin", label: "Overview", exact: true },
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
          borderBottom: `1px solid ${isDark ? "#1c2e22" : "#e5e7eb"}`,
          background: isDark ? "#0d1f14" : "#f9fafb",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "flex",
            gap: 4,
          }}
        >
          {ADMIN_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: "14px 18px",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#2d6a4f" : isDark ? "#6b8a6e" : "#777",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid #2d6a4f" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
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
