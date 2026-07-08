"use client";
import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { fetchProductPassport, scorePortfolio } from "@/services/api";
import PageHero from "@/components/PageHero";
import GradeBadge from "@/components/GradeBadge";

function gradeColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

const DIMENSION_LABELS = {
  land_use_change: "Land Use Change",
  animal_feed: "Animal Feed",
  farm_operations: "Farm Operations",
  processing: "Processing",
  transport: "Transport",
  packaging: "Packaging",
  retail: "Retail",
};

function EmissionBar({ label, value, max, isDark }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          marginBottom: 4,
          color: isDark ? "#b0c4b1" : "#444",
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value.toFixed(3)} kg CO₂e</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: isDark ? "#1c3028" : "#e8f0e8",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #2d6a4f, #52b788)",
            borderRadius: 4,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function PassportCard({ passport, isDark }) {
  const breakdown = passport.emission_breakdown;
  const maxVal = Math.max(...Object.values(breakdown));

  const tierColors = { 1: "#27ae60", 2: "#f39c12", 3: "#e74c3c" };
  const tierColor = tierColors[passport.data_confidence_tier] || "#888";

  return (
    <div
      style={{
        background: isDark ? "#14352a" : "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.1)",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              color: isDark ? "#7a9a7e" : "#888",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            Digital Product Passport · EU ESPR
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              margin: 0,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            {passport.product_name}
          </h2>
          <div style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 4 }}>
            {passport.brand} · {passport.category} · ID {passport.product_id}
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <GradeBadge score={passport.greengrade_score} color={gradeColor(passport.greengrade_score)} size="large" />
          <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888", marginTop: 4 }}>
            {passport.score_percentile}th percentile
          </div>
        </div>
      </div>

      {/* Carbon total */}
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 12,
          background: isDark ? "#1a3028" : "#f0f7f2",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 2 }}>
            Total Carbon Footprint
          </div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: isDark ? "#52b788" : "#2d6a4f",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {passport.total_carbon_footprint_kg_co2e.toFixed(2)}
            <span style={{ fontSize: "0.85rem", fontWeight: 400, marginLeft: 4 }}>
              kg CO₂e / kg product
            </span>
          </div>
        </div>
        {passport.data_confidence_label && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              background: `${tierColor}20`,
              color: tierColor,
              fontSize: "0.78rem",
              fontWeight: 700,
              border: `1px solid ${tierColor}40`,
            }}
          >
            {passport.data_confidence_label}
          </div>
        )}
      </div>

      {/* Emission breakdown */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: isDark ? "#95d5b2" : "#2d6a4f",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Emission Breakdown (7 Lifecycle Dimensions)
        </div>
        {Object.entries(breakdown).map(([key, val]) => (
          <EmissionBar
            key={key}
            label={DIMENSION_LABELS[key] || key}
            value={val}
            max={maxVal}
            isDark={isDark}
          />
        ))}
      </div>

      {/* Footer metadata */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.72rem",
          color: isDark ? "#7a9a7e" : "#aaa",
          paddingTop: 14,
          borderTop: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
        }}
      >
        <span>GreenGrade v{passport.methodology_version}</span>
        <span>Generated: {new Date(passport.passport_generated_at).toLocaleString()}</span>
      </div>
    </div>
  );
}

function PortfolioCard({ portfolio, isDark }) {
  const { portfolio_summary: s, category_benchmarks } = portfolio;
  return (
    <div
      style={{
        background: isDark ? "#14352a" : "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(27,67,50,0.1)",
        border: `1px solid ${isDark ? "#2d4a35" : "#e8f0e8"}`,
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1.1rem",
          marginBottom: 16,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        Portfolio Score
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Avg Score", value: s.average_score.toFixed(1), unit: "/ 10" },
          {
            label: "Best Product",
            value: s.highest.score.toFixed(1),
            unit: s.highest.name,
            small: true,
          },
          {
            label: "Lowest Product",
            value: s.lowest.score.toFixed(1),
            unit: s.lowest.name,
            small: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: isDark ? "#1a3028" : "#f0f7f2",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 4 }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                color: isDark ? "#52b788" : "#2d6a4f",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: stat.small ? "0.65rem" : "0.75rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginTop: 2,
              }}
            >
              {stat.unit}
            </div>
          </div>
        ))}
      </div>

      {/* Category benchmarks */}
      {category_benchmarks.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            By Category
          </div>
          {category_benchmarks.map((cat) => (
            <div
              key={cat.category}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 8,
                background: isDark ? "#1a3028" : "#f8faf8",
                marginBottom: 6,
                fontSize: "0.84rem",
              }}
            >
              <span style={{ color: isDark ? "#b0c4b1" : "#444" }}>
                {cat.category}
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: "0.72rem",
                    color: isDark ? "#7a9a7e" : "#888",
                  }}
                >
                  ({cat.count} product{cat.count !== 1 ? "s" : ""})
                </span>
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: isDark ? "#52b788" : "#2d6a4f",
                }}
              >
                {cat.avg_score.toFixed(1)} / 10
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PassportPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [tab, setTab] = useState("single");
  const [singleId, setSingleId] = useState("");
  const [portfolioIds, setPortfolioIds] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutedText = isDark ? "#7a9a7e" : "#888";
  const border = isDark ? "#2d4a35" : "#e8f0e8";

  async function handleSingleLookup(e) {
    e.preventDefault();
    const id = singleId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await fetchProductPassport(id);
      setResult({ type: "single", data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePortfolioScore(e) {
    e.preventDefault();
    const ids = portfolioIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await scorePortfolio(ids);
      setResult({ type: "portfolio", data });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1.5px solid ${border}`,
    background: isDark ? "#1a3028" : "#f8faf8",
    color: isDark ? "#e8f5e9" : "#1a3a2a",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const btnStyle = {
    padding: "10px 24px",
    borderRadius: 10,
    border: "none",
    background: loading ? (isDark ? "#2d4a35" : "#cde8d8") : "#2d6a4f",
    color: loading ? (isDark ? "#7a9a7e" : "#888") : "#fff",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  };

  const tabStyle = (active) => ({
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    background: active ? "#2d6a4f" : "transparent",
    color: active ? "#fff" : mutedText,
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <PageHero
        title="Digital Product Passport"
        subtitle="EU ESPR & SGX Scope 3 compliant carbon data for any product in our catalog."
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 48px" }}>
        {/* Tab switcher */}
        <div
          style={{
            display: "inline-flex",
            gap: 4,
            background: isDark ? "#1a3028" : "#f0f7f2",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <button style={tabStyle(tab === "single")} onClick={() => setTab("single")}>
            Single Product
          </button>
          <button style={tabStyle(tab === "portfolio")} onClick={() => setTab("portfolio")}>
            Portfolio Score
          </button>
        </div>

        {/* Single product form */}
        {tab === "single" && (
          <form onSubmit={handleSingleLookup} style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: mutedText,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Product ID (1–550)
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                style={inputStyle}
                type="text"
                value={singleId}
                onChange={(e) => setSingleId(e.target.value)}
                placeholder="e.g. 1"
                aria-label="Product ID"
              />
              <button style={btnStyle} type="submit" disabled={loading}>
                {loading ? "Loading…" : "Look up"}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: mutedText, marginTop: 8 }}>
              Returns a full EU ESPR-compliant passport with 7-dimension emission breakdown.
            </p>
          </form>
        )}

        {/* Portfolio form */}
        {tab === "portfolio" && (
          <form onSubmit={handlePortfolioScore} style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: mutedText,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Product IDs (comma or space separated, up to 100)
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
              value={portfolioIds}
              onChange={(e) => setPortfolioIds(e.target.value)}
              placeholder="e.g. 1, 2, 3, 10, 25"
              aria-label="Portfolio product IDs"
            />
            <div style={{ marginTop: 10 }}>
              <button style={btnStyle} type="submit" disabled={loading}>
                {loading ? "Scoring…" : "Score Portfolio"}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: mutedText, marginTop: 8 }}>
              Returns aggregate scores, highest/lowest products, and per-category benchmarks.
              Suitable for SGX Scope 3 reporting.
            </p>
          </form>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: isDark ? "#2d1a1a" : "#fff5f5",
              color: isDark ? "#e57373" : "#c0392b",
              border: `1px solid ${isDark ? "#4d2020" : "#f5c6c6"}`,
              fontSize: "0.88rem",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {result?.type === "single" && (
          <PassportCard passport={result.data} isDark={isDark} />
        )}
        {result?.type === "portfolio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PortfolioCard portfolio={result.data} isDark={isDark} />
            {result.data.products.map((p) => (
              <PassportCard key={p.product_id} passport={p} isDark={isDark} />
            ))}
          </div>
        )}

        {/* API reference hint */}
        {!result && !error && (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 14,
              background: isDark ? "#14352a" : "#f8faf8",
              border: `1px solid ${border}`,
              fontSize: "0.84rem",
              color: mutedText,
              lineHeight: 1.7,
            }}
          >
            <div style={{ fontWeight: 700, color: isDark ? "#95d5b2" : "#2d6a4f", marginBottom: 10 }}>
              B2B API Endpoints
            </div>
            <code style={{ display: "block", marginBottom: 4, fontSize: "0.8rem" }}>
              GET /api/v1/passport/:productId
            </code>
            <code style={{ display: "block", marginBottom: 4, fontSize: "0.8rem" }}>
              POST /api/v1/portfolio/score {"{"} product_ids: string[] {"}"}
            </code>
            <code style={{ display: "block", fontSize: "0.8rem" }}>
              GET /api/v1/audit/:productId
            </code>
            <div style={{ marginTop: 12, fontSize: "0.78rem" }}>
              Full specification at{" "}
              <a
                href="/api/docs"
                style={{ color: isDark ? "#52b788" : "#2d6a4f", textDecoration: "underline" }}
              >
                /api/docs
              </a>{" "}
              (development only). For EU ESPR and SGX Scope 3 reporting.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
