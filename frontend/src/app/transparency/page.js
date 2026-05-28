"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const Card = ({ children, isDark }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      animation: "fadeInUp 0.4s ease both",
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ children, isDark }) => (
  <h3
    style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      fontSize: "1.05rem",
      marginBottom: 14,
      color: isDark ? "#e8f5e9" : "#1a3a2a",
    }}
  >
    {children}
  </h3>
);

const StatBox = ({ label, value, sub, accent, isDark }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 10,
      background: isDark ? "#1c2e22" : "#f8faf8",
      border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "1.6rem",
        fontWeight: 800,
        color: accent || (isDark ? "#52b788" : "#2d6a4f"),
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: isDark ? "#7a9a7e" : "#888",
        marginTop: 2,
      }}
    >
      {label}
    </div>
    {sub && (
      <div style={{ fontSize: "0.7rem", color: isDark ? "#52b788" : "#555", marginTop: 4 }}>
        {sub}
      </div>
    )}
  </div>
);

function DeltaRow({ label, data, isDark }) {
  const textColor = isDark ? "#b0c4b1" : "#555";
  const headColor = isDark ? "#e8f5e9" : "#1a3a2a";
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: isDark ? "#1c2e22" : "#f8faf8",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: headColor, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: textColor }}>Changes</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: headColor }}>{data.count}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: textColor }}>Avg delta</div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: data.avgDelta > 0 ? "#27ae60" : data.avgDelta < 0 ? "#e74c3c" : headColor,
            }}
          >
            {data.avgDelta > 0 ? "+" : ""}
            {data.avgDelta.toFixed(3)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: textColor }}>Up / Down</div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: headColor }}>
            <span style={{ color: "#27ae60" }}>{data.increases}</span>
            {" / "}
            <span style={{ color: "#e74c3c" }}>{data.decreases}</span>
          </div>
        </div>
      </div>
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

  if (isLoading) return <Spinner message="Loading transparency data..." />;

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
  const { algorithm, governance, independence, manufacturers } = data;

  const noChanges = independence.totalScoreChanges === 0;
  const payingAvg = independence.paying.avgDelta;
  const nonPayingAvg = independence.nonPaying.avgDelta;
  const biasDelta = Math.abs(payingAvg - nonPayingAvg).toFixed(3);

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
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            Live evidence of our commitment to unbiased, independent product scoring.
          </p>
          <div
            style={{
              marginTop: 12,
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 20,
              background: "rgba(82,183,136,0.2)",
              color: "#52b788",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {algorithm.name} v{algorithm.version}
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
        {/* Snapshot stats */}
        <Card isDark={isDark}>
          <CardTitle isDark={isDark}>Catalogue at a Glance</CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <StatBox label="Products scored" value={algorithm.totalProducts} isDark={isDark} />
            <StatBox label="Emission dimensions" value={algorithm.dimensions} isDark={isDark} />
            <StatBox
              label="Manufacturers listed"
              value={manufacturers.total}
              sub={`${manufacturers.paying} paying · ${manufacturers.nonPaying} non-paying`}
              isDark={isDark}
            />
          </div>
        </Card>

        {/* Score independence */}
        <Card isDark={isDark}>
          <CardTitle isDark={isDark}>Score Independence — {independence.period}</CardTitle>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 16 }}>
            Every time GreenGrade recalculates scores, the change is logged alongside whether the
            affected product belongs to a paying manufacturer. The table below shows whether paying
            clients receive systematically higher score bumps than others.
          </p>

          {noChanges ? (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: "rgba(39,174,96,0.1)",
                border: "1px solid rgba(39,174,96,0.3)",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                fontSize: "0.9rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              No score changes detected in the last 12 months — algorithm parameters unchanged.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <DeltaRow label="Paying-client products" data={independence.paying} isDark={isDark} />
              <DeltaRow label="Non-paying products" data={independence.nonPaying} isDark={isDark} />
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1a2e22" : "#edf7f0",
                  fontSize: "0.82rem",
                  color: isDark ? "#7a9a7e" : "#444",
                }}
              >
                Avg delta bias between groups:{" "}
                <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>{biasDelta}</strong> —
                lower is more independent.
              </div>
            </div>
          )}
        </Card>

        {/* Advisory board */}
        <Card isDark={isDark}>
          <CardTitle isDark={isDark}>Independent Grading Advisory Board</CardTitle>
          <div
            style={{
              display: "inline-block",
              padding: "3px 12px",
              borderRadius: 20,
              background: "rgba(243,156,18,0.15)",
              color: "#f39c12",
              fontSize: "0.75rem",
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            {governance.advisoryBoardStatus}
          </div>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 14 }}>
            An Independent Grading Advisory Board will provide external oversight of our scoring
            methodology, with seats reserved for an academic researcher, a civil-service regulator,
            and an industry professional with no commercial relationship with Consciobite.
          </p>
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
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {governance.mandate.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.88rem",
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
          {governance.advisoryBoardMembers.length === 0 && (
            <p
              style={{
                marginTop: 14,
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                fontStyle: "italic",
              }}
            >
              Board members will be disclosed here once appointments are confirmed.
            </p>
          )}
        </Card>

        {/* Audit trail note */}
        <Card isDark={isDark}>
          <CardTitle isDark={isDark}>Audit Trail</CardTitle>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 14 }}>
            Since <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>May 2026</strong>, every
            score recalculation is automatically recorded with a timestamp, the previous score, the
            new score, and a flag indicating whether the product&apos;s manufacturer is a paying
            client. This log is immutable and reviewable by the advisory board.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(39,174,96,0.1)",
              border: "1px solid rgba(39,174,96,0.3)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#27ae60",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.85rem",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                fontWeight: 600,
              }}
            >
              Audit trail active
            </span>
          </div>
        </Card>

        {/* Link to methodology */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <Link
            href="/methodology"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              borderRadius: 12,
              background: "#2d6a4f",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Read the Full Methodology
          </Link>
        </div>
      </div>
    </div>
  );
}
