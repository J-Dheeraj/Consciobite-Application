"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const Card = ({ title, children, isDark, accent }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      borderTop: accent ? `3px solid ${accent}` : undefined,
    }}
  >
    {title && (
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          marginBottom: 16,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h3>
    )}
    {children}
  </div>
);

const StatBox = ({ label, value, sub, isDark }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 10,
      background: isDark ? "#1c2e22" : "#f0f7f2",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: "1.6rem",
        color: isDark ? "#95d5b2" : "#2d6a4f",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 4 }}>
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: "0.72rem", color: isDark ? "#52b788" : "#2d6a4f", marginTop: 3 }}>
        {sub}
      </div>
    )}
  </div>
);

const BoardMemberCard = ({ member, isDark }) => {
  const statusColor = member.status === "active" ? "#27ae60" : "#f39c12";
  const statusLabel = member.status === "active" ? "Active" : "Pending";

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: isDark ? "#1c2e22" : "#f8faf8",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: isDark ? "#2d4a35" : "#e8f0e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "1rem",
        }}
      >
        {member.seat === "Academic" ? "🎓" : member.seat === "Regulator" ? "🏛️" : "🏭"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.88rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            {member.seat} Seat
          </span>
          <span
            style={{
              padding: "1px 8px",
              borderRadius: 10,
              background: `${statusColor}20`,
              color: statusColor,
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            {statusLabel}
          </span>
        </div>
        <div
          style={{ fontSize: "0.82rem", color: isDark ? "#95d5b2" : "#2d6a4f", marginBottom: 3 }}
        >
          {member.title}
        </div>
        <div
          style={{
            fontSize: "0.78rem",
            color: isDark ? "#7a9a7e" : "#888",
            marginBottom: 6,
            fontStyle: "italic",
          }}
        >
          {member.affiliation}
        </div>
        <div style={{ fontSize: "0.78rem", color: isDark ? "#b0c4b1" : "#555", lineHeight: 1.5 }}>
          {member.mandate}
        </div>
      </div>
    </div>
  );
};

function formatDelta(delta) {
  if (delta === null || delta === undefined) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${Number(delta).toFixed(4)}`;
}

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
    staleTime: 5 * 60 * 1000,
  });

  const textColor = isDark ? "#b0c4b1" : "#555";
  const mutedColor = isDark ? "#7a9a7e" : "#888";

  if (isLoading) {
    return <Spinner message="Loading transparency data..." />;
  }

  if (error || !data) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        Unable to load transparency data.
        <button
          onClick={() => window.location.reload()}
          style={{
            display: "block",
            margin: "16px auto 0",
            padding: "10px 24px",
            background: "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { governance, scoreImpartiality, catalog } = data;
  const stats = scoreImpartiality;
  const hasChanges = stats.totalChanges > 0;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero */}
      <div
        style={{
          background: "#0d2818",
          padding: "48px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle at 30% 40%, #fff 1px, transparent 1px), radial-gradient(circle at 70% 60%, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px, 35px 35px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2rem",
              marginBottom: 8,
            }}
          >
            Grading Independence
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 12px",
              lineHeight: 1.6,
            }}
          >
            Consciobite charges manufacturers to list on our platform. GreenGrade scores are
            determined algorithmically and independently. This page documents what we do to ensure
            those two facts remain compatible.
          </p>
          <div
            style={{
              display: "inline-flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(82,183,136,0.2)",
                color: "#52b788",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {catalog.scoredProducts} products scored
            </div>
            <div
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(82,183,136,0.15)",
                color: "#52b788",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Audit trail active
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "24px 20px 60px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Commitments */}
        <Card title="Our Governance Commitments" isDark={isDark} accent="#2d6a4f">
          <ul
            style={{
              margin: 0,
              paddingLeft: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {governance.commitments.map((c, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(45,106,79,0.15)",
                    color: "#2d6a4f",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6 }}>{c}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Score impartiality stats */}
        <Card title="Score Impartiality — Last 12 Months" isDark={isDark} accent="#52b788">
          <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6, marginBottom: 16 }}>
            {stats.description}
          </p>

          {!hasChanges ? (
            <div
              style={{
                padding: "16px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f0f7f2",
                textAlign: "center",
                fontSize: "0.88rem",
                color: mutedColor,
              }}
            >
              No score changes recorded yet. Stats will appear here once scoring algorithm updates
              occur.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <StatBox label="Total Changes" value={stats.totalChanges} isDark={isDark} />
                <StatBox
                  label="Paying Clients"
                  value={stats.paying.count}
                  sub={`avg Δ ${formatDelta(stats.paying.avgDelta)}`}
                  isDark={isDark}
                />
                <StatBox
                  label="Non-Paying"
                  value={stats.nonPaying.count}
                  sub={`avg Δ ${formatDelta(stats.nonPaying.avgDelta)}`}
                  isDark={isDark}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Paying", s: stats.paying },
                  { label: "Non-Paying", s: stats.nonPaying },
                ].map(({ label, s }) => (
                  <div
                    key={label}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: isDark ? "#1c2e22" : "#f8faf8",
                      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: isDark ? "#7a9a7e" : "#888",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.82rem", color: "#27ae60" }}>
                        ↑ {s.increases} increased
                      </span>
                      <span style={{ fontSize: "0.82rem", color: "#e74c3c" }}>
                        ↓ {s.decreases} decreased
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {stats.lastAuditTimestamp && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: mutedColor,
                    marginTop: 12,
                    textAlign: "right",
                  }}
                >
                  Last score change logged:{" "}
                  {new Date(stats.lastAuditTimestamp).toLocaleDateString("en-SG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </>
          )}

          <p
            style={{
              fontSize: "0.78rem",
              color: mutedColor,
              marginTop: 14,
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            {stats.note}
          </p>
        </Card>

        {/* Advisory Board */}
        <Card title="Independent Grading Advisory Board" isDark={isDark} accent="#f39c12">
          <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6, marginBottom: 8 }}>
            {governance.advisoryBoard.mandate}
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 12,
              background: "rgba(243,156,18,0.12)",
              color: "#f39c12",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Board formation in progress
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {governance.advisoryBoard.members.map((m) => (
              <BoardMemberCard key={m.seat} member={m} isDark={isDark} />
            ))}
          </div>
        </Card>

        {/* Links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Link href="/methodology" style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 12,
                background: isDark ? "#162419" : "#fff",
                border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                boxShadow: isDark ? "0 2px 6px rgba(0,0,0,0.12)" : "0 2px 6px rgba(27,67,50,0.05)",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                  marginBottom: 4,
                }}
              >
                Scoring Methodology →
              </div>
              <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                Full algorithm documentation, data sources, and confidence levels
              </div>
            </div>
          </Link>
          <Link href="/products" style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 12,
                background: isDark ? "#162419" : "#fff",
                border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                boxShadow: isDark ? "0 2px 6px rgba(0,0,0,0.12)" : "0 2px 6px rgba(27,67,50,0.05)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                  marginBottom: 4,
                }}
              >
                Browse Products →
              </div>
              <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                {catalog.totalProducts} products rated A–F by GreenGrade
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
