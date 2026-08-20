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
    icon: "📊",
    title: "Score Audit",
    desc: "Every GreenGrade score change with paying-client attribution. Rescore all products.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturers",
    desc: "Register manufacturers, link products, and acknowledge listing-fee disclosures.",
  },
  {
    href: "/admin/evidence",
    icon: "🔬",
    title: "Evidence Review",
    desc: "Approve or reject community evidence submissions that appear on product pages.",
  },
];

export default function AdminPage() {
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
          subtitle="Sign in with an admin account to access this area."
        />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Panel"
        subtitle="Governance tools for GreenGrade scoring, manufacturer management, and evidence curation."
      />

      <div style={pageContainer(700)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ADMIN_SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  ...card(isDark, { padding: 20, radius: 12 }),
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: "box-shadow 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    width: 52,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDark ? "#1c3a25" : "#d1fae5",
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                      marginBottom: 3,
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: isDark ? "#6b8a6e" : "#6b7280",
                    }}
                  >
                    {s.desc}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
