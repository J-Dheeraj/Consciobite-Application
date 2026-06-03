"use client";
import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchMethodology } from "@/services/api";
import { fetchChangelog } from "@/services/admin";
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

const TierBadge = ({ tier, isDark }) => {
  const configs = {
    1: { color: "#27ae60", bg: "rgba(39,174,96,0.12)", label: "Tier 1" },
    2: { color: "#f39c12", bg: "rgba(243,156,18,0.12)", label: "Tier 2" },
    3: { color: "#e74c3c", bg: "rgba(231,57,60,0.12)", label: "Tier 3" },
  };
  const cfg = configs[tier.tier] || configs[3];
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: isDark ? "#1c2e22" : cfg.bg,
        border: `1px solid ${cfg.color}30`,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            padding: "2px 10px",
            borderRadius: 12,
            background: cfg.color,
            color: "#fff",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          {cfg.label}
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: "0.9rem",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
          }}
        >
          {tier.label}
        </span>
        <span style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
          (score: {tier.tierScore})
        </span>
      </div>
      <p style={{ fontSize: "0.85rem", color: isDark ? "#b0c4b1" : "#555", lineHeight: 1.6 }}>
        {tier.description}
      </p>
    </div>
  );
};

export default function Methodology() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["methodology"],
    queryFn: fetchMethodology,
  });

  const { data: changelog } = useQuery({
    queryKey: ["changelog"],
    queryFn: fetchChangelog,
  });

  if (isLoading) {
    return <Spinner message="Loading methodology..." />;
  }

  if (error || !data) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        Unable to load methodology data.
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
            Methodology
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 550,
              margin: "0 auto",
            }}
          >
            How we score products, where our data comes from, and what our confidence levels mean.
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
            GreenGrade v{data.version}
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
        {/* Algorithm overview */}
        <SectionCard title="Scoring Algorithm" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 14 }}>
            {data.algorithm.description}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#edf7f0",
              }}
            >
              <div
                style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 2 }}
              >
                Method
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              >
                {data.algorithm.scoring.method}
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#edf7f0",
              }}
            >
              <div
                style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 2 }}
              >
                Scale
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: isDark ? "#e8f5e9" : "#1a3a2a",
                }}
              >
                {data.algorithm.scoring.scale}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(data.algorithm.scoring.colors).map(([color, range]) => {
              const colorMap = { green: "#27ae60", yellow: "#f39c12", red: "#e74c3c" };
              return (
                <div
                  key={color}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: `${colorMap[color]}20`,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: colorMap[color],
                      fontSize: "0.85rem",
                      textTransform: "capitalize",
                    }}
                  >
                    {color}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: textColor }}>{range}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* 7 Emission dimensions */}
        <SectionCard title="7 Emission Dimensions" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 14 }}>
            Each product is evaluated across seven lifecycle stages, measured in kg CO{"\u2082"}e
            per kg of product.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.algorithm.dimensions.map((dim) => (
              <div
                key={dim.key}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    marginBottom: 4,
                    color: isDark ? "#e8f5e9" : "#1a3a2a",
                  }}
                >
                  {dim.label}
                </div>
                <div style={{ fontSize: "0.82rem", color: textColor, lineHeight: 1.5 }}>
                  {dim.description}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Data confidence */}
        <SectionCard title="Data Confidence Scoring" isDark={isDark}>
          <p style={{ color: textColor, fontSize: "0.9rem", lineHeight: 1.7, marginBottom: 14 }}>
            {data.confidenceScoring.description}
          </p>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 14,
              overflowX: "auto",
            }}
          >
            {data.confidenceScoring.formula}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 8,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Data Tiers
            </div>
            {data.confidenceScoring.tiers.map((tier) => (
              <TierBadge key={tier.tier} tier={tier} isDark={isDark} />
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
              Confidence Levels
            </div>
            {data.confidenceScoring.interpretation.map((level) => {
              const colorMap = {
                "High confidence": "#27ae60",
                "Moderate confidence": "#f39c12",
                "Low confidence": "#e74c3c",
              };
              return (
                <div
                  key={level.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: colorMap[level.label] || "#888",
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                      }}
                    >
                      {level.label}{" "}
                      <span style={{ fontWeight: 400, color: textColor }}>({level.range})</span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: textColor }}>{level.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Data sources */}
        <SectionCard title="Data Sources" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.dataSources.map((source) => (
              <div
                key={source.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: isDark ? "#1c2e22" : "#f8faf8",
                  border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: isDark ? "#e8f5e9" : "#1a3a2a",
                    }}
                  >
                    {source.name}
                  </span>
                  <span
                    style={{
                      padding: "1px 8px",
                      borderRadius: 10,
                      background: isDark ? "#2d4a35" : "#e8f0e8",
                      fontSize: "0.7rem",
                      color: textColor,
                    }}
                  >
                    {source.year}
                  </span>
                  <span
                    style={{
                      padding: "1px 8px",
                      borderRadius: 10,
                      background:
                        source.reliability === "high"
                          ? "rgba(39,174,96,0.15)"
                          : source.reliability === "medium"
                            ? "rgba(243,156,18,0.15)"
                            : "rgba(231,57,60,0.15)",
                      fontSize: "0.7rem",
                      color:
                        source.reliability === "high"
                          ? "#27ae60"
                          : source.reliability === "medium"
                            ? "#f39c12"
                            : "#e74c3c",
                    }}
                  >
                    {source.reliability}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: textColor,
                    lineHeight: 1.5,
                    marginBottom: 6,
                  }}
                >
                  {source.methodology}
                </p>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  {source.citation}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Limitations */}
        <SectionCard title="Known Limitations" isDark={isDark}>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {data.limitations.map((lim, i) => (
              <li
                key={i}
                style={{
                  fontSize: "0.88rem",
                  color: textColor,
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                {lim}
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* References */}
        <SectionCard title="Academic References" isDark={isDark}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.references.map((ref, i) => (
              <div key={i}>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: textColor,
                    lineHeight: 1.6,
                    marginBottom: 4,
                  }}
                >
                  {ref.citation}
                </p>
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.8rem", color: "#52b788" }}
                  >
                    {ref.url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Version History */}
        {changelog && changelog.length > 0 && (
          <SectionCard title="Algorithm Version History" isDark={isDark}>
            <p
              style={{
                fontSize: "0.85rem",
                color: textColor,
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              Every change to the GreenGrade scoring algorithm is logged here. The full audit trail
              of individual product score changes is available on the{" "}
              <Link href="/transparency" style={{ color: "#52b788", fontWeight: 600 }}>
                Transparency page
              </Link>
              .
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {changelog.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: isDark ? "#1c2e22" : "#f6fdf7",
                    border: `1px solid ${isDark ? "#2d4a35" : "#d1fae5"}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 12,
                        background: isDark ? "#0d2818" : "#2d6a4f",
                        color: "#fff",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                      }}
                    >
                      {entry.version}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: isDark ? "#6b8a6e" : "#999",
                      }}
                    >
                      {new Date(entry.changed_at).toLocaleDateString("en-GB", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: textColor,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {entry.description}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Governance link */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: isDark ? "#0d2818" : "#ecfdf5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              fontSize: "0.85rem",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              margin: 0,
            }}
          >
            This methodology is audited by the GreenGrade Independent Advisory Panel.
          </p>
          <Link
            href="/transparency"
            style={{
              fontSize: "0.85rem",
              fontWeight: 600,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            View governance details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
