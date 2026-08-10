"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchTransparencyStats, fetchPendingEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import { pageContainer, card } from "@/utils/pageStyles";

function AdminCard({ href, icon, title, description, badge, isDark }) {
  return (
    <Link
      href={href}
      style={{
        ...card(isDark, { radius: 14, padding: 24 }),
        display: "block",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 24px rgba(0,0,0,0.35)"
          : "0 8px 24px rgba(27,67,50,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isDark
              ? "linear-gradient(135deg, #1c3a28, #2d6a4f)"
              : "linear-gradient(135deg, #d8f3dc, #b7e4c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                margin: 0,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              {title}
            </h3>
            {badge !== null && badge !== undefined && badge > 0 && (
              <span
                style={{
                  background: "#e63946",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 7px",
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: isDark ? "#7a9a7e" : "#666",
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        </div>
        <span style={{ color: isDark ? "#4a7a5a" : "#b7e4c7", fontSize: "1.1rem", flexShrink: 0 }}>
          →
        </span>
      </div>
    </Link>
  );
}

function StatTile({ label, value, isDark, accent }) {
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
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: accent || (isDark ? "#a7f3d0" : "#2d6a4f"),
        }}
      >
        {value ?? "—"}
      </div>
      <div
        style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#b0c4b1" : "#555", marginTop: 4 }}
      >
        {label}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  const { data: stats } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
    enabled: isAuthenticated,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 100 }),
    enabled: isAuthenticated,
  });

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

  const pendingCount =
    pendingData?.evidence !== undefined
      ? pendingData.evidence.filter((e) => e.status === "pending").length
      : 0;

  const adminSections = [
    {
      href: "/admin/evidence",
      icon: "🔬",
      title: "Evidence Review",
      description:
        "Approve or reject user-submitted literature citations. Approved entries surface on product pages to support GreenGrade scores.",
      badge: pendingCount,
    },
    {
      href: "/admin/conflict-log",
      icon: "📊",
      title: "Score Audit — Conflict Log",
      description:
        "Every GreenGrade score change, with paying-client attribution. This is what the advisory panel reviews for independence verification.",
    },
    {
      href: "/admin/manufacturers",
      icon: "🏭",
      title: "Manufacturer Onboarding",
      description:
        "Register manufacturers, link products, and manage listing fee acknowledgements. Required before a paying client can be attributed in the audit trail.",
    },
    {
      href: "/transparency",
      icon: "🌿",
      title: "Transparency Dashboard",
      description:
        "Public-facing governance status page — advisory panel seats, scoring commitments, and methodology version. Opens in user-facing view.",
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Panel"
        subtitle="Governance tools for managing evidence, manufacturers, and score integrity."
      />

      <div style={pageContainer(820)}>
        {/* Stats overview */}
        {stats && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <StatTile isDark={isDark} label="Products" value={stats.productCount} />
            <StatTile isDark={isDark} label="Manufacturers" value={stats.manufacturerCount} />
            <StatTile
              isDark={isDark}
              label="Paying Clients"
              value={stats.payingCount}
              accent="#f39c12"
            />
            <StatTile isDark={isDark} label="Score Changes (12mo)" value={stats.totalChanges} />
            <StatTile
              isDark={isDark}
              label="Pending Evidence"
              value={pendingCount}
              accent={pendingCount > 0 ? "#e63946" : undefined}
            />
          </div>
        )}

        {/* Navigation cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {adminSections.map((section) => (
            <AdminCard key={section.href} {...section} isDark={isDark} />
          ))}
        </div>
      </div>
    </div>
  );
}
