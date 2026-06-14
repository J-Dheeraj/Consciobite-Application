"use client";
import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { fetchPassport } from "@/services/api";
import Spinner from "@/components/Spinner";

const DIMENSION_LABELS = {
  land_use_change: "Land Use Change",
  animal_feed: "Animal Feed",
  farm_operations: "Farm Operations",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

function gradeColor(score) {
  if (score >= 7) return "#27ae60";
  if (score >= 4) return "#f39c12";
  return "#e74c3c";
}

function gradeLabel(score) {
  if (score >= 8) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Moderate";
  if (score >= 3) return "Poor";
  return "Very Poor";
}

function confidenceConfig(tier) {
  if (tier === 1)
    return { label: "Verified LCA Data", color: "#27ae60", bg: "rgba(39,174,96,0.12)" };
  if (tier === 2)
    return { label: "Aggregated Database", color: "#f39c12", bg: "rgba(243,156,18,0.12)" };
  return { label: "Estimated", color: "#e74c3c", bg: "rgba(231,57,60,0.12)" };
}

function EmissionBar({ label, value, max, isDark }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct > 60 ? "#e74c3c" : pct > 30 ? "#f39c12" : "#27ae60";

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5,
          fontSize: 13,
        }}
      >
        <span style={{ color: isDark ? "#c8d6c8" : "#444", fontWeight: 500 }}>{label}</span>
        <span style={{ color: isDark ? "#e8f5e9" : "#1a3a2a", fontWeight: 700 }}>
          {value.toFixed(3)} kg CO₂e
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
            borderRadius: 4,
            background: color,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function Section({ title, children, isDark }) {
  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: "20px 24px",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          color: isDark ? "#e8f5e9" : "#1a3a2a",
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: `1px solid ${isDark ? "#2d4a35" : "#f0f4f0"}`,
        }}
      >
        {title}
      </h3>
      {children}
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
    enabled: !!id,
  });

  if (isLoading) return <Spinner message="Loading passport..." />;

  if (error || !passport) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", padding: 24, textAlign: "center" }}>
        <div
          style={{
            padding: 24,
            background: isDark ? "#2a1519" : "#fef2f2",
            borderRadius: 14,
            color: "#e63946",
          }}
        >
          {error?.message || "Passport not found."}
        </div>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            marginTop: 16,
            color: "#2d6a4f",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  const scoreCol = gradeColor(passport.greengrade_score);
  const conf = confidenceConfig(passport.data_confidence_tier);
  const dimensions = passport.emission_breakdown;
  const maxEmission = Math.max(...Object.values(dimensions));
  const generatedDate = new Date(passport.passport_generated_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Header */}
      <div
        style={{
          background: "#0d2818",
          padding: "40px 24px 32px",
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
              "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 30%, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px, 28px 28px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Link
              href={`/product/${id}`}
              style={{
                color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              &larr; Product Detail
            </Link>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Digital Passport</span>
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "3px 12px",
              borderRadius: 20,
              background: "rgba(82,183,136,0.2)",
              color: "#52b788",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: 12,
              letterSpacing: "0.05em",
            }}
          >
            DIGITAL PRODUCT PASSPORT · GreenGrade v{passport.methodology_version}
          </div>

          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              marginBottom: 6,
              lineHeight: 1.2,
            }}
          >
            {passport.product_name}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            {passport.brand} &middot; {passport.category} &middot; ID: {passport.product_id}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* Score + Confidence Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* GreenGrade Score */}
          <div
            style={{
              background: isDark ? "#162419" : "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 12,
              }}
            >
              GreenGrade Score
            </div>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: `${scoreCol}18`,
                border: `3px solid ${scoreCol}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 32,
                  color: scoreCol,
                  lineHeight: 1,
                }}
              >
                {passport.greengrade_score}
              </span>
              <span style={{ fontSize: 11, color: isDark ? "#7a9a7e" : "#888" }}>/ 10</span>
            </div>
            <div style={{ fontWeight: 700, color: scoreCol, fontSize: 15, marginBottom: 4 }}>
              {gradeLabel(passport.greengrade_score)}
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#7a9a7e" : "#888" }}>
              Top {100 - passport.score_percentile}% of products
            </div>
          </div>

          {/* Carbon Footprint */}
          <div
            style={{
              background: isDark ? "#162419" : "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.15)" : "0 2px 8px rgba(27,67,50,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 12,
              }}
            >
              Carbon Footprint
            </div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 36,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {passport.total_carbon_footprint_kg_co2e.toFixed(2)}
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#7a9a7e" : "#888", marginBottom: 16 }}>
              kg CO₂e per kg of product
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 8,
                background: conf.bg,
                color: conf.color,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {conf.label}
            </div>
          </div>
        </div>

        {/* Emission Breakdown */}
        <Section title="Emission Breakdown (kg CO₂e per kg)" isDark={isDark}>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
            <EmissionBar
              key={key}
              label={label}
              value={dimensions[key] ?? 0}
              max={maxEmission}
              isDark={isDark}
            />
          ))}
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: `1px solid ${isDark ? "#2d4a35" : "#f0f4f0"}`,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 14,
            }}
          >
            <span style={{ color: isDark ? "#b0c4b1" : "#555", fontWeight: 600 }}>
              Total Carbon Footprint
            </span>
            <span style={{ color: isDark ? "#e8f5e9" : "#1a3a2a", fontWeight: 700 }}>
              {passport.total_carbon_footprint_kg_co2e.toFixed(3)} kg CO₂e
            </span>
          </div>
        </Section>

        {/* Passport Provenance */}
        <Section title="Passport Provenance" isDark={isDark}>
          {[
            ["Passport ID", `DPP-${passport.product_id.padStart(6, "0")}`],
            ["Product ID", passport.product_id],
            ["Methodology Version", `GreenGrade v${passport.methodology_version}`],
            ["Data Confidence", conf.label],
            ["Generated", generatedDate],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: isDark ? "#7a9a7e" : "#888" }}>{label}</span>
              <span style={{ color: isDark ? "#e8f5e9" : "#1a3a2a", fontWeight: 600 }}>
                {value}
              </span>
            </div>
          ))}
          <p
            style={{
              marginTop: 14,
              fontSize: 12,
              color: isDark ? "#4a6a4e" : "#aaa",
              lineHeight: 1.6,
            }}
          >
            This passport is generated automatically from the GreenGrade database and is accurate as
            of the date shown. Scores may change if the product&apos;s supply chain data is updated.{" "}
            <Link href="/methodology" style={{ color: "#2d6a4f" }}>
              View full methodology
            </Link>
            .
          </p>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: "#2d6a4f",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Print Passport
          </button>
          <Link
            href={`/product/${id}`}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#edf7f0",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Full Product Detail
          </Link>
          <Link
            href="/transparency"
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: isDark ? "#1c2e22" : "#f3f4f6",
              color: isDark ? "#b0c4b1" : "#555",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Governance & Transparency
          </Link>
        </div>
      </div>
    </div>
  );
}
