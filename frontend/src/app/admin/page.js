"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";

function SectionCard({ href, icon, title, description, badge, isDark }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0eb"}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        position: "relative",
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
      {badge !== null && badge !== undefined && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "#e74c3c",
            color: "#fff",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
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
      <div
        style={{
          fontSize: 13,
          color: isDark ? "#7a9a7e" : "#666",
          lineHeight: 1.6,
        }}
      >
        {description}
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  const { data: pendingData } = useQuery({
    queryKey: ["admin-pending-evidence-count"],
    queryFn: () => fetchPendingEvidence({ limit: 200 }),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const pendingCount = pendingData?.evidence?.length ?? null;

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
        subtitle="Governance tools for score auditing, manufacturer management, and evidence review."
      />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          <SectionCard
            href="/admin/conflict-log"
            icon="📊"
            title="Score Audit"
            description="Review GreenGrade score changes with paying-client attribution. Run a full rescore when the algorithm is updated."
            isDark={isDark}
          />
          <SectionCard
            href="/admin/manufacturers"
            icon="🏭"
            title="Manufacturer Onboarding"
            description="Register manufacturers, link products, and confirm listing fee acknowledgements for governance compliance."
            isDark={isDark}
          />
          <SectionCard
            href="/admin/evidence"
            icon="🔬"
            title="Evidence Review"
            description="Approve or reject community-submitted LCA citations before they appear on product pages."
            badge={pendingCount}
            isDark={isDark}
          />
        </div>

        <div
          style={{
            marginTop: 32,
            padding: 16,
            borderRadius: 10,
            background: isDark ? "#1c2e22" : "#f0f7f2",
            border: `1px solid ${isDark ? "#2d4a35" : "#c8e6c9"}`,
            fontSize: 13,
            color: isDark ? "#7a9a7e" : "#555",
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: isDark ? "#a7f3d0" : "#2d6a4f" }}>Governance note:</strong> Score
          changes are logged with full attribution. The advisory panel reviews the conflict log to
          verify that paying-client status does not systematically bias GreenGrade scores. See{" "}
          <Link
            href="/transparency"
            style={{ color: isDark ? "#6ee7b7" : "#2d6a4f", textDecoration: "underline" }}
          >
            Transparency
          </Link>{" "}
          for the public-facing summary.
        </div>
      </div>
    </div>
  );
}
