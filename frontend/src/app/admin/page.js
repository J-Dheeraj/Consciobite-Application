"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import PageHero from "@/components/PageHero";
import { pageContainer, card } from "@/utils/pageStyles";

const SECTIONS = [
  {
    href: "/admin/conflict-log",
    icon: "📊",
    title: "Score Audit",
    description:
      "Every GreenGrade score change with paying-client attribution. Trigger manual rescores and review the audit trail the independent advisory panel uses.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturer Onboarding",
    description:
      "Register manufacturers, link products, and record listing-fee acknowledgements. Paying-client status is tracked separately from scoring to preserve independence.",
  },
  {
    href: "/admin/evidence",
    icon: "🔬",
    title: "Evidence Review",
    description:
      "Review community-submitted LCA citations and approve or reject them. Approved submissions surface on the product detail page and strengthen data provenance.",
  },
];

function SectionCard({ href, icon, title, description, isDark }) {
  return (
    <Link
      href={href}
      style={{
        ...card(isDark, { radius: 16, padding: 24 }),
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        textDecoration: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : "0 8px 24px rgba(27,67,50,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 4px 12px rgba(0,0,0,0.2)"
          : "0 4px 12px rgba(27,67,50,0.08)";
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
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
          {title}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: isDark ? "#8aab8e" : "#666",
          }}
        >
          {description}
        </p>
      </div>
      <span
        style={{
          marginLeft: "auto",
          color: isDark ? "#52b788" : "#2d6a4f",
          fontSize: 20,
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        →
      </span>
    </Link>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing, user } = useAuth();
  const isDark = theme === "dark";

  if (initializing) return null;

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
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Panel"
        subtitle={`Signed in as ${user?.email || "admin"}. Manage scoring, manufacturers, and evidence.`}
      />

      <div style={pageContainer(800)}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {SECTIONS.map((s, i) => (
            <div
              key={s.href}
              style={{ animation: `fadeInUp 0.4s ease ${i * 0.07}s both` }}
            >
              <SectionCard {...s} isDark={isDark} />
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 32,
            fontSize: 12,
            color: isDark ? "#4a6b4e" : "#aaa",
            textAlign: "center",
          }}
        >
          Admin actions are logged and attributed. Score changes are tracked independently of
          manufacturer status.
        </p>
      </div>
    </div>
  );
}
