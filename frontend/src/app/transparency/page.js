"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchTransparency } from "@/services/api";
import Spinner from "@/components/Spinner";

const SectionCard = ({ title, children, isDark, accent }) => (
  <div
    style={{
      background: isDark ? "#162419" : "#fff",
      borderRadius: 14,
      padding: 24,
      boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
      borderLeft: accent ? `4px solid ${accent}` : undefined,
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

function SeatCard({ seat, isDark }) {
  const isVacant = seat.status === "vacant";
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: isDark ? "#1c2e22" : "#f8faf8",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: isVacant ? (isDark ? "#2d3a2d" : "#eee") : "rgba(39,174,96,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          flexShrink: 0,
        }}
      >
        {isVacant ? "?" : "✓"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
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
              fontSize: "0.68rem",
              fontWeight: 600,
              background: isVacant ? "rgba(231,76,60,0.12)" : "rgba(39,174,96,0.12)",
              color: isVacant ? "#e74c3c" : "#27ae60",
            }}
          >
            {isVacant ? "Vacant" : "Filled"}
          </span>
        </div>
        <p style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#666", margin: 0 }}>
          {seat.description}
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, color, isDark }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: 10,
        background: isDark ? "#1c2e22" : "#f8faf8",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.8rem",
          color: color || (isDark ? "#95d5b2" : "#2d6a4f"),
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: isDark ? "#7a9a7e" : "#888",
          marginTop: 4,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#aaa", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function DeltaChip({ delta }) {
  const isPositive = delta > 0;
  const isZero = delta === 0;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 8,
        fontSize: "0.75rem",
        fontWeight: 700,
        background: isZero
          ? "rgba(136,136,136,0.12)"
          : isPositive
            ? "rgba(39,174,96,0.15)"
            : "rgba(231,76,60,0.15)",
        color: isZero ? "#888" : isPositive ? "#27ae60" : "#e74c3c",
      }}
    >
      {isZero ? "0" : isPositive ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
    </span>
  );
}

export default function Transparency() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["transparency"],
    queryFn: fetchTransparency,
    staleTime: 60 * 1000,
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

  const { algorithm, advisoryBoard, scoreIntegrity } = data;
  const { stats, biasFlag, biasMessage, recentChanges } = scoreIntegrity;

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
              maxWidth: 580,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Our commitment to independent scoring. We publish our conflict-of-interest data so you
            can verify that GreenGrade is not influenced by commercial relationships.
          </p>
          <div
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 20,
              background: biasFlag ? "rgba(231,76,60,0.2)" : "rgba(82,183,136,0.2)",
              color: biasFlag ? "#e74c3c" : "#52b788",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: biasFlag ? "#e74c3c" : "#52b788",
              }}
            />
            {biasFlag ? "Review recommended" : "Score integrity: OK"}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "24px 20px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Algorithm version */}
        <SectionCard title="Algorithm Version" isDark={isDark}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "4px 14px",
                borderRadius: 20,
                background: "rgba(82,183,136,0.15)",
                color: "#52b788",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              GreenGrade v{algorithm.version}
            </span>
            <p style={{ fontSize: "0.88rem", color: textColor, margin: 0, lineHeight: 1.6 }}>
              {algorithm.description}
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            <Link
              href="/methodology"
              style={{
                fontSize: "0.85rem",
                color: "#52b788",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Read full methodology →
            </Link>
          </div>
        </SectionCard>

        {/* Advisory Board */}
        <SectionCard title="Independent Grading Advisory Board" isDark={isDark}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "rgba(82,183,136,0.08)",
              border: `1px solid ${isDark ? "#2d4a35" : "rgba(82,183,136,0.2)"}`,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: "0.85rem", color: textColor, margin: 0, lineHeight: 1.6 }}>
              The advisory board oversees scoring methodology and reviews any parameter changes.
              Board formation is in progress.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {advisoryBoard.seats.map((seat) => (
              <SeatCard key={seat.role} seat={seat} isDark={isDark} />
            ))}
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 8,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Board mandate
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {advisoryBoard.mandate.map((item, i) => (
                <li key={i} style={{ fontSize: "0.85rem", color: textColor, lineHeight: 1.7 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Conflict-of-interest stats */}
        <SectionCard
          title="Conflict-of-Interest Audit"
          isDark={isDark}
          accent={biasFlag ? "#e74c3c" : "#27ae60"}
        >
          <p style={{ fontSize: "0.88rem", color: textColor, marginBottom: 16, lineHeight: 1.6 }}>
            Every GreenGrade score change is logged with whether the affected product belongs to a
            paying client. The table below shows score delta statistics for the past 12 months.
          </p>

          {stats.totalChanges === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f8faf8",
                color: isDark ? "#7a9a7e" : "#888",
                fontSize: "0.88rem",
              }}
            >
              No score changes recorded in the last 12 months.
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <StatBox label="Total Changes" value={stats.totalChanges} isDark={isDark} />
                <StatBox
                  label="Paying Clients"
                  value={stats.paying.count}
                  sub={`avg delta: ${stats.paying.avgDelta >= 0 ? "+" : ""}${stats.paying.avgDelta}`}
                  isDark={isDark}
                />
                <StatBox
                  label="Non-Paying"
                  value={stats.nonPaying.count}
                  sub={`avg delta: ${stats.nonPaying.avgDelta >= 0 ? "+" : ""}${stats.nonPaying.avgDelta}`}
                  isDark={isDark}
                />
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: biasFlag
                    ? isDark
                      ? "rgba(231,76,60,0.1)"
                      : "rgba(231,76,60,0.06)"
                    : isDark
                      ? "rgba(39,174,96,0.1)"
                      : "rgba(39,174,96,0.06)",
                  border: `1px solid ${biasFlag ? "rgba(231,76,60,0.25)" : "rgba(39,174,96,0.2)"}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: "1.1rem", marginTop: 1 }}>{biasFlag ? "⚠️" : "✅"}</span>
                <p style={{ fontSize: "0.85rem", color: textColor, margin: 0, lineHeight: 1.5 }}>
                  {biasMessage}
                </p>
              </div>
            </>
          )}
        </SectionCard>

        {/* Recent score changes */}
        {recentChanges.length > 0 && (
          <SectionCard title="Recent Score Changes" isDark={isDark}>
            <p style={{ fontSize: "0.85rem", color: textColor, marginBottom: 14, lineHeight: 1.5 }}>
              The 10 most recent algorithm-driven score changes, shown with paying-client status.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                    }}
                  >
                    {["Product", "Before", "After", "Delta", "Client", "Date"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "6px 10px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: isDark ? "#7a9a7e" : "#888",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentChanges.map((change, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f0f4f0"}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          color: isDark ? "#e8f5e9" : "#1a3a2a",
                          fontWeight: 500,
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {change.productName}
                      </td>
                      <td style={{ padding: "8px 10px", color: textColor }}>
                        {change.oldScore.toFixed(1)}
                      </td>
                      <td style={{ padding: "8px 10px", color: textColor }}>
                        {change.newScore.toFixed(1)}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <DeltaChip delta={change.delta} />
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span
                          style={{
                            padding: "1px 8px",
                            borderRadius: 8,
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            background: change.isPayingClient
                              ? "rgba(243,156,18,0.12)"
                              : "rgba(136,136,136,0.1)",
                            color: change.isPayingClient ? "#f39c12" : "#888",
                          }}
                        >
                          {change.isPayingClient ? "Paying" : "Non-paying"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          color: isDark ? "#7a9a7e" : "#aaa",
                          whiteSpace: "nowrap",
                          fontSize: "0.78rem",
                        }}
                      >
                        {change.changedAt ? change.changedAt.slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Footer nav */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            padding: "8px 0",
          }}
        >
          <Link
            href="/methodology"
            style={{
              fontSize: "0.88rem",
              color: "#52b788",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Scoring Methodology
          </Link>
          <Link
            href="/about"
            style={{
              fontSize: "0.88rem",
              color: isDark ? "#7a9a7e" : "#888",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            About Consciobite
          </Link>
        </div>
      </div>
    </div>
  );
}
