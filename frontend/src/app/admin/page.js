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
    title: "Score Conflict Log",
    description:
      "Review every GreenGrade score change with paying-client attribution. Trigger a full rescore of all products.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturer Onboarding",
    description:
      "Register manufacturers, link products to manufacturers, and manage listing fee acknowledgements.",
  },
];

function AdminCard({ section, isDark }) {
  return (
    <Link href={section.href} style={{ textDecoration: "none" }}>
      <div
        style={{
          ...card(isDark, { radius: 14, padding: 24 }),
          border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
          cursor: "pointer",
          transition: "box-shadow 0.15s ease, transform 0.15s ease",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: 32 }}>{section.icon}</span>
        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 6,
            }}
          >
            {section.title}
          </div>
          <div
            style={{
              fontSize: 13,
              color: isDark ? "#7a9a7e" : "#666",
              lineHeight: 1.6,
            }}
          >
            {section.description}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminIndexPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";

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
        subtitle="Governance tools for the GreenGrade Independent Advisory Panel."
      />

      <div style={pageContainer(700)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ADMIN_SECTIONS.map((section) => (
            <AdminCard key={section.href} section={section} isDark={isDark} />
          ))}
        </div>

        <div
          style={{
            marginTop: 32,
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "#1c2e22" : "#ecfdf5",
            border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
            fontSize: 13,
            color: isDark ? "#7a9a7e" : "#166534",
            lineHeight: 1.6,
          }}
        >
          Admin actions are logged. Score changes trigger entries in the conflict audit trail
          visible to the{" "}
          <Link href="/transparency" style={{ color: "#2d6a4f", fontWeight: 600 }}>
            GreenGrade Advisory Panel
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
