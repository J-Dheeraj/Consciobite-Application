"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchStats } from "@/services/api";
import Spinner from "@/components/Spinner";

const ADVISORY_BOARD = [
  {
    seat: "Academic",
    icon: "🏫",
    role: "Sustainability & Food Science Researcher",
    purpose:
      "Provides scientific credibility. Reviews emission factors, lifecycle methodology, and category weight assignments.",
    status: "Recruitment open",
  },
  {
    seat: "Regulator",
    icon: "🏛️",
    role: "Civil Servant — e.g. Singapore Food Agency (SFA)",
    purpose:
      "Provides regulatory legitimacy. Ensures methodology aligns with national and regional food-system standards.",
    status: "In discussion",
  },
  {
    seat: "Industry",
    icon: "🦹",
    role: "Industry Professional (non-paying client)",
    purpose:
      "Provides practical relevance. Must hold no commercial relationship with Consciobite to preserve independence.",
    status: "Recruitment open",
  },
];

const PRINCIPLES = [
  {
    icon: "🔒",
    title: "Algorithmic Independence",
    desc: "GreenGrade scores are computed deterministically from emission data using a publicly documented KDE + sigmoid algorithm. Commercial relationships do not alter the scoring function.",
  },
  {
    icon: "📊",
    title: "Listing Fees are Non-Contingent",
    desc: "Manufacturer listing fees are fixed and do not depend on the score awarded. A manufacturer cannot pay to improve their grade.",
  },
  {
    icon: "🔍",
    title: "Annual Methodology Audit",
    desc: "The Independent Grading Advisory Board audits the scoring algorithm annually. Any parameter change requires board sign-off before deployment.",
  },
  {
    icon: "🗒️",
    title: "Score Change Audit Trail",
    desc: "Every change to a product’s GreenGrade score is logged with a timestamp, reason, and whether the product belongs to a paying client. Aggregate statistics are published here.",
  },
];

function StatBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        <span style={{ color }}>{label}</span>
        <span style={{ color: "#888" }}>
          {count} products ({pct}%)
        </span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 99,
          background: "rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.8s ease",
          }}
        />
      </div>
    </div>
  );
}

function Card({ children, isDark, style = {} }) {
  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: 24,
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, isDark }) {
  return (
    <h2
      style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: "1.2rem",
        color: isDark ? "#e8f5e9" : "#1a3a2a",
        marginBottom: 16,
      }}
    >
      {children}
    </h2>
  );
}

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["productStats"],
    queryFn: fetchStats,
  });

  const textColor = isDark ? "#b0c4b1" : "#555";
  const subtleColor = isDark ? "#7a9a7e" : "#888";

  const dist = stats?.gradeDistribution;
  const total = stats?.totalProducts ?? 0;

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
            opacity: 0.05,
            backgroundImage:
              "radial-gradient(circle at 25% 35%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 65%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 20,
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Governance
          </div>
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
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.95rem",
              maxWidth: 560,
              margin: "0 auto 20px",
              lineHeight: 1.6,
            }}
          >
            How we ensure GreenGrade scores remain independent of commercial relationships, who
            audits our methodology, and what our score distribution looks like.
          </p>
          <Link
            href="/methodology"
            style={{
              display: "inline-block",
              padding: "10px 22px",
              borderRadius: 10,
              background: "rgba(82,183,136,0.18)",
              color: "#52b788",
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: "none",
              border: "1px solid rgba(82,183,136,0.3)",
            }}
          >
            Read the Methodology →
          </Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: 740,
          margin: "0 auto",
          padding: "28px 20px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Independence principles */}
        <Card isDark={isDark}>
          <SectionTitle isDark={isDark}>Grading Independence Policy</SectionTitle>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 20 }}>
            Consciobite charges manufacturers a listing fee to be included on our platform. Our
            GreenGrade scoring simultaneously claims to be objective and independent. We take this
            tension seriously and have implemented the following safeguards.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f4faf5",
                  border: `1px solid ${isDark ? "#2d4a35" : "#dceee2"}`,
                }}
              >
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{p.icon}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                      marginBottom: 4,
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.6 }}>
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score distribution */}
        <Card isDark={isDark}>
          <SectionTitle isDark={isDark}>Score Distribution</SectionTitle>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 20 }}>
            Current distribution of GreenGrade scores across all {total} scored products. Scores
            range 0–10; green (≥7), yellow (4–6.9), red (&lt;4).
          </p>

          {isLoading ? (
            <Spinner message="Loading stats..." />
          ) : dist ? (
            <>
              <StatBar label="Green (7–10)" count={dist.green} total={total} color="#27ae60" />
              <StatBar label="Yellow (4–6.9)" count={dist.yellow} total={total} color="#e9c46a" />
              <StatBar label="Red (0–3.9)" count={dist.red} total={total} color="#e63946" />

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f4faf5",
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: subtleColor, marginBottom: 2 }}>
                    Total products
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {total}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: subtleColor, marginBottom: 2 }}>
                    Avg GreenGrade
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {stats?.avgScore ?? "—"} / 10
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: subtleColor, marginBottom: 2 }}>
                    Categories
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {stats?.categories?.length ?? "—"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: subtleColor, fontSize: "0.88rem" }}>
              Score distribution data unavailable.
            </p>
          )}
        </Card>

        {/* Category breakdown */}
        {stats?.categories && (
          <Card isDark={isDark}>
            <SectionTitle isDark={isDark}>Average Score by Category</SectionTitle>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr>
                    {["Category", "Products", "Avg Score", "Avg kg CO₂e/kg"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "8px 10px",
                          borderBottom: `2px solid ${isDark ? "#2d4a35" : "#e0ece4"}`,
                          color: isDark ? "#7a9a7e" : "#888",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.categories.map((cat, i) => {
                    const color =
                      cat.avgScore >= 7 ? "#27ae60" : cat.avgScore >= 4 ? "#e9c46a" : "#e63946";
                    return (
                      <tr
                        key={cat.category}
                        style={{
                          background:
                            i % 2 === 0
                              ? isDark
                                ? "rgba(255,255,255,0.02)"
                                : "rgba(27,67,50,0.02)"
                              : "transparent",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 10px",
                            color: isDark ? "#e8f5e9" : "#1a3a2a",
                            fontWeight: 500,
                          }}
                        >
                          {cat.category}
                        </td>
                        <td style={{ padding: "10px 10px", color: textColor }}>
                          {cat.productCount}
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ color, fontWeight: 700 }}>{cat.avgScore}</span>
                        </td>
                        <td style={{ padding: "10px 10px", color: textColor }}>
                          {cat.avgEmissions}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Advisory board */}
        <Card isDark={isDark}>
          <SectionTitle isDark={isDark}>Independent Grading Advisory Board</SectionTitle>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 20 }}>
            The Advisory Board audits our scoring methodology annually and must sign off on any
            changes to GreenGrade parameters before deployment. Board members are required to
            declare conflicts of interest and may not be current paying Consciobite clients.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ADVISORY_BOARD.map((member) => (
              <div
                key={member.seat}
                style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: isDark ? "#1c2e22" : "#f4faf5",
                  border: `1px solid ${isDark ? "#2d4a35" : "#dceee2"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: "1.3rem" }}>{member.icon}</span>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                      }}
                    >
                      {member.seat} Seat
                    </div>
                    <div style={{ fontSize: "0.8rem", color: subtleColor }}>{member.role}</div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "2px 10px",
                      borderRadius: 12,
                      background: "rgba(233,196,106,0.15)",
                      color: "#b8860b",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {member.status}
                  </span>
                </div>
                <p style={{ fontSize: "0.83rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {member.purpose}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              marginTop: 16,
              fontSize: "0.8rem",
              color: subtleColor,
              lineHeight: 1.6,
              fontStyle: "italic",
            }}
          >
            Board recruitment is ongoing. Names and affiliations will be published here once
            appointments are confirmed. All board members will be required to submit a
            conflict-of-interest declaration.
          </p>
        </Card>

        {/* Algorithm version & changelog */}
        <Card isDark={isDark}>
          <SectionTitle isDark={isDark}>Algorithm Changelog</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                version: "v3",
                date: "2026-04",
                summary:
                  "Added Mahalanobis anomaly detection, variance-based feature importance, and category-aware blended scoring (60% category / 40% global KDE CDF). Confidence signal based on category sample size.",
                status: "current",
              },
              {
                version: "v2",
                date: "2025-11",
                summary:
                  "Replaced raw percentile lookup with Gaussian KDE using Silverman bandwidth. Added non-linear sigmoid transform for better resolution in the mid-score range.",
                status: "retired",
              },
              {
                version: "v1",
                date: "2025-06",
                summary:
                  "Initial scoring model. Simple percentile ranking across 7 emission dimensions with linear aggregation.",
                status: "retired",
              },
            ].map((entry) => (
              <div
                key={entry.version}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                  opacity: entry.status === "retired" ? 0.7 : 1,
                }}
              >
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: entry.status === "current" ? "#52b788" : subtleColor,
                    }}
                  >
                    {entry.version}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: subtleColor }}>{entry.date}</div>
                  {entry.status === "current" && (
                    <span
                      style={{
                        padding: "1px 7px",
                        borderRadius: 8,
                        background: "rgba(82,183,136,0.15)",
                        color: "#52b788",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      CURRENT
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.83rem", color: textColor, lineHeight: 1.6, margin: 0 }}>
                  {entry.summary}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact / feedback */}
        <div
          style={{
            textAlign: "center",
            padding: "20px 0 4px",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: subtleColor, lineHeight: 1.6 }}>
            Questions about our methodology or governance?{" "}
            <Link
              href="/methodology"
              style={{ color: "#52b788", textDecoration: "none", fontWeight: 600 }}
            >
              Read the full methodology
            </Link>{" "}
            or{" "}
            <Link
              href="/about"
              style={{ color: "#52b788", textDecoration: "none", fontWeight: 600 }}
            >
              contact the team
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
