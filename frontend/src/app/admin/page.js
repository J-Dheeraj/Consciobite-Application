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

function OverviewCard({ title, value, sub, href, isDark, accent }) {
  const inner = (
    <div
      style={{
        ...card(isDark, { radius: 14, padding: 24 }),
        flex: 1,
        minWidth: 160,
        cursor: href ? "pointer" : "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (href) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 8px 20px rgba(0,0,0,0.3)"
            : "0 8px 20px rgba(27,67,50,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (href) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 4px 12px rgba(0,0,0,0.2)"
            : "0 4px 12px rgba(27,67,50,0.08)";
        }
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: accent || (isDark ? "#a7f3d0" : "#2d6a4f"),
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: isDark ? "#4a6a4e" : "#999", marginTop: 4 }}>{sub}</div>
      )}
      {href && (
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            fontWeight: 600,
            color: "#2d6a4f",
          }}
        >
          Open &rarr;
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ flex: 1, minWidth: 160, textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function QuickLink({ href, icon, title, description, isDark }) {
  return (
    <Link
      href={href}
      style={{
        ...card(isDark, { radius: 14, padding: 20 }),
        display: "block",
        textDecoration: "none",
        flex: 1,
        minWidth: 220,
        transition: "transform 0.15s ease",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#777", lineHeight: 1.5 }}>
        {description}
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["transparency-stats"],
    queryFn: fetchTransparencyStats,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to view this page."
        />
      </div>
    );
  }

  const textColor = isDark ? "#c8d6c8" : "#444";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⚙️"
        title="Admin Overview"
        subtitle={`Signed in as ${user?.email || "admin"}. Governance dashboard for GreenGrade scoring integrity.`}
      />

      <div style={pageContainer(1000)}>
        {/* Stats Row */}
        {isLoading ? (
          <Spinner message="Loading stats..." />
        ) : stats ? (
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 28,
              animation: "fadeInUp 0.4s ease both",
            }}
          >
            <OverviewCard
              isDark={isDark}
              title="Products Scored"
              value={stats.productCount}
              sub="Total in catalog"
            />
            <OverviewCard
              isDark={isDark}
              title="Manufacturers"
              value={stats.manufacturerCount}
              sub={`${stats.payingCount} paying`}
              href="/admin/manufacturers"
            />
            <OverviewCard
              isDark={isDark}
              title="Score Changes (12mo)"
              value={stats.totalChanges}
              sub="All products"
              href="/admin/conflict-log"
            />
            <OverviewCard
              isDark={isDark}
              title="Paying Client Changes"
              value={stats.paying?.count ?? 0}
              sub={
                stats.paying?.count > 0
                  ? `avg delta ${stats.paying.avgDelta >= 0 ? "+" : ""}${stats.paying.avgDelta}`
                  : "None recorded"
              }
              accent="#f39c12"
              href="/admin/conflict-log"
            />
          </div>
        ) : null}

        {/* Quick Links */}
        <h3
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            marginBottom: 14,
          }}
        >
          Admin Sections
        </h3>
        <div
          style={{
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 28,
            animation: "fadeInUp 0.4s ease 0.1s both",
          }}
        >
          <QuickLink
            href="/admin/conflict-log"
            icon="📊"
            title="Score Audit Log"
            description="Every GreenGrade score change with paying-client attribution. Reviewed by the advisory panel."
            isDark={isDark}
          />
          <QuickLink
            href="/admin/manufacturers"
            icon="🏭"
            title="Manufacturer Onboarding"
            description="Register manufacturers, link products, and manage listing fee acknowledgements."
            isDark={isDark}
          />
          <QuickLink
            href="/transparency"
            icon="🔍"
            title="Public Transparency Page"
            description="The public view — advisory panel, methodology, and aggregated score change statistics."
            isDark={isDark}
          />
        </div>

        {/* Governance Checklist */}
        <div
          style={{
            ...card(isDark, { radius: 14, padding: 24 }),
            animation: "fadeInUp 0.4s ease 0.2s both",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: 16,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Governance Checklist
          </h3>
          {[
            { done: true, label: "Audit trail active — all score changes logged" },
            { done: true, label: "Manufacturer paying-client attribution wired up" },
            { done: true, label: "Advisory panel charter drafted (v1.0)" },
            { done: true, label: "Public transparency page live" },
            { done: false, label: "Advisory panel — 3 founding members identified" },
            { done: false, label: "First panel meeting scheduled (within 90 days of acceptance)" },
            { done: false, label: "Annual review statement published" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: item.done ? "#27ae60" : isDark ? "#1c2e22" : "#f3f4f6",
                  flexShrink: 0,
                  fontSize: 11,
                }}
              >
                {item.done ? "✓" : "○"}
              </span>
              <span
                style={{
                  color: item.done ? (isDark ? "#b0c4b1" : "#555") : isDark ? "#4a6a4e" : "#aaa",
                  textDecoration: item.done ? "none" : "none",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: isDark ? "#4a6a4e" : "#bbb",
              fontStyle: "italic",
            }}
          >
            Checklist tracks GreenGrade Independent Advisory Panel activation milestones.
          </p>
        </div>

        {/* Links */}
        <div
          style={{
            marginTop: 20,
            fontSize: 13,
            color: textColor,
            animation: "fadeInUp 0.4s ease 0.3s both",
          }}
        >
          <Link
            href="/GreenGrade_Governance_Charter.md"
            style={{ color: "#2d6a4f", fontWeight: 600 }}
          >
            View governance charter &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
