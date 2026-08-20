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
    icon: "📊",
    title: "Score Audit — Conflict Log",
    desc: "Review every GreenGrade score change with paying-client attribution. Trigger manual rescores.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturer Onboarding",
    desc: "Register manufacturers, link them to products, and manage listing-fee acknowledgements.",
  },
  {
    href: "/admin/evidence",
    icon: "🔬",
    title: "Pending Evidence Review",
    desc: "Approve or reject community-submitted citations before they appear on product pages.",
  },
];

function SectionCard({ href, icon, title, desc, isDark }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          ...card(isDark, { padding: 24, radius: 14 }),
          display: "flex",
          gap: 18,
          alignItems: "flex-start",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 8px 24px rgba(0,0,0,0.4)"
            : "0 8px 24px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        <div
          style={{
            fontSize: 32,
            lineHeight: 1,
            flexShrink: 0,
            padding: "10px 12px",
            borderRadius: 12,
            background: isDark ? "#1c2e22" : "#f0faf4",
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#666", lineHeight: 1.6 }}>
            {desc}
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            color: isDark ? "#6b8a6e" : "#ccc",
            fontSize: 20,
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          →
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user, isAuthenticated, initializing } = useAuth();
  const { theme } = useTheme();
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

  if (user?.role !== "admin") {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Access Denied"
          subtitle="Admin role required to view this page."
        />
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Dashboard"
        subtitle="Governance tools for score auditing, manufacturer management, and evidence review."
      />

      <div style={pageContainer(800)}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: isDark ? "#1c2e22" : "#f0faf4",
            border: `1px solid ${isDark ? "#2d4a35" : "#c3e6cb"}`,
            fontSize: 13,
            color: isDark ? "#a7d9b4" : "#2d6a4f",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Signed in as <strong>{user?.email}</strong> · Admin
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ADMIN_SECTIONS.map((s) => (
            <SectionCard key={s.href} isDark={isDark} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
}
