"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const SectionCard = ({ title, icon, children, isDark }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      animation: "fadeInUp 0.4s ease both",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      {icon && <span style={{ fontSize: "1.3rem" }}>{icon}</span>}
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          margin: 0,
        }}
      >
        {title}
      </h3>
    </div>
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
        fontSize: "1.6rem",
        fontWeight: 800,
        color: isDark ? "#52b788" : "#2d6a4f",
        fontFamily: "'Outfit', sans-serif",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: isDark ? "#b0c4b1" : "#555",
        marginTop: 4,
      }}
    >
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: "0.7rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 2 }}>
        {sub}
      </div>
    )}
  </div>
);

const BoardSeat = ({ seat, isDark }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 12,
      background: isDark ? "#1c2e22" : "#f8faf8",
      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <span
        style={{
          padding: "2px 10px",
          borderRadius: 20,
          background:
            seat.status === "vacant" ? (isDark ? "#2d3a2d" : "#f3f3f3") : "rgba(39,174,96,0.15)",
          color: seat.status === "vacant" ? (isDark ? "#7a9a7e" : "#999") : "#27ae60",
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {seat.status === "vacant" ? "Seat Vacant" : "Appointed"}
      </span>
      <span
        style={{
          fontWeight: 700,
          fontSize: "0.92rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {seat.role}
      </span>
      {seat.name && (
        <span style={{ fontSize: "0.85rem", color: isDark ? "#b0c4b1" : "#555" }}>
          — {seat.name}
          {seat.affiliation && `, ${seat.affiliation}`}
        </span>
      )}
    </div>
    <p
      style={{
        fontSize: "0.83rem",
        color: isDark ? "#b0c4b1" : "#666",
        lineHeight: 1.6,
        margin: 0,
      }}
    >
      {seat.description}
    </p>
  </div>
);

const DeltaBadge = ({ label, delta, isDark }) => {
  const positive = delta > 0;
  const zero = delta === 0;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 8,
        fontSize: "0.78rem",
        fontWeight: 700,
        background: zero
          ? isDark
            ? "#2d3a2d"
            : "#f3f3f3"
          : positive
            ? "rgba(39,174,96,0.15)"
            : "rgba(231,57,60,0.12)",
        color: zero ? (isDark ? "#7a9a7e" : "#999") : positive ? "#27ae60" : "#e74c3c",
      }}
    >
      {label}: {delta > 0 ? "+" : ""}
      {delta.toFixed(4)}
    </span>
  );
};

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textColor = isDark ? "#b0c4b1" : "#555";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
    staleTime: 5 * 60 * 1000,
  });

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

  const { advisoryBoard, scoringStats, commitments, lastAuditDate, algorithmVersion } = data;

  const payingDelta = scoringStats.paying.avgDelta;
  const nonPayingDelta = scoringStats.nonPaying.avgDelta;
  const deltaGap = Math.abs(payingDelta - nonPayingDelta).toFixed(4);

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
            Governance &amp; Transparency
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 550,
              margin: "0 auto 14px",
              lineHeight: 1.6,
            }}
          >
            How we ensure GreenGrade scoring remains independent from our commercial relationships.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
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
              Algorithm v{algorithmVersion}
            </div>
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
              Last audit: {lastAuditDate}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "24px 20px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Advisory Board */}
        <SectionCard title="Independent Grading Advisory Board" icon="🏛️" isDark={isDark}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#fff8e8",
              border: `1px solid ${isDark ? "#4a3a1a" : "#f0d060"}`,
              marginBottom: 16,
              fontSize: "0.85rem",
              color: isDark ? "#c4a840" : "#7a5c00",
            }}
          >
            <strong>Board status:</strong>{" "}
            {advisoryBoard.status === "formation" ? "Under formation" : "Active"}. Expected
            appointment by {advisoryBoard.expectedFormationDate}.
          </div>

          <p
            style={{
              fontSize: "0.88rem",
              color: textColor,
              lineHeight: 1.7,
              marginBottom: 16,
            }}
          >
            The advisory board provides independent oversight of the GreenGrade methodology. Members
            are not employed by Consciobite and have no commercial relationship with any listed
            manufacturer.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {advisoryBoard.seats.map((seat) => (
              <BoardSeat key={seat.role} seat={seat} isDark={isDark} />
            ))}
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: isDark ? "#95d5b2" : "#2d6a4f",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Board mandate
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {advisoryBoard.mandate.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.83rem",
                    color: textColor,
                    lineHeight: 1.7,
                    marginBottom: 2,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Scoring independence stats */}
        <SectionCard title="Scoring Independence Statistics" icon="📊" isDark={isDark}>
          <p
            style={{
              fontSize: "0.88rem",
              color: textColor,
              lineHeight: 1.7,
              marginBottom: 16,
            }}
          >
            We publish aggregate statistics on every score change, broken down by whether the
            affected product belongs to a paying client. A zero (or near-zero) gap in average score
            delta between the two groups is evidence of algorithmic independence.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <StatBox
              label="Products scored"
              value={scoringStats.totalProducts.toLocaleString()}
              isDark={isDark}
            />
            <StatBox
              label="Score changes (all-time)"
              value={scoringStats.totalScoreChanges.toLocaleString()}
              isDark={isDark}
            />
            <StatBox
              label="Listed manufacturers"
              value={scoringStats.listedManufacturers.toLocaleString()}
              isDark={isDark}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                padding: "16px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f8faf8",
                border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 8,
                }}
              >
                Paying clients
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: "0.83rem", color: textColor }}>
                  Changes:{" "}
                  <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                    {scoringStats.paying.changes}
                  </strong>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <DeltaBadge label="Avg Δ" delta={scoringStats.paying.avgDelta} isDark={isDark} />
                </div>
                <div style={{ fontSize: "0.78rem", color: textColor }}>
                  ↑ {scoringStats.paying.increases} increases &nbsp; ↓{" "}
                  {scoringStats.paying.decreases} decreases
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "16px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f8faf8",
                border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 8,
                }}
              >
                Non-paying clients
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: "0.83rem", color: textColor }}>
                  Changes:{" "}
                  <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                    {scoringStats.nonPaying.changes}
                  </strong>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <DeltaBadge
                    label="Avg Δ"
                    delta={scoringStats.nonPaying.avgDelta}
                    isDark={isDark}
                  />
                </div>
                <div style={{ fontSize: "0.78rem", color: textColor }}>
                  ↑ {scoringStats.nonPaying.increases} increases &nbsp; ↓{" "}
                  {scoringStats.nonPaying.decreases} decreases
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>⚖️</span>
            <span style={{ fontSize: "0.83rem", color: isDark ? "#95d5b2" : "#2d6a4f" }}>
              Average score delta gap between paying and non-paying clients:{" "}
              <strong>{deltaGap}</strong>. A value close to zero indicates no systematic bias.
            </span>
          </div>
        </SectionCard>

        {/* Governance commitments */}
        <SectionCard title="Governance Commitments" icon="📋" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {commitments.map((commitment, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom:
                    i < commitments.length - 1
                      ? `1px solid ${isDark ? "#2d4a35" : "#eee"}`
                      : "none",
                }}
              >
                <span
                  style={{
                    color: "#52b788",
                    fontWeight: 700,
                    fontSize: "1rem",
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: textColor,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
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
            background: isDark ? "#162419" : "#edf7f0",
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
                fontWeight: 700,
                fontSize: "0.95rem",
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                marginBottom: 4,
              }}
            >
              Full Scoring Methodology
            </div>
            <p style={{ fontSize: "0.83rem", color: textColor, margin: 0 }}>
              Algorithm details, emission dimensions, data sources, and academic references.
            </p>
          </div>
          <Link
            href="/methodology"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.88rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View Methodology →
          </Link>
        </div>
      </div>
    </div>
  );
}
