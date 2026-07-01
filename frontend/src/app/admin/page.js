"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import PageHero from "@/components/PageHero";
import { pageContainer, card } from "@/utils/pageStyles";

const ADMIN_LINKS = [
  {
    href: "/admin/conflict-log",
    icon: "📋",
    title: "Conflict Log",
    description: "Review score-change audit trail and trigger manual rescores.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturers",
    description: "Manage manufacturer records, paying-client status, and product links.",
  },
];

export default function AdminIndex() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to access the admin panel."
        />
      </div>
    );
  }

  return (
    <div style={pageContainer(800)}>
      <PageHero
        icon="⚙️"
        title="Admin Panel"
        subtitle="Governance tools for managing the GreenGrade scoring system."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 20,
          marginTop: 32,
        }}
      >
        {ADMIN_LINKS.map(({ href, icon, title, description }) => (
          <Link
            key={href}
            href={href}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                ...card(isDark, { radius: 14, padding: 28 }),
                cursor: "pointer",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = isDark
                  ? "0 8px 24px rgba(0,0,0,0.3)"
                  : "0 8px 24px rgba(27,67,50,0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <span style={{ fontSize: "2rem" }}>{icon}</span>
              <div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: isDark ? "#a7f3d0" : "#1b4332",
                    marginBottom: 6,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: "0.9rem",
                    color: isDark ? "#b0c4b1" : "#555",
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </div>
              </div>
              <div
                style={{
                  marginTop: "auto",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: isDark ? "#6ee7b7" : "#2d6a4f",
                }}
              >
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
