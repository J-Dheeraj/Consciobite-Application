"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const Card = ({ title, children, isDark }) => (
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

const StatBox = ({ label, value, sub, isDark }) => (
  <div
    style={{
      flex: 1,
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
        color: isDark ? "#74c69d" : "#2d6a4f",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: isDark ? "#e8f5e9" : "#1a3a2a",
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

const SEAT_ICONS = { Academic: "🎓", Regulatory: "🏛️", Industry: "🏭" };

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
    staleTime: 5 * 60 * 1000,
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
  const { integrityStats, boardMembers } = data;

  const payingAvg = integrityStats.paying.avgDelta;
  const nonPayingAvg = integrityStats.nonPaying.avgDelta;
  const deltaLabel = (v) => (v === 0 ? "0.0000" : (v > 0 ? "+" : "") + v.toFixed(4));

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
            Grading Transparency
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            Our scoring is independent of commercial relationships. This page documents our
            governance structure, advisory board, and scoring integrity record.
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
            GreenGrade v{data.algorithmVersion} &nbsp;·&nbsp; Updated {data.lastUpdated}
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
        {/* Independence statement */}
        <Card title="Independence Statement" isDark={isDark}>
          <p
            style={{
              fontSize: "0.9rem",
              color: textColor,
              lineHeight: 1.7,
              borderLeft: "3px solid #52b788",
              paddingLeft: 16,
              margin: 0,
            }}
          >
            {data.statement}
          </p>
        </Card>

        {/* Scoring integrity stats */}
        <Card title="Scoring Integrity — Last 365 Days" isDark={isDark}>
          <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6, marginBottom: 16 }}>
            Every time the GreenGrade algorithm produces a different score for a product, the change
            is logged with a flag indicating whether that product&apos;s manufacturer is a paying
            client. The table below shows aggregate statistics — the average score delta should be
            similar across paying and non-paying products.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <StatBox
              label="Total score changes"
              value={integrityStats.totalChanges}
              sub={`last ${integrityStats.windowDays} days`}
              isDark={isDark}
            />
            <StatBox
              label="Paying avg delta"
              value={deltaLabel(payingAvg)}
              sub={`${integrityStats.paying.count} change(s)`}
              isDark={isDark}
            />
            <StatBox
              label="Non-paying avg delta"
              value={deltaLabel(nonPayingAvg)}
              sub={`${integrityStats.nonPaying.count} change(s)`}
              isDark={isDark}
            />
          </div>

          {integrityStats.totalChanges === 0 ? (
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
              <span style={{ fontSize: "1.1rem" }}>✓</span>
              <span
                style={{
                  fontSize: "0.88rem",
                  color: isDark ? "#74c69d" : "#2d6a4f",
                  fontWeight: 600,
                }}
              >
                No score changes detected in the last 365 days. Algorithm is stable.
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Paying clients",
                  data: integrityStats.paying,
                  color: "#2d6a4f",
                },
                {
                  label: "Non-paying products",
                  data: integrityStats.nonPaying,
                  color: "#1a3a2a",
                },
              ].map(({ label, data: d, color }) => (
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
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: isDark ? "#e8f5e9" : color,
                      marginBottom: 8,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      ["Changes", d.count],
                      ["Avg delta", deltaLabel(d.avgDelta)],
                      ["Increases", d.increases],
                      ["Decreases", d.decreases],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.8rem",
                          color: textColor,
                        }}
                      >
                        <span>{k}</span>
                        <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Advisory board */}
        <Card title="Independent Grading Advisory Board" isDark={isDark}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: isDark ? "#2a1e0a" : "#fffbeb",
              border: `1px solid ${isDark ? "#5a3e10" : "#f6d860"}`,
              marginBottom: 16,
              fontSize: "0.85rem",
              color: isDark ? "#f6d860" : "#92400e",
            }}
          >
            <strong>Board forming</strong> — we are recruiting three independent board members. Seat
            applications open Q3 2026.
          </div>

          <p style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6, marginBottom: 16 }}>
            The board&apos;s mandate: annual methodology audit, sign-off on scoring parameter
            changes, published audit summaries, and maintenance of a public conflict-of-interest
            register.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {boardMembers.map((member) => (
              <div
                key={member.seat}
                style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                  {SEAT_ICONS[member.seat] ?? "👤"}
                </span>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                      }}
                    >
                      {member.seat} Seat
                    </span>
                    <span
                      style={{
                        padding: "1px 8px",
                        borderRadius: 10,
                        background:
                          member.status === "open"
                            ? isDark
                              ? "#2a1e0a"
                              : "#fffbeb"
                            : "rgba(39,174,96,0.12)",
                        color: member.status === "open" ? "#f39c12" : "#27ae60",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {member.status === "open" ? "Recruiting" : "Appointed"}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.83rem",
                      color: textColor,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Links */}
        <Card title="Further Reading" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                href: "/methodology",
                label: "Scoring Methodology",
                desc: "Full algorithm documentation — KDE model, 7 emission dimensions, data confidence tiers",
              },
              {
                href: "/about",
                label: "About Consciobite",
                desc: "Mission, team, and commercial model",
              },
            ].map(({ href, label, desc }) => (
              <a
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>→</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: isDark ? "#74c69d" : "#2d6a4f",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: textColor }}>{desc}</div>
                </div>
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
