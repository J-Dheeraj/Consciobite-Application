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
    title: "Score Audit — Conflict Log",
    description:
      "View every GreenGrade score change with paying-client attribution. Trigger a full rescore of all products.",
    color: "#2d6a4f",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturer Onboarding",
    description:
      "Register manufacturers, link products to manufacturers, and manage listing fee acknowledgements.",
    color: "#b45309",
  },
];

function StatTile({ label, value, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        textAlign: "center",
        flex: 1,
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: isDark ? "#a7f3d0" : "#2d6a4f",
        }}
      >
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 13, color: isDark ? "#b0c4b1" : "#555", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated, isAdmin } = useAuth();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
    enabled: isAuthenticated && isAdmin,
  });

  if (!isAuthenticated) {
    return (
      <PageHero
        icon="🔒"
        title="Admin Access Required"
        subtitle="Sign in with an admin account to view this page."
      />
    );
  }

  if (!isAdmin) {
    return (
      <PageHero icon="🔒" title="Access Denied" subtitle="Admin role required to view this page." />
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Dashboard"
        subtitle="Governance tools for score auditing, manufacturer management, and conflict-of-interest oversight."
      />

      <div style={pageContainer(860)}>
        {/* Live Stats */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 32,
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          {isLoading ? (
            <Spinner message="Loading stats..." />
          ) : stats ? (
            <>
              <StatTile isDark={isDark} label="Products Scored" value={stats.productCount} />
              <StatTile isDark={isDark} label="Manufacturers" value={stats.manufacturerCount} />
              <StatTile isDark={isDark} label="Paying Clients" value={stats.payingCount} />
              <StatTile isDark={isDark} label="Score Changes (12mo)" value={stats.totalChanges} />
            </>
          ) : null}
        </div>

        {/* Section Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {ADMIN_SECTIONS.map((section) => (
            <Link key={section.href} href={section.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  ...card(isDark, { radius: 16, padding: 24 }),
                  border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  cursor: "pointer",
                  animation: "fadeInUp 0.4s ease both",
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
                <div style={{ fontSize: "2rem" }}>{section.icon}</div>
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
                    {section.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: isDark ? "#b0c4b1" : "#555",
                      lineHeight: 1.6,
                    }}
                  >
                    {section.description}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: section.color,
                    marginTop: "auto",
                  }}
                >
                  Open &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Governance note */}
        <div
          style={{
            marginTop: 32,
            padding: 16,
            borderRadius: 10,
            background: isDark ? "#1c2e22" : "#f0fdf4",
            border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
            fontSize: 13,
            color: isDark ? "#b0c4b1" : "#555",
            lineHeight: 1.7,
            animation: "fadeInUp 0.4s ease 0.15s both",
          }}
        >
          <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>Governance reminder:</strong>{" "}
          All score changes to paying-client products are logged in the conflict log and made
          available to the GreenGrade Advisory Panel.{" "}
          <Link href="/transparency" style={{ color: "#2d6a4f", fontWeight: 600 }}>
            View public transparency page &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
