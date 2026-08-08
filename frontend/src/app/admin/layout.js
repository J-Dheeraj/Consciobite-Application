"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

const ADMIN_LINKS = [
  { href: "/admin/conflict-log", label: "Score Audit" },
  { href: "/admin/manufacturers", label: "Manufacturers" },
  { href: "/admin/evidence-review", label: "Evidence Review" },
];

export default function AdminLayout({ children }) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const isDark = theme === "dark";

  return (
    <div>
      <nav
        aria-label="Admin navigation"
        style={{
          background: isDark ? "#0e1f16" : "#f0f7f4",
          borderBottom: `1px solid ${isDark ? "#1c2e22" : "#c8e6c9"}`,
          padding: "0 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {ADMIN_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? isDark
                      ? "#a7f3d0"
                      : "#2d6a4f"
                    : isDark
                      ? "#6b8a6e"
                      : "#777",
                  borderBottom: active
                    ? `2px solid ${isDark ? "#a7f3d0" : "#2d6a4f"}`
                    : "2px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s ease",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
