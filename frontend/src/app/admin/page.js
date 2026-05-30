"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchTransparencyStats } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const ADMIN_SECTIONS = [
  {
    href: "/admin/conflict-log",
    icon: "📊",
    title: "Score Audit Log",
    desc: "Every GreenGrade score change with paying-client attribution. Filter by paying vs. non-paying. Trigger a full rescore.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturer Onboarding",
    desc: "Register manufacturers, link products by ID, and record listing-fee acknowledgements required by the governance charter.",
  },
];

function StatBlock({ label, value, isDark }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px 16px",
        flex: 1,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: isDark ? "#a7f3d0" : "#2d6a4f",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#888", fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

function SectionCard({ section, isDark }) {
  return (
    <Link href={section.href} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          ...card(isDark, { radius: 14 }),
          padding: 24,
          border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
          transition: "box-shadow 0.15s ease, transform 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = isDark
            ? "0 6px 20px rgba(0,0,0,0.3)"
            : "0 6px 20px rgba(45,106,79,0.12)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
          e.currentTarget.style.transform = "";
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1,
              background: isDark ? "#1c2e22" : "#ecfdf5",
              borderRadius: 10,
              padding: "10px 12px",
              flexShrink: 0,
            }}
          >
            {section.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                marginBottom: 6,
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {section.title}
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#777", lineHeight: 1.6 }}>
              {section.desc}
            </div>
          </div>
          <div
            style={{
              color: isDark ? "#2d6a4f" : "#52b788",
              fontSize: 18,
              alignSelf: "center",
              flexShrink: 0,
            }}
          >
            →
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminOverviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
  });

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to access this section."
        />
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Overview"
        subtitle="Governance tools for managing scores, manufacturers, and audit trails."
      />

      <div style={pageContainer(800)}>
        {/* Stats bar */}
        <div
          style={{
            ...card(isDark, { radius: 14 }),
            display: "flex",
            flexWrap: "wrap",
            marginBottom: 28,
            overflow: "hidden",
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          {isLoading ? (
            <div style={{ padding: 24, width: "100%" }}>
              <Spinner message="Loading stats..." />
            </div>
          ) : stats ? (
            <>
              <StatBlock label="Products Scored" value={stats.productCount} isDark={isDark} />
              <div
                style={{
                  width: 1,
                  background: isDark ? "#1c2e22" : "#f3f4f6",
                  margin: "16px 0",
                }}
              />
              <StatBlock label="Manufacturers" value={stats.manufacturerCount} isDark={isDark} />
              <div
                style={{
                  width: 1,
                  background: isDark ? "#1c2e22" : "#f3f4f6",
                  margin: "16px 0",
                }}
              />
              <StatBlock label="Paying Clients" value={stats.payingCount} isDark={isDark} />
              <div
                style={{
                  width: 1,
                  background: isDark ? "#1c2e22" : "#f3f4f6",
                  margin: "16px 0",
                }}
              />
              <StatBlock label="Score Changes (12mo)" value={stats.totalChanges} isDark={isDark} />
            </>
          ) : null}
        </div>

        {/* Section links */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "fadeInUp 0.4s ease 0.1s both",
          }}
        >
          {ADMIN_SECTIONS.map((section) => (
            <SectionCard key={section.href} section={section} isDark={isDark} />
          ))}
        </div>

        {/* Governance note */}
        <div
          style={{
            marginTop: 32,
            padding: "16px 20px",
            borderRadius: 10,
            background: isDark ? "#0d1f14" : "#f0fdf4",
            border: `1px solid ${isDark ? "#1c2e22" : "#bbf7d0"}`,
            fontSize: 13,
            color: isDark ? "#6b8a6e" : "#4b7a5a",
            lineHeight: 1.6,
            animation: "fadeInUp 0.4s ease 0.2s both",
          }}
        >
          All score changes are logged for the{" "}
          <Link
            href="/transparency"
            style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}
          >
            GreenGrade Advisory Panel
          </Link>
          . Paying-client attribution is recorded automatically. See the{" "}
          <Link
            href="/transparency"
            style={{ color: "#2d6a4f", fontWeight: 600, textDecoration: "none" }}
          >
            Transparency page
          </Link>{" "}
          for the public-facing summary.
        </div>
      </div>
    </div>
  );
}
