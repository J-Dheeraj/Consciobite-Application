"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";
import { pageContainer, card } from "@/utils/pageStyles";

const ADMIN_SECTIONS = [
  {
    href: "/admin/conflict-log",
    icon: "📋",
    title: "Score Conflict Log",
    description:
      "Review score changes for paying vs. non-paying products. Trigger a full rescore.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturers",
    description: "Onboard manufacturers, link products, and acknowledge listing fees.",
  },
  {
    href: "/admin/evidence",
    icon: "🔬",
    title: "Pending Evidence Review",
    description:
      "Approve or reject community-submitted LCA citations before they appear publicly.",
  },
];

function SectionCard({ section, isDark }) {
  return (
    <Link href={section.href} style={{ textDecoration: "none" }}>
      <div
        style={{
          ...card(isDark, { radius: 14, padding: 24 }),
          border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
          cursor: "pointer",
          height: "100%",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 10 }}>{section.icon}</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            fontFamily: "'Outfit', sans-serif",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            marginBottom: 6,
          }}
        >
          {section.title}
        </div>
        <div style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#777", lineHeight: 1.6 }}>
          {section.description}
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { isAuthenticated, user, initializing } = useAuth();
  const { theme } = useTheme();
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
        title="Admin Dashboard"
        subtitle={`Signed in as ${user?.email}`}
      />
      <div style={pageContainer(860)}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {ADMIN_SECTIONS.map((section) => (
            <SectionCard key={section.href} section={section} isDark={isDark} />
          ))}
        </div>
        <p
          style={{
            marginTop: 28,
            fontSize: 13,
            color: isDark ? "#4a6a4e" : "#aaa",
            textAlign: "center",
          }}
        >
          All admin actions are logged. Score changes are tracked in the conflict log.
        </p>
      </div>
    </div>
  );
}
