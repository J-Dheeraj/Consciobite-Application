"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";
import { pageContainer, card, primaryButton, inputField, errorAlert } from "@/utils/pageStyles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MAX_PRODUCTS = 20;

function scoreColor(score) {
  if (score >= 7) return "#2d6a4f";
  if (score >= 4) return "#e9c46a";
  return "#e63946";
}

function ScoreBadge({ score, isDark }) {
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontWeight: 700,
        fontSize: "0.82rem",
        background: isDark ? "#1a3327" : "#f0faf4",
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {score}
    </span>
  );
}

function StatTile({ label, value, subtext, color, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { padding: "18px 16px" }),
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          color: color || (isDark ? "#95d5b2" : "#2d6a4f"),
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}>
        {label}
      </div>
      {subtext && (
        <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888" }}>{subtext}</div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: isDark ? "#14352a" : "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        border: `1px solid ${isDark ? "#2d4a35" : "#eee"}`,
        fontSize: "0.82rem",
        color: isDark ? "#e8f5e9" : "inherit",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 8 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function PortfolioAnalyzer() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["portfolio-product-search", search],
    queryFn: () => fetchProducts({ search, limit: 30 }),
    enabled: search.length >= 2,
    placeholderData: (prev) => prev,
  });

  const mutation = useMutation({
    mutationFn: (ids) => fetchPortfolioScore(ids.map(String)),
    onSuccess: (data) => setResult(data),
  });

  const allProducts = productsData?.products || [];

  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);

  function toggleProduct(product) {
    setResult(null);
    if (selectedIds.has(product.id)) {
      setSelected((prev) => prev.filter((p) => p.id !== product.id));
    } else if (selected.length < MAX_PRODUCTS) {
      setSelected((prev) => [...prev, product]);
    }
  }

  function analyze() {
    if (selected.length < 1) return;
    mutation.mutate(selected.map((p) => p.id));
  }

  const summary = result?.portfolio_summary;
  const benchmarks = result?.category_benchmarks || [];
  const passports = result?.products || [];

  const benchmarkChartData = benchmarks.map((b) => ({
    name: b.category,
    avgScore: b.avg_score,
    fill: scoreColor(b.avg_score),
  }));

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🏭"
        title="Portfolio Analyzer"
        subtitle="Score your product portfolio and benchmark carbon footprint across SKUs."
      />

      <div style={{ ...pageContainer(820), paddingTop: 8 }}>
        {/* Product search + selection */}
        <div style={{ ...card(isDark, { padding: 24 }), marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                margin: 0,
              }}
            >
              Build Portfolio
            </h2>
            <span style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888" }}>
              {selected.length}/{MAX_PRODUCTS} products
            </span>
          </div>

          <input
            type="search"
            placeholder="Search products to add…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputField(isDark, { fullWidth: true }),
              background: isDark ? "#0f1f16" : "#fafafa",
              color: isDark ? "#e8f5e9" : "inherit",
              marginBottom: 12,
            }}
          />

          {loadingProducts && search.length >= 2 && (
            <div
              style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 8 }}
            >
              Searching…
            </div>
          )}

          {search.length >= 2 && allProducts.length > 0 && (
            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                border: `1px solid ${isDark ? "#2d4a35" : "#e8f5e9"}`,
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              {allProducts.map((p) => {
                const checked = selectedIds.has(p.id);
                const disabled = !checked && selected.length >= MAX_PRODUCTS;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    disabled={disabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      background: checked
                        ? isDark
                          ? "#1a3d2c"
                          : "#edf7f0"
                        : isDark
                          ? "#0f1f16"
                          : "#fff",
                      border: "none",
                      borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f0f0f0"}`,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                      transition: "background 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `2px solid ${checked ? "#2d6a4f" : isDark ? "#4a6a4e" : "#ccc"}`,
                        background: checked ? "#2d6a4f" : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="#fff"
                            strokeWidth="1.8"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span style={{ flex: 1 }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          color: isDark ? "#e8f5e9" : "#1a3a2a",
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: isDark ? "#7a9a7e" : "#888",
                          marginLeft: 6,
                        }}
                      >
                        {p.brand} · {p.category}
                      </span>
                    </span>
                    {p.greenGrade && <ScoreBadge score={p.greenGrade.score} isDark={isDark} />}
                  </button>
                );
              })}
            </div>
          )}

          {search.length >= 2 && allProducts.length === 0 && !loadingProducts && (
            <div
              style={{
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 12,
              }}
            >
              No products found for &ldquo;{search}&rdquo;.
            </div>
          )}

          {/* Selected chips */}
          {selected.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {selected.map((p) => (
                <span
                  key={p.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: isDark ? "#1a3d2c" : "#edf7f0",
                    border: `1px solid ${isDark ? "#2d6a4f" : "#b7e4c7"}`,
                    fontSize: "0.82rem",
                    color: isDark ? "#95d5b2" : "#2d6a4f",
                  }}
                >
                  {p.name}
                  <button
                    onClick={() => toggleProduct(p)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: isDark ? "#7a9a7e" : "#888",
                      fontSize: "0.9rem",
                      lineHeight: 1,
                      display: "flex",
                    }}
                    aria-label={`Remove ${p.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Analyze button */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={analyze}
            disabled={selected.length < 1 || mutation.isPending}
            style={{
              ...primaryButton({ loading: mutation.isPending }),
              width: "100%",
              fontSize: "1rem",
              padding: "14px 24px",
              opacity: selected.length < 1 ? 0.5 : 1,
            }}
          >
            {mutation.isPending
              ? "Analyzing…"
              : selected.length < 1
                ? "Add products to analyze"
                : `Analyze ${selected.length} Product${selected.length !== 1 ? "s" : ""}`}
          </button>
          {mutation.error && (
            <div style={{ ...errorAlert(isDark), marginTop: 10 }}>
              {mutation.error.message || "Analysis failed. Please try again."}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            {/* Summary tiles */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <StatTile
                label="Portfolio Score"
                value={summary.average_score}
                subtext="avg GreenGrade"
                color={scoreColor(summary.average_score)}
                isDark={isDark}
              />
              <StatTile label="SKUs Analyzed" value={summary.product_count} isDark={isDark} />
              <StatTile
                label="Best SKU"
                value={summary.highest.score}
                subtext={summary.highest.name}
                color="#2d6a4f"
                isDark={isDark}
              />
              <StatTile
                label="Needs Work"
                value={summary.lowest.score}
                subtext={summary.lowest.name}
                color={scoreColor(summary.lowest.score)}
                isDark={isDark}
              />
            </div>

            {/* Category benchmark chart */}
            {benchmarkChartData.length > 0 && (
              <div style={{ ...card(isDark, { padding: 24 }), marginBottom: 16 }}>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    marginBottom: 4,
                    color: isDark ? "#e8f5e9" : "inherit",
                  }}
                >
                  Category Benchmarks
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 16,
                  }}
                >
                  Average GreenGrade score per product category in your portfolio.
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={benchmarkChartData}
                    margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2d4a35" : "#f0f0f0"} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                    />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Bar dataKey="avgScore" name="Avg Score" radius={[6, 6, 0, 0]}>
                      {benchmarkChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* SKU table */}
            <div style={{ ...card(isDark, { padding: 24 }), marginBottom: 16 }}>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  marginBottom: 4,
                  color: isDark ? "#e8f5e9" : "inherit",
                }}
              >
                SKU Breakdown
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 16,
                }}
              >
                Individual GreenGrade scores and total carbon footprint.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: `2px solid ${isDark ? "#2d4a35" : "#edf7f0"}`,
                      }}
                    >
                      {["Product", "Brand", "Category", "Score", "kg CO₂e"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 8px",
                            textAlign: h === "Score" || h === "kg CO₂e" ? "right" : "left",
                            color: isDark ? "#95d5b2" : "#2d6a4f",
                            fontWeight: 700,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {passports
                      .slice()
                      .sort((a, b) => b.greengrade_score - a.greengrade_score)
                      .map((p) => (
                        <tr
                          key={p.product_id}
                          style={{
                            borderBottom: `1px solid ${isDark ? "#2d4a35" : "#f5f5f5"}`,
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 8px",
                              fontWeight: 500,
                              color: isDark ? "#e8f5e9" : "inherit",
                            }}
                          >
                            <Link
                              href={`/product/${p.product_id}`}
                              style={{
                                color: isDark ? "#95d5b2" : "#2d6a4f",
                                textDecoration: "none",
                              }}
                            >
                              {p.product_name}
                            </Link>
                          </td>
                          <td style={{ padding: "10px 8px", color: isDark ? "#b0c4b1" : "#666" }}>
                            {p.brand}
                          </td>
                          <td style={{ padding: "10px 8px", color: isDark ? "#b0c4b1" : "#666" }}>
                            {p.category}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right" }}>
                            <ScoreBadge score={p.greengrade_score} isDark={isDark} />
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: isDark ? "#b0c4b1" : "#666",
                            }}
                          >
                            {p.total_carbon_footprint_kg_co2e.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DPP links */}
            <div
              style={{
                ...card(isDark, { padding: 20 }),
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff",
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: 6,
                }}
              >
                Digital Product Passports
              </div>
              <p style={{ fontSize: "0.85rem", opacity: 0.9, marginBottom: 12 }}>
                View the full ESPR-ready Digital Product Passport for any SKU in this portfolio.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {passports.map((p) => (
                  <Link
                    key={p.product_id}
                    href={`/passport/${p.product_id}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: "rgba(255,255,255,0.2)",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    {p.product_name} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
