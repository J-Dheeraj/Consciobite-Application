"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparencyStats } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const ADMIN_SECTIONS = [
  {
    href: "/admin/conflict-log",
    icon: "📋",
    title: "Conflict Log",
    description:
      "Review all product score changes. Filter by paying vs non-paying clients to audit for systematic bias.",
  },
  {
    href: "/admin/manufacturers",
    icon: "🏭",
    title: "Manufacturers",
    description:
      "Manage manufacturer accounts, paying status, fee acknowledgements, and product–manufacturer links.",
  },
];

function NavCard({ href, icon, title, description, isDark }) {
  return (
    <Link
      href={href}
      style={{
        ...card(isDark, { radius: 14 }),
        padding: 24,
        display: "block",
        textDecoration: "none",
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
        transition: "box-shadow 0.18s, border-color 0.18s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(45,106,79,0.18)";
        e.currentTarget.style.borderColor = isDark ? "#40916c" : "#2d6a4f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isDark
          ? "0 2px 8px rgba(0,0,0,0.2)"
          : "0 2px 8px rgba(27,67,50,0.06)";
        e.currentTarget.style.borderColor = isDark ? "#2d4a35" : "#e5e7eb";
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <p style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#777", margin: 0, lineHeight: 1.6 }}>
        {description}
      </p>
    </Link>
  );
}

function StatRow({ label, value, isDark }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
      }}
    >
      <span style={{ fontSize: 13, color: isDark ? "#b0c4b1" : "#555" }}>{label}</span>
      <span
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
  });

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🛡️"
        title="Admin Dashboard"
        subtitle="Governance tools for managing manufacturers, auditing score changes, and maintaining methodology transparency."
      />

      <div style={pageContainer(760)}>
        {/* Admin Nav Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {ADMIN_SECTIONS.map((s) => (
            <NavCard key={s.href} {...s} isDark={isDark} />
          ))}
        </div>

        {/* Quick stats card */}
        <div
          style={{
            ...card(isDark, { radius: 14 }),
            padding: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Platform Overview
          </h3>
          <p
            style={{
              fontSize: 13,
              color: isDark ? "#6b8a6e" : "#888",
              marginBottom: 16,
            }}
          >
            Live stats from the conflict-of-interest audit trail.
          </p>

          {isLoading ? (
            <Spinner message="Loading stats..." />
          ) : stats ? (
            <div>
              <StatRow isDark={isDark} label="Products scored" value={stats.productCount} />
              <StatRow isDark={isDark} label="Manufacturers onboarded" value={stats.manufacturerCount} />
              <StatRow isDark={isDark} label="Paying clients" value={stats.payingCount} />
              <StatRow
                isDark={isDark}
                label="Score changes (last 12 months)"
                value={stats.totalChanges}
              />
              <StatRow
                isDark={isDark}
                label="Paying client score changes"
                value={stats.paying.count}
              />
              <StatRow
                isDark={isDark}
                label="Non-paying score changes"
                value={stats.nonPaying.count}
              />
            </div>
          ) : (
            <p style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#888" }}>
              Stats unavailable — backend may not be connected.
            </p>
          )}
        </div>

        {/* Link to public transparency page */}
        <div
          style={{
            marginTop: 16,
            padding: "14px 20px",
            borderRadius: 12,
            background: isDark ? "#0d2818" : "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, color: isDark ? "#95d5b2" : "#2d6a4f" }}>
            View the public-facing governance page
          </span>
          <Link
            href="/transparency"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              textDecoration: "none",
            }}
          >
            Transparency page &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
