"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
        marginBottom: 14,
        color: isDark ? "#e8f5e9" : "#1a3a2a",
      }}
    >
      {title}
    </h3>
    {children}
  </div>
);

const StatusPill = ({ filled, isDark }) => (
  <span
    style={{
      padding: "2px 10px",
      borderRadius: 12,
      background: filled
        ? "rgba(39,174,96,0.15)"
        : isDark
          ? "rgba(255,193,7,0.15)"
          : "rgba(243,156,18,0.12)",
      color: filled ? "#27ae60" : "#f39c12",
      fontSize: "0.7rem",
      fontWeight: 700,
    }}
  >
    {filled ? "Filled" : "Forming"}
  </span>
);

const DeltaBar = ({ paying, nonPaying, isDark }) => {
  const total = (paying || 0) + (nonPaying || 0);
  if (total === 0)
    return (
      <p style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888" }}>
        No score changes recorded yet.
      </p>
    );
  const payingPct = Math.round(((paying || 0) / total) * 100);
  return (
    <div>
      <div
        style={{
          height: 10,
          borderRadius: 8,
          background: isDark ? "#1c2e22" : "#e8f0e8",
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${payingPct}%`,
            background: "#2d6a4f",
            borderRadius: 8,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
        <span style={{ color: isDark ? "#7a9a7e" : "#888" }}>
          Paying clients: {paying || 0} ({payingPct}%)
        </span>
        <span style={{ color: isDark ? "#7a9a7e" : "#888" }}>
          Non-paying: {nonPaying || 0} ({100 - payingPct}%)
        </span>
      </div>
    </div>
  );
};

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
  });

  const textColor = isDark ? "#b0c4b1" : "#555";

  if (isLoading) return <Spinner message="Loading governance data..." />;

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

  const { governanceCommitments, advisoryBoard, auditStats, methodologyVersion } = data;

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
            Transparency & Governance
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 12px",
            }}
          >
            How we ensure our scoring is independent, auditable, and free from commercial bias.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
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
              GreenGrade v{methodologyVersion}
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(243,156,18,0.15)",
                color: "#f39c12",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Advisory Board Forming
            </div>
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
        {/* Conflict of Interest Statement */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "#162419" : "#edf7f0",
            border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 6,
            }}
          >
            Our commitment on conflicts of interest
          </div>
          <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.65, margin: 0 }}>
            Consciobite charges manufacturers a listing fee to appear on the platform. GreenGrade
            scores are computed by a <strong>deterministic, open algorithm</strong> — fees do not
            and cannot influence scores. This page documents how we enforce and audit that
            separation.
          </p>
        </div>

        {/* Governance commitments */}
        <SectionCard title="Governance Commitments" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {governanceCommitments.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 4,
                  }}
                >
                  {item.commitment}
                </div>
                <p style={{ fontSize: "0.83rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Advisory Board */}
        <SectionCard title="Independent Advisory Board" isDark={isDark}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: isDark ? "#1c2e22" : "rgba(243,156,18,0.08)",
              border: "1px solid rgba(243,156,18,0.25)",
              marginBottom: 14,
              fontSize: "0.83rem",
              color: textColor,
              lineHeight: 1.6,
            }}
          >
            {advisoryBoard.description}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                marginBottom: 8,
              }}
            >
              Board Seats
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {advisoryBoard.seats.map((seat, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#f8faf8",
                    border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: isDark ? "#e8f5e9" : "#1a3a2a",
                        }}
                      >
                        {seat.role}
                      </span>
                      <StatusPill filled={seat.filled} isDark={isDark} />
                    </div>
                    <p
                      style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.55, margin: 0 }}
                    >
                      {seat.mandate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                marginBottom: 8,
              }}
            >
              Board Mandate
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {advisoryBoard.mandate.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.83rem",
                    color: textColor,
                    lineHeight: 1.6,
                    marginBottom: 4,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Score Audit Statistics */}
        <SectionCard title="Score Audit Statistics (last 12 months)" isDark={isDark}>
          {auditStats ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#edf7f0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: isDark ? "#95d5b2" : "#2d6a4f",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {auditStats.totalScoreChanges}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: textColor }}>Total score changes</div>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#edf7f0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      color: isDark ? "#95d5b2" : "#2d6a4f",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {auditStats.totalScoreChanges === 0
                      ? "—"
                      : `${Math.round(((auditStats.payingClients.increases + auditStats.nonPayingClients.increases) / auditStats.totalScoreChanges) * 100)}%`}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: textColor }}>Score increases</div>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 8,
                  }}
                >
                  Distribution by client type
                </div>
                <DeltaBar
                  paying={auditStats.payingClients.changes}
                  nonPaying={auditStats.nonPayingClients.changes}
                  isDark={isDark}
                />
              </div>
              {auditStats.totalScoreChanges === 0 && (
                <p style={{ fontSize: "0.83rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  No score changes have been recorded since the audit trail was activated. This is
                  expected on the first deployment — the baseline will be established on the next
                  algorithm update or model retrain.
                </p>
              )}
              {auditStats.totalScoreChanges > 0 && (
                <p style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#aaa", margin: 0 }}>
                  Paying client changes averaged {auditStats.payingClients.avgDelta > 0 ? "+" : ""}
                  {auditStats.payingClients.avgDelta} pts; non-paying averaged{" "}
                  {auditStats.nonPayingClients.avgDelta > 0 ? "+" : ""}
                  {auditStats.nonPayingClients.avgDelta} pts. Consistent deltas indicate no
                  systematic bias.
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: textColor }}>
              Audit statistics are not available in this environment.
            </p>
          )}
        </SectionCard>

        {/* Links */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/methodology"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Full Methodology
          </Link>
          <Link
            href="/about"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            About Consciobite
          </Link>
        </div>
      </div>
    </div>
  );
}
