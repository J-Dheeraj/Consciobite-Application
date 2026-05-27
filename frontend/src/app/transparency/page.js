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
      boxShadow: isDark
        ? "0 2px 8px rgba(0,0,0,0.15)"
        : "0 2px 8px rgba(27,67,50,0.06)",
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

const StatBox = ({ label, value, sub, accent, isDark }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: isDark ? "#1c2e22" : "#f0f7f2",
      border: `1px solid ${accent}30`,
      flex: 1,
      minWidth: 120,
    }}
  >
    <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 4 }}>
      {label}
    </div>
    <div
      style={{
        fontWeight: 800,
        fontSize: "1.5rem",
        color: accent,
        fontFamily: "'Outfit', sans-serif",
        lineHeight: 1,
        marginBottom: 2,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888" }}>{sub}</div>
    )}
  </div>
);

const BiasBar = ({ label, delta, max, isDark }) => {
  const pct = max > 0 ? Math.min(Math.abs(delta) / max, 1) * 100 : 0;
  const positive = delta >= 0;
  const color = Math.abs(delta) < 0.1 ? "#27ae60" : Math.abs(delta) < 0.5 ? "#f39c12" : "#e74c3c";
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          marginBottom: 4,
          color: isDark ? "#b0c4b1" : "#555",
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>
          {positive ? "+" : ""}
          {delta.toFixed(3)}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: isDark ? "#2d4a35" : "#e8f0e8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const cfg =
    status === "open"
      ? { bg: "rgba(243,156,18,0.15)", color: "#d4890a", label: "Seeking Appointment" }
      : status === "appointed"
        ? { bg: "rgba(39,174,96,0.15)", color: "#27ae60", label: "Appointed" }
        : { bg: "rgba(149,213,178,0.15)", color: "#52b788", label: status };
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 12,
        background: cfg.bg,
        color: cfg.color,
        fontSize: "0.7rem",
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </span>
  );
};

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
  });

  if (isLoading) return <Spinner message="Loading transparency report..." />;

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

  const textColor = isDark ? "#b0c4b1" : "#555";
  const { biasAnalysis, advisoryBoard, scoreDistribution, totalProductsScored } = data;
  const maxDelta = Math.max(
    Math.abs(biasAnalysis.payingClients.avgScoreDelta),
    Math.abs(biasAnalysis.nonPayingClients.avgScoreDelta),
    0.01
  );

  const biasColor =
    biasAnalysis.biasIndicator === "none" || biasAnalysis.biasIndicator === "insufficient_data"
      ? "#27ae60"
      : biasAnalysis.biasIndicator === "low"
        ? "#f39c12"
        : "#e74c3c";

  const biasLabel =
    {
      none: "No bias detected",
      insufficient_data: "Insufficient data",
      no_paying_changes: "No paying-client changes",
      low: "Low — monitoring",
      moderate: "Moderate — under review",
      high: "High — escalated",
    }[biasAnalysis.biasIndicator] || biasAnalysis.biasIndicator;

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
            Transparency Report
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 550,
              margin: "0 auto 12px",
            }}
          >
            Live governance statistics, bias monitoring, and advisory board status. Updated in
            real time.
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
              GreenGrade v{data.methodologyVersion}
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(82,183,136,0.1)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.8rem",
              }}
            >
              Updated {data.lastUpdated}
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
        {/* Overview stats */}
        <SectionCard title="Scoring Overview" isDark={isDark}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <StatBox
              label="Products Scored"
              value={totalProductsScored}
              sub="in catalog"
              accent="#52b788"
              isDark={isDark}
            />
            <StatBox
              label="Green (7–10)"
              value={scoreDistribution.green}
              sub={`${Math.round((scoreDistribution.green / totalProductsScored) * 100)}%`}
              accent="#27ae60"
              isDark={isDark}
            />
            <StatBox
              label="Yellow (4–6.9)"
              value={scoreDistribution.yellow}
              sub={`${Math.round((scoreDistribution.yellow / totalProductsScored) * 100)}%`}
              accent="#f39c12"
              isDark={isDark}
            />
            <StatBox
              label="Red (0–3.9)"
              value={scoreDistribution.red}
              sub={`${Math.round((scoreDistribution.red / totalProductsScored) * 100)}%`}
              accent="#e74c3c"
              isDark={isDark}
            />
          </div>
          <p style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.6 }}>
            Scores are computed using the GreenGrade KDE algorithm across 7 emission dimensions.
            See{" "}
            <Link href="/methodology" style={{ color: "#52b788" }}>
              Methodology
            </Link>{" "}
            for full details.
          </p>
        </SectionCard>

        {/* Bias analysis */}
        <SectionCard title="Conflict-of-Interest Monitoring" isDark={isDark}>
          <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6, marginBottom: 16 }}>
            {biasAnalysis.note}
          </p>

          {/* Bias indicator badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 10,
              background: `${biasColor}15`,
              border: `1px solid ${biasColor}30`,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: biasColor,
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: biasColor }}>
                {biasLabel}
              </div>
              <div style={{ fontSize: "0.78rem", color: textColor }}>
                Based on {biasAnalysis.totalChanges} score change
                {biasAnalysis.totalChanges !== 1 ? "s" : ""} in the {biasAnalysis.period}
              </div>
            </div>
          </div>

          {/* Avg delta bars */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: 8,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Average Score Delta (last 12 months)
            </div>
            <BiasBar
              label="Paying clients"
              delta={biasAnalysis.payingClients.avgScoreDelta}
              max={maxDelta}
              isDark={isDark}
            />
            <BiasBar
              label="Non-paying clients"
              delta={biasAnalysis.nonPayingClients.avgScoreDelta}
              max={maxDelta}
              isDark={isDark}
            />
          </div>

          {/* Change counts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 4,
            }}
          >
            {[
              {
                label: "Paying — changes",
                value: biasAnalysis.payingClients.changes,
                up: biasAnalysis.payingClients.increases,
                down: biasAnalysis.payingClients.decreases,
              },
              {
                label: "Non-paying — changes",
                value: biasAnalysis.nonPayingClients.changes,
                up: biasAnalysis.nonPayingClients.increases,
                down: biasAnalysis.nonPayingClients.decreases,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 4 }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 2,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: "0.72rem", color: textColor }}>
                  <span style={{ color: "#27ae60" }}>{"↑"}{item.up} up</span>
                  {" · "}
                  <span style={{ color: "#e74c3c" }}>{"↓"}{item.down} down</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Advisory board */}
        <SectionCard title="Independent Grading Advisory Board" isDark={isDark}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
              padding: "10px 14px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{"🏛"}</span>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              >
                Status: Board Formation in Progress
              </div>
              <div style={{ fontSize: "0.78rem", color: textColor }}>
                Target: {advisoryBoard.targetFormation}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6, marginBottom: 14 }}>
            {advisoryBoard.note}
          </p>

          {/* Seats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {advisoryBoard.seats.map((seat) => (
              <div
                key={seat.role}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "12px 14px",
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
                      {seat.role} Seat
                    </span>
                    <StatusPill status={seat.status} />
                  </div>
                  <p style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.5, margin: 0 }}>
                    {seat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mandate */}
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 8,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Board Mandate
            </div>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {advisoryBoard.mandate.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.85rem",
                    color: textColor,
                    lineHeight: 1.7,
                    marginBottom: 4,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Commitments */}
        <SectionCard title="Our Governance Commitments" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.commitments.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom:
                    i < data.commitments.length - 1
                      ? `1px solid ${isDark ? "#2d4a35" : "#eee"}`
                      : "none",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(82,183,136,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "0.7rem",
                    color: "#52b788",
                    fontWeight: 700,
                    marginTop: 1,
                  }}
                >
                  {"✓"}
                </span>
                <p style={{ fontSize: "0.88rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {item}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Footer CTA */}
        <div
          style={{
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: textColor, marginBottom: 12 }}>
            Want to understand how scores are calculated?
          </p>
          <Link
            href="/methodology"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              background: "#2d6a4f",
              color: "#fff",
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Read the Methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
