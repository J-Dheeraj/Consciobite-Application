"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import PageHero from "@/components/PageHero";
import { pageContainer, card } from "@/utils/pageStyles";

const ADMIN_SECTIONS = [
  {
    href: "/admin/conflict-log",
    icon: "📋",
    title: "Score Conflict Log",
    description:
      "Audit trail of GreenGrade score changes. Filter by paying vs non-paying manufacturers. Trigger a full rescore.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturers",
    description:
      "Manage manufacturer accounts, listing fee status, and product–manufacturer associations.",
  },
  {
    href: "/admin/pending-evidence",
    icon: "🔬",
    title: "Evidence Review",
    description:
      "Review community-submitted evidence citations. Approve or reject pending submissions before they go public.",
  },
];

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to access the admin dashboard."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHero
        icon="⚙️"
        title="Admin Dashboard"
        subtitle="Governance tools for GreenGrade scoring, manufacturers, and evidence review."
      />

      <div style={pageContainer(800)}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}
        >
          {ADMIN_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  ...card(isDark, { padding: 24, radius: 14 }),
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  height: "100%",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 8px 24px rgba(0,0,0,0.35)"
                    : "0 8px 24px rgba(27,67,50,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 4px 12px rgba(27,67,50,0.08)";
                }}
              >
                <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{section.icon}</div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 8,
                  }}
                >
                  {section.title}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: isDark ? "#6b8a6e" : "#666",
                    lineHeight: 1.5,
                  }}
                >
                  {section.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
