"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const SectionCard = ({ title, children, isDark }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      animation: "fadeInUp 0.4s ease both",
    }}
  >
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
    {children}
  </div>
);

const StatBox = ({ label, value, sub, isDark }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: isDark ? "#1c2e22" : "#edf7f0",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "1.6rem",
        fontWeight: 800,
        color: "#2d6a4f",
        fontFamily: "'Outfit', sans-serif",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: isDark ? "#e8f5e9" : "#1a3a2a",
        marginTop: 4,
      }}
    >
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

const BoardSeatCard = ({ seat, isDark }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 12,
      background: isDark ? "#1c2e22" : "#f8faf8",
      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 12,
          background: "rgba(82,183,136,0.15)",
          color: "#52b788",
          fontSize: "0.72rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {seat.seat}
      </span>
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 12,
          background: "rgba(243,156,18,0.12)",
          color: isDark ? "#f39c12" : "#8a6d00",
          fontSize: "0.7rem",
          fontWeight: 600,
        }}
      >
        {seat.status}
      </span>
    </div>
    <div
      style={{
        fontWeight: 600,
        fontSize: "0.9rem",
        color: isDark ? "#e8f5e9" : "#1a3a2a",
        marginBottom: 4,
      }}
    >
      {seat.description}
    </div>
    <div style={{ fontSize: "0.82rem", color: isDark ? "#b0c4b1" : "#555", lineHeight: 1.5 }}>
      {seat.purpose}
    </div>
  </div>
);

function DeltaIndicator({ paying, nonPaying, isDark }) {
  const textColor = isDark ? "#b0c4b1" : "#555";

  if (paying.count === 0 && nonPaying.count === 0) {
    return (
      <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6 }}>
        No score changes have been recorded since the audit trail was activated. This means the
        GreenGrade algorithm has not been updated since system launch.
      </p>
    );
  }

  const payingDir = paying.avgDelta > 0 ? "up" : paying.avgDelta < 0 ? "down" : "flat";
  const nonPayingDir = nonPaying.avgDelta > 0 ? "up" : nonPaying.avgDelta < 0 ? "down" : "flat";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        {
          label: "Paying clients",
          count: paying.count,
          avgDelta: paying.avgDelta,
          increases: paying.increases,
          decreases: paying.decreases,
          dir: payingDir,
        },
        {
          label: "Non-paying products",
          count: nonPaying.count,
          avgDelta: nonPaying.avgDelta,
          increases: nonPaying.increases,
          decreases: nonPaying.decreases,
          dir: nonPayingDir,
        },
      ].map((group) => (
        <div
          key={group.label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            background: isDark ? "#1c2e22" : "#f8faf8",
            border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.88rem",
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              {group.label}
            </div>
            <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
              {group.count} change{group.count !== 1 ? "s" : ""} &middot; &uarr;{group.increases}{" "}
              &darr;{group.decreases}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              color:
                group.avgDelta > 0.01
                  ? "#27ae60"
                  : group.avgDelta < -0.01
                    ? "#e74c3c"
                    : isDark
                      ? "#7a9a7e"
                      : "#888",
            }}
          >
            avg {group.avgDelta > 0 ? "+" : ""}
            {group.avgDelta.toFixed(3)} pts
          </div>
        </div>
      ))}
      <p style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888", lineHeight: 1.5 }}>
        A positive average delta means products in that group received higher scores on re-scoring.
        Comparable drift between paying and non-paying groups indicates scoring independence.
      </p>
    </div>
  );
}

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
  });

  const textColor = isDark ? "#b0c4b1" : "#555";

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
              margin: "0 auto 16px",
            }}
          >
            How we protect our scoring from commercial influence — our governance structure,
            advisory board, and conflict-of-interest register.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(82,183,136,0.2)",
                color: "#52b788",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Governance v{data?.governanceVersion ?? "1.0"}
            </div>
            {data && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.8rem",
                }}
              >
                {data.productsScored} products scored
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "24px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* The challenge */}
        <SectionCard title="Why Governance Matters" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 12 }}>
            Consciobite charges manufacturers for product listing and grading services. Our
            GreenGrade scores claim to be objective. These two facts create a potential conflict of
            interest that we take seriously.
          </p>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7 }}>
            This page documents the governance structures we use to ensure scoring independence —
            including an Independent Advisory Board, an automated audit trail, and a public
            conflict-of-interest register.
          </p>
        </SectionCard>

        {/* Live stats */}
        {isLoading && <Spinner message="Loading governance data..." />}
        {error && (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: isDark ? "#2a1519" : "#fef2f2",
              color: isDark ? "#f87171" : "#c5303c",
              fontSize: "0.88rem",
            }}
          >
            Unable to load live governance stats. The commitments and board information below are
            still accurate.
          </div>
        )}
        {data && (
          <SectionCard title="Scoring Independence — Live Stats" isDark={isDark}>
            <p
              style={{
                color: textColor,
                fontSize: "0.85rem",
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              These figures are generated live from the audit trail activated at system launch. They
              show whether score changes have favoured paying clients over non-paying products.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <StatBox label="Products scored" value={data.productsScored} isDark={isDark} />
              <StatBox
                label="Score changes (12 mo)"
                value={data.scoreChangeStats.totalChanges}
                sub="since audit activated"
                isDark={isDark}
              />
              <StatBox
                label="Paying client changes"
                value={data.scoreChangeStats.paying.count}
                isDark={isDark}
              />
              <StatBox
                label="Non-paying changes"
                value={data.scoreChangeStats.nonPaying.count}
                isDark={isDark}
              />
            </div>
            <DeltaIndicator
              paying={data.scoreChangeStats.paying}
              nonPaying={data.scoreChangeStats.nonPaying}
              isDark={isDark}
            />
          </SectionCard>
        )}

        {/* Advisory Board */}
        <SectionCard title="Independent Advisory Board" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>
            The board is independent of Consciobite management and paying clients. Its mandate:
            annual methodology audit, sign-off on scoring parameter changes, and publication of
            audit summaries. The board is currently being constituted.
          </p>
          {isLoading ? (
            <Spinner message="Loading board info..." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(data?.advisoryBoard ?? []).map((seat) => (
                <BoardSeatCard key={seat.seat} seat={seat} isDark={isDark} />
              ))}
            </div>
          )}
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              fontSize: "0.82rem",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              lineHeight: 1.6,
            }}
          >
            Board members will be listed here with name, affiliation, and conflict-of-interest
            declaration once seated. Any member with a commercial relationship to a listed
            manufacturer will be recused from decisions affecting that product.
          </div>
        </SectionCard>

        {/* Governance commitments */}
        <SectionCard title="Our Commitments" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(data?.commitments ?? []).map((commitment, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#2d6a4f",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {commitment}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Link to methodology */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #0d2818 0%, #1b4332 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#fff",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "0.95rem",
                marginBottom: 4,
              }}
            >
              How does scoring actually work?
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.83rem", margin: 0 }}>
              Read the full GreenGrade algorithm documentation, data sources, and confidence
              scoring.
            </p>
          </div>
          <Link
            href="/methodology"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.88rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            View Methodology
          </Link>
        </div>

        {/* Last updated */}
        {data && (
          <p
            style={{
              textAlign: "center",
              fontSize: "0.78rem",
              color: isDark ? "#7a9a7e" : "#aaa",
            }}
          >
            Stats last updated {data.lastUpdated} &middot; Governance v{data.governanceVersion}
          </p>
        )}
      </div>
    </div>
  );
}
