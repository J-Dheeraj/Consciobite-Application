"use client";
import React from "react";
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
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      {icon && <span style={{ fontSize: "1.3rem" }}>{icon}</span>}
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.05rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const StatBox = ({ label, value, sub, isDark, color }) => (
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
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: "1.6rem",
        color: color || (isDark ? "#95d5b2" : "#2d6a4f"),
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: isDark ? "#b0c4b1" : "#555",
        marginTop: 2,
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

const BoardSeat = ({ seat, isDark }) => {
  const statusColor = seat.status === "filled" ? "#27ae60" : "#f39c12";
  const statusLabel = seat.status === "filled" ? "Filled" : "Open";
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: isDark ? "#1c2e22" : "#f8faf8",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(135deg, #1c2e22, #2d4a35)"
            : "linear-gradient(135deg, #d8f3dc, #b7e4c7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          flexShrink: 0,
        }}
      >
        {seat.role === "Academic" ? "🎓" : seat.role === "Regulator" ? "🏛️" : "🌿"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            {seat.role}
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
        <div style={{ fontSize: "0.82rem", color: isDark ? "#b0c4b1" : "#666" }}>{seat.field}</div>
        {seat.name && (
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginTop: 2,
            }}
          >
            {seat.name}
          </div>
        )}
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

  if (isLoading) {
    return <Spinner message="Loading transparency report..." />;
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

  const textColor = isDark ? "#b0c4b1" : "#555";
  const { governance, auditStats, algorithmVersion, statement } = data;
  const boardStatus = governance.advisoryBoard.status;

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
            {statement}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
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
                background: "rgba(243,156,18,0.15)",
                color: "#f39c12",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              Advisory Board {boardStatus === "forming" ? "— Forming" : "— Active"}
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
        {/* Score audit summary */}
        <SectionCard title="Score Audit — Last 12 Months" icon="📊" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 14 }}>
            Every time GreenGrade scores are recomputed, changes are logged and tagged as paying or
            non-paying client. This table shows aggregate drift over the past 12 months — no product
            details are disclosed here.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <StatBox
              label="Total Changes"
              value={auditStats.totalChanges}
              sub="score updates logged"
              isDark={isDark}
            />
            <StatBox
              label="Paying Clients"
              value={auditStats.paying.count}
              sub={`avg delta: ${auditStats.paying.avgDelta > 0 ? "+" : ""}${auditStats.paying.avgDelta}`}
              isDark={isDark}
            />
            <StatBox
              label="Non-Paying"
              value={auditStats.nonPaying.count}
              sub={`avg delta: ${auditStats.nonPaying.avgDelta > 0 ? "+" : ""}${auditStats.nonPaying.avgDelta}`}
              isDark={isDark}
            />
          </div>
          {auditStats.totalChanges === 0 ? (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#edf7f0",
                fontSize: "0.83rem",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✓</span>
              <span>No score changes recorded in the past 12 months.</span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                {
                  label: "Paying — Increases",
                  value: auditStats.paying.increases,
                  color: "#27ae60",
                },
                {
                  label: "Paying — Decreases",
                  value: auditStats.paying.decreases,
                  color: "#e74c3c",
                },
                {
                  label: "Non-Paying — Increases",
                  value: auditStats.nonPaying.increases,
                  color: "#27ae60",
                },
                {
                  label: "Non-Paying — Decreases",
                  value: auditStats.nonPaying.decreases,
                  color: "#e74c3c",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#f8faf8",
                    border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.8rem", color: textColor }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Advisory board */}
        <SectionCard title="Independent Grading Advisory Board" icon="🏛️" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.88rem", lineHeight: 1.6, marginBottom: 14 }}>
            An independent advisory board reviews our scoring methodology annually and signs off on
            any changes to scoring parameters. All board members must disclose conflicts of interest
            and cannot be active Consciobite clients.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {governance.advisoryBoard.seats.map((seat) => (
              <BoardSeat key={seat.role} seat={seat} isDark={isDark} />
            ))}
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#f8faf8",
              border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
            }}
          >
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                marginBottom: 8,
              }}
            >
              Board Mandate
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {governance.advisoryBoard.mandate.map((item, i) => (
                <li key={i} style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.7 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Governance principles */}
        <SectionCard title="Governance Principles" icon="📋" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {governance.principles.map((principle) => (
              <div
                key={principle.title}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                    marginBottom: 4,
                  }}
                >
                  {principle.title}
                </div>
                <div style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.5 }}>
                  {principle.description}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Links */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            href="/methodology"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 600,
            }}
          >
            View Full Methodology
          </a>
          <a
            href="/products"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 600,
              border: `1px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
            }}
          >
            Browse Scored Products
          </a>
        </div>
      </div>
    </div>
  );
}
