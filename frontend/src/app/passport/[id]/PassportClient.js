"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchPassport } from "@/services/api";
import Spinner from "@/components/Spinner";
import { scoreColor } from "@/utils/constants";

const EMISSION_LABELS = {
  land_use_change: "Land Use Change",
  animal_feed: "Animal Feed",
  farm_operations: "Farming",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

function ScoreRing({ score, size = 72 }) {
  const color = scoreColor(score);
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 10) * circ;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontWeight="700"
        fontSize={size * 0.27}
        fontFamily="'Outfit', sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function EmissionBar({ label, value, max, isDark }) {
  const pct = Math.min((value / max) * 100, 100);
  const barColor = pct < 30 ? "#27ae60" : pct < 60 ? "#f39c12" : "#e74c3c";

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontSize: "0.82rem",
        }}
      >
        <span style={{ color: isDark ? "#c8d6c8" : "#444" }}>{label}</span>
        <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
          {value.toFixed(3)} kg CO₂e
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: isDark ? "#1c2e22" : "#f0f0f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function ConfidenceBadge({ tier }) {
  const config = {
    1: { label: "Tier 1 — Verified LCA", color: "#27ae60", bg: "rgba(39,174,96,0.15)" },
    2: { label: "Tier 2 — Aggregated DB", color: "#f39c12", bg: "rgba(243,156,18,0.15)" },
    3: { label: "Tier 3 — Estimated", color: "#e74c3c", bg: "rgba(231,57,60,0.15)" },
  };
  const cfg = config[tier] || config[3];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 12,
        background: cfg.bg,
        color: cfg.color,
        fontSize: "0.75rem",
        fontWeight: 700,
      }}
    >
      {cfg.label}
    </span>
  );
}

function PassportCard({ passport, isDark }) {
  const maxEmission = Math.max(...Object.values(passport.emission_breakdown));
  const total = passport.total_carbon_footprint_kg_co2e;
  const generatedDate = new Date(passport.passport_generated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: isDark ? "#0d2818" : "#0d2818",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0a2010 0%, #1a5e3a 100%)",
          padding: "24px 24px 20px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: "radial-gradient(circle at 70% 30%, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            position: "relative",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#52b788",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Digital Product Passport
            </div>
            <h1
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.2rem",
                margin: "0 0 4px",
                lineHeight: 1.2,
              }}
            >
              {passport.product_name}
            </h1>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem" }}>
              {passport.brand} &middot; {passport.category}
            </div>
          </div>
          <ScoreRing score={passport.greengrade_score} size={72} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", background: isDark ? "#0f1e16" : "#0f1e16" }}>
        {/* Summary row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "GreenGrade Score", value: `${passport.greengrade_score} / 10` },
            {
              label: "Percentile",
              value:
                passport.score_percentile !== null && passport.score_percentile !== undefined
                  ? `Top ${Math.round((1 - passport.score_percentile) * 100)}%`
                  : "N/A",
            },
            { label: "Total CO₂e", value: `${total.toFixed(3)} kg/kg` },
            { label: "Methodology", value: `v${passport.methodology_version}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Data confidence */}
        {passport.data_confidence_tier && (
          <div style={{ marginBottom: 20 }}>
            <ConfidenceBadge tier={passport.data_confidence_tier} />
            {passport.data_confidence_label && (
              <span style={{ marginLeft: 8, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                {passport.data_confidence_label}
              </span>
            )}
          </div>
        )}

        {/* Emission breakdown */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#52b788",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 14,
            }}
          >
            7-Dimension Emission Breakdown
          </div>
          {Object.entries(passport.emission_breakdown).map(([key, val]) => (
            <EmissionBar
              key={key}
              label={EMISSION_LABELS[key] || key}
              value={val}
              max={maxEmission || 1}
              isDark={true}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
            Generated {generatedDate} &middot; consciobite.com
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}
          >
            GreenGrade™
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassportClient() {
  const { id } = useParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    data: passport,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["passport", id],
    queryFn: () => fetchPassport(id),
  });

  if (isLoading) return <Spinner message="Loading passport..." />;

  if (error || !passport) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <div
          style={{
            color: "#e74c3c",
            background: "rgba(231,57,60,0.1)",
            padding: 24,
            borderRadius: 14,
            display: "inline-block",
          }}
        >
          Unable to load passport for this product.
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/products" style={{ color: "#2d6a4f", fontWeight: 600 }}>
            &larr; Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: isDark ? "#0a150e" : "#0a150e",
        padding: "24px 16px 48px",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Back link */}
      <div style={{ maxWidth: 480, margin: "0 auto 20px" }}>
        <Link
          href={`/product/${id}`}
          style={{
            color: "#52b788",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          &larr; Back to product
        </Link>
      </div>

      <PassportCard passport={passport} isDark={isDark} />

      {/* Action row */}
      <div
        style={{
          maxWidth: 480,
          margin: "20px auto 0",
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href={`/product/${id}`}
          style={{
            padding: "11px 24px",
            borderRadius: 10,
            background: "#1a5e3a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.88rem",
            textDecoration: "none",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Full Product Details
        </Link>
        <Link
          href="/methodology"
          style={{
            padding: "11px 24px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            color: "#52b788",
            fontWeight: 600,
            fontSize: "0.88rem",
            textDecoration: "none",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Methodology &rarr;
        </Link>
      </div>
    </div>
  );
}
