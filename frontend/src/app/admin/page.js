"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchConflictLog, fetchManufacturers } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

function StatCard({ label, value, sub, isDark, accent }) {
  return (
    <div
      style={{
        ...card(isDark, { padding: 24, radius: 12 }),
        textAlign: "center",
        flex: 1,
        minWidth: 140,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          color: accent || (isDark ? "#a7f3d0" : "#2d6a4f"),
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? "#b0c4b1" : "#555",
          marginTop: 4,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#999", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function NavCard({ href, icon, title, description, isDark }) {
  return (
    <Link
      href={href}
      style={{
        ...card(isDark, { padding: 24, radius: 14 }),
        display: "block",
        textDecoration: "none",
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 24px rgba(0,0,0,0.3)"
          : "0 8px 24px rgba(27,67,50,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 4px 12px rgba(0,0,0,0.2)"
          : "0 4px 12px rgba(27,67,50,0.08)";
      }}
    >
      <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{icon}</div>
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
      <p style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#777", margin: 0 }}>
        {description}
      </p>
    </Link>
  );
}

export default function AdminPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";

  const {
    data: logData,
    isLoading: logLoading,
    error: logError,
  } = useQuery({
    queryKey: ["conflict-log", "all"],
    queryFn: () => fetchConflictLog("all"),
    enabled: isAuthenticated,
  });

  const { data: manufacturers, isLoading: mfrLoading } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: fetchManufacturers,
    enabled: isAuthenticated,
    retry: false,
  });

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

  if (logLoading || mfrLoading) {
    return <Spinner message="Loading admin panel..." />;
  }

  if (logError) {
    const isAccess =
      logError.message?.includes("Admin") || logError.message?.includes("403");
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Access Denied"
          subtitle={
            isAccess ? "Admin role required to access this panel." : logError.message
          }
        />
      </div>
    );
  }

  const { stats } = logData || { stats: { totalChanges: 0, paying: { count: 0 }, nonPaying: { count: 0 } } };
  const mfrList = manufacturers || [];
  const payingCount = mfrList.filter((m) => m.is_paying).length;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🛡️"
        title="Admin Panel"
        subtitle="Governance tools — conflict-of-interest audit log, manufacturer registry, and methodology changelog."
      />

      <div style={pageContainer(900)}>
        {/* Summary Stats */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 32,
            marginTop: -8,
          }}
        >
          <StatCard
            isDark={isDark}
            label="Total Manufacturers"
            value={mfrList.length}
            sub={`${payingCount} paying`}
          />
          <StatCard
            isDark={isDark}
            label="Score Changes (12mo)"
            value={stats.totalChanges}
          />
          <StatCard
            isDark={isDark}
            label="Paying Client Changes"
            value={stats.paying.count}
            sub={`avg delta: ${stats.paying.avgDelta >= 0 ? "+" : ""}${stats.paying.avgDelta}`}
            accent="#f39c12"
          />
          <StatCard
            isDark={isDark}
            label="Non-Paying Changes"
            value={stats.nonPaying.count}
            sub={`avg delta: ${stats.nonPaying.avgDelta >= 0 ? "+" : ""}${stats.nonPaying.avgDelta}`}
          />
        </div>

        {/* Navigation Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <NavCard
            href="/admin/conflict-log"
            icon="📊"
            title="Score Audit Log"
            description="Every GreenGrade score change with paying-client attribution. The data the advisory panel reviews."
            isDark={isDark}
          />
          <NavCard
            href="/admin/manufacturers"
            icon="🏭"
            title="Manufacturer Registry"
            description="Onboard manufacturers, set paying status, and link products. Manages the conflict-of-interest firewall."
            isDark={isDark}
          />
          <NavCard
            href="/transparency"
            icon="🔍"
            title="Transparency Page"
            description="Public-facing governance stats and advisory panel status. What users and regulators see."
            isDark={isDark}
          />
          <NavCard
            href="/methodology"
            icon="📋"
            title="Methodology & Changelog"
            description="Public methodology documentation and version history of algorithm changes."
            isDark={isDark}
          />
        </div>

        {/* Integrity Check */}
        <div
          style={{
            ...card(isDark, { padding: 24, radius: 14 }),
            border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 12,
            }}
          >
            Independence Integrity Check
          </h3>
          {stats.totalChanges === 0 ? (
            <p style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#777", margin: 0 }}>
              No score changes recorded yet. The integrity check will be meaningful after the first
              rescore cycle.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                {
                  label: "Paying vs. non-paying avg delta gap",
                  value: Math.abs(
                    (stats.paying.avgDelta || 0) - (stats.nonPaying.avgDelta || 0)
                  ).toFixed(4),
                  ok:
                    Math.abs(
                      (stats.paying.avgDelta || 0) - (stats.nonPaying.avgDelta || 0)
                    ) < 0.5,
                  okLabel: "< 0.5 threshold",
                  warnLabel: "≥ 0.5 — review recommended",
                },
                {
                  label: "Paying client score increases",
                  value: stats.paying.increases,
                  ok: stats.paying.count === 0 || stats.paying.increases / stats.paying.count <= 0.6,
                  okLabel: "≤ 60% of changes",
                  warnLabel: "> 60% — possible bias signal",
                },
              ].map((check) => (
                <div
                  key={check.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: check.ok
                      ? isDark
                        ? "#1a3a25"
                        : "#f0fdf4"
                      : isDark
                        ? "#3a2010"
                        : "#fff7ed",
                    border: `1px solid ${check.ok ? (isDark ? "#2d4a35" : "#bbf7d0") : isDark ? "#5a3020" : "#fed7aa"}`,
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: "0.82rem", color: isDark ? "#b0c4b1" : "#555" }}>
                    {check.label}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: check.ok ? (isDark ? "#86efac" : "#16a34a") : "#f97316",
                    }}
                  >
                    {check.value}{" "}
                    <span style={{ fontWeight: 400, fontSize: "0.75rem" }}>
                      ({check.ok ? check.okLabel : check.warnLabel})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
