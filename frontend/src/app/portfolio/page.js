"use client";
import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { CATEGORY_ICONS, scoreColor } from "@/utils/constants";
import PageHero from "@/components/PageHero";
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

const MAX_PORTFOLIO = 100;

function tierLabel(score) {
  if (score >= 7) return "Green";
  if (score >= 4) return "Amber";
  return "Red";
}

function tierBg(score, isDark) {
  if (score >= 7) return isDark ? "#1c3a2a" : "#edf7f0";
  if (score >= 4) return isDark ? "#3a3420" : "#fff8e1";
  return isDark ? "#3a1a1a" : "#fef2f2";
}

function tierFg(score, isDark) {
  if (score >= 7) return isDark ? "#95d5b2" : "#2d6a4f";
  if (score >= 4) return isDark ? "#e9c46a" : "#b45309";
  return isDark ? "#f08080" : "#e63946";
}

const card = (isDark) => ({
  background: isDark ? "#14352a" : "#fff",
  borderRadius: 14,
  padding: 20,
  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.22)" : "0 2px 8px rgba(27,67,50,0.07)",
});

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: isDark ? "#14352a" : "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
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

export default function PortfolioScore() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [portfolio, setPortfolio] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  const doSearch = useCallback((query) => {
    setSearchLoading(true);
    fetchProducts({ search: query, limit: 8 })
      .then((data) => {
        setSearchResults(data.products || []);
        setShowDropdown(true);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(val), 250);
  };

  const addProduct = (product) => {
    if (portfolio.length >= MAX_PORTFOLIO) return;
    if (portfolio.some((p) => p.id === product.id)) return;
    setPortfolio((prev) => [
      ...prev,
      {
        id: String(product.id),
        name: product.name,
        brand: product.brand,
        category: product.category,
        score: product.greenGrade?.score ?? null,
      },
    ]);
    setSearch("");
    setSearchResults([]);
    setShowDropdown(false);
    setPortfolioData(null);
    setError("");
  };

  const removeProduct = (id) => {
    setPortfolio((prev) => prev.filter((p) => p.id !== id));
    setPortfolioData(null);
  };

  const clearAll = () => {
    setPortfolio([]);
    setPortfolioData(null);
    setError("");
  };

  const scorePortfolio = async () => {
    if (portfolio.length === 0) return;
    setScoring(true);
    setError("");
    setPortfolioData(null);
    try {
      const data = await fetchPortfolioScore(portfolio.map((p) => p.id));
      setPortfolioData(data);
    } catch (err) {
      setError(err.message || "Failed to score portfolio. Please try again.");
    } finally {
      setScoring(false);
    }
  };

  const hasResults = showDropdown && searchResults.length > 0;
  const summary = portfolioData?.portfolio_summary;
  const benchmarks = portfolioData?.category_benchmarks || [];
  const scoredProducts = portfolioData?.products || [];

  const benchmarkChartData = benchmarks.map((b) => ({
    name: b.category,
    score: b.avg_score,
    emissions: b.avg_emissions,
    fill: b.avg_score >= 7 ? "#2d6a4f" : b.avg_score >= 4 ? "#e9c46a" : "#e63946",
  }));

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"📦"}
        title="Portfolio Score"
        subtitle="Add up to 100 products and get an instant sustainability score for your full portfolio."
      />

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Search + Portfolio builder */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginTop: -20,
            marginBottom: 16,
          }}
        >
          {/* Search box */}
          <div style={{ ...card(isDark), animation: "fadeInUp 0.4s ease" }}>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                marginBottom: 4,
                color: isDark ? "#e8f5e9" : "#1b4332",
              }}
            >
              Add Products
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 14,
              }}
            >
              Search by product name or brand. {MAX_PORTFOLIO - portfolio.length} slots remaining.
            </p>

            <div ref={searchRef} style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                aria-label="Search products to add to portfolio"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: hasResults ? "10px 10px 0 0" : 10,
                  border: "1.5px solid " + (isDark ? "#2d4a35" : "#d1e9d9"),
                  fontSize: "0.9rem",
                  background: isDark ? "#1a3327" : "#f5fbf7",
                  color: isDark ? "#e8f5e9" : "#333",
                  outline: "none",
                  fontFamily: "'Outfit', sans-serif",
                  boxSizing: "border-box",
                  transition: "border-radius 0.1s",
                }}
              />
              {searchLoading && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "0.75rem",
                    color: isDark ? "#7a9a7e" : "#aaa",
                  }}
                >
                  Searching…
                </span>
              )}

              {hasResults && (
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    background: isDark ? "#14352a" : "#fff",
                    border: "1.5px solid " + (isDark ? "#2d4a35" : "#d1e9d9"),
                    borderTop: "none",
                    borderRadius: "0 0 10px 10px",
                    zIndex: 20,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  }}
                >
                  {searchResults.map((p) => {
                    const already = portfolio.some((pp) => pp.id === String(p.id));
                    return (
                      <button
                        key={p.id}
                        onClick={() => !already && addProduct(p)}
                        disabled={already || portfolio.length >= MAX_PORTFOLIO}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          background: "transparent",
                          cursor: already ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          opacity: already ? 0.45 : 1,
                          fontFamily: "'Outfit', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          if (!already)
                            e.currentTarget.style.background = isDark ? "#1a3327" : "#f5fbf7";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            textAlign: "left",
                            flex: 1,
                            color: isDark ? "#e8f5e9" : "#333",
                          }}
                        >
                          {p.brand} {p.name}
                          {already && (
                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: "0.72rem",
                                color: isDark ? "#7a9a7e" : "#aaa",
                              }}
                            >
                              (added)
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            minWidth: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: scoreColor(p.greenGrade?.score ?? 0),
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {p.greenGrade?.score ?? "?"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {portfolio.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button
                  onClick={scorePortfolio}
                  disabled={scoring}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    background: scoring
                      ? isDark
                        ? "#2d4a35"
                        : "#b7e4c7"
                      : "linear-gradient(135deg, #2d6a4f, #40916c)",
                    color: scoring ? (isDark ? "#7a9a7e" : "#555") : "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: scoring ? "not-allowed" : "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {scoring
                    ? "Scoring…"
                    : `Score ${portfolio.length} Product${portfolio.length !== 1 ? "s" : ""}`}
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    padding: "11px 14px",
                    background: "none",
                    border: "1.5px solid " + (isDark ? "#2d4a35" : "#d1e9d9"),
                    borderRadius: 10,
                    color: isDark ? "#7a9a7e" : "#888",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Portfolio list */}
          <div style={{ ...card(isDark), animation: "fadeInUp 0.4s ease 0.05s both" }}>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                marginBottom: 4,
                color: isDark ? "#e8f5e9" : "#1b4332",
              }}
            >
              Your Portfolio
            </h3>
            <p
              style={{
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                marginBottom: 12,
              }}
            >
              {portfolio.length === 0
                ? "No products added yet. Search above to get started."
                : `${portfolio.length} / ${MAX_PORTFOLIO} products`}
            </p>

            <div
              style={{
                maxHeight: 280,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {portfolio.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "8px 10px",
                    background: isDark ? "#1a3327" : "#f5fbf7",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.83rem",
                        fontWeight: 600,
                        color: isDark ? "#e8f5e9" : "#1b4332",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888" }}>
                      {p.brand} · {CATEGORY_ICONS[p.category] || ""} {p.category}
                    </div>
                  </div>
                  {p.score !== null && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: tierBg(p.score, isDark),
                        color: tierFg(p.score, isDark),
                        flexShrink: 0,
                      }}
                    >
                      {p.score}
                    </span>
                  )}
                  <button
                    onClick={() => removeProduct(p.id)}
                    aria-label={`Remove ${p.name}`}
                    style={{
                      background: "none",
                      border: "none",
                      color: isDark ? "#7a9a7e" : "#bbb",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      padding: "2px 4px",
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {portfolio.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0 20px",
                  color: isDark ? "#7a9a7e" : "#bbb",
                  fontSize: "2rem",
                }}
              >
                📭
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            style={{
              padding: 14,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 10,
              color: "#e63946",
              marginBottom: 16,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Results */}
        {portfolioData && summary && (
          <div style={{ animation: "fadeInUp 0.4s ease" }}>
            {/* Summary header */}
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.15rem",
                marginBottom: 12,
                color: isDark ? "#e8f5e9" : "#1b4332",
              }}
            >
              Portfolio Results
            </h2>

            {/* Summary stat cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                {
                  icon: "⭐",
                  label: "Portfolio Score",
                  value: summary.average_score,
                  sub: "out of 10",
                  color: tierFg(summary.average_score, isDark),
                },
                {
                  icon: "📦",
                  label: "Products Scored",
                  value: summary.product_count,
                  sub: "in portfolio",
                },
                {
                  icon: "🏆",
                  label: "Highest Rated",
                  value: summary.highest.score,
                  sub: summary.highest.name,
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                },
                {
                  icon: "⚠️",
                  label: "Lowest Rated",
                  value: summary.lowest.score,
                  sub: summary.lowest.name,
                  color: isDark ? "#f08080" : "#e63946",
                },
              ].map(({ icon, label, value, sub, color }) => (
                <div
                  key={label}
                  style={{
                    ...card(isDark),
                    textAlign: "center",
                    padding: "16px 12px",
                  }}
                >
                  <div style={{ fontSize: "1.3rem", marginBottom: 4 }}>{icon}</div>
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
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: isDark ? "#b0c4b1" : "#555",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                    {sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Tier pill */}
            <div
              style={{
                ...card(isDark),
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  padding: "6px 18px",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  background: tierBg(summary.average_score, isDark),
                  color: tierFg(summary.average_score, isDark),
                }}
              >
                {tierLabel(summary.average_score)} Portfolio
              </span>
              <p style={{ margin: 0, fontSize: "0.85rem", color: isDark ? "#b0c4b1" : "#666" }}>
                {summary.average_score >= 7
                  ? "Excellent — your portfolio is in the top sustainability tier."
                  : summary.average_score >= 4
                    ? "Good — some products have room for improvement."
                    : "Needs attention — several products have high emissions impact."}
              </p>
            </div>

            {/* Category Benchmarks Chart */}
            {benchmarkChartData.length > 0 && (
              <div style={{ ...card(isDark), marginBottom: 16 }}>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    marginBottom: 4,
                    color: isDark ? "#e8f5e9" : "#1b4332",
                  }}
                >
                  Score by Category
                </h3>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 16,
                  }}
                >
                  Average GreenGrade across your portfolio&apos;s product categories.
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={benchmarkChartData}
                    margin={{ top: 4, right: 10, left: -10, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2d4a35" : "#f0f0f0"} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                      angle={-25}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                    />
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                    <Bar dataKey="score" name="Avg Score" radius={[6, 6, 0, 0]}>
                      {benchmarkChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Product list */}
            <div style={{ ...card(isDark) }}>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  marginBottom: 4,
                  color: isDark ? "#e8f5e9" : "#1b4332",
                }}
              >
                Individual Passports
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 12,
                }}
              >
                Click any product to view its full Digital Product Passport.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.84rem",
                    minWidth: 480,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#edf7f0"),
                      }}
                    >
                      {["Product", "Category", "Score", "Emissions", "Tier"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 10px",
                            fontWeight: 700,
                            color: isDark ? "#95d5b2" : "#2d6a4f",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scoredProducts
                      .slice()
                      .sort((a, b) => b.greengrade_score - a.greengrade_score)
                      .map((p) => (
                        <tr
                          key={p.product_id}
                          style={{
                            borderBottom: "1px solid " + (isDark ? "#2d4a35" : "#f5f5f5"),
                          }}
                        >
                          <td style={{ padding: "9px 10px" }}>
                            <Link
                              href={`/passport/${p.product_id}`}
                              style={{
                                fontWeight: 600,
                                color: isDark ? "#95d5b2" : "#2d6a4f",
                                textDecoration: "none",
                                fontSize: "0.84rem",
                              }}
                            >
                              {p.product_name}
                            </Link>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: isDark ? "#7a9a7e" : "#aaa",
                              }}
                            >
                              {p.brand}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "9px 10px",
                              color: isDark ? "#b0c4b1" : "#555",
                            }}
                          >
                            {CATEGORY_ICONS[p.category] || ""} {p.category}
                          </td>
                          <td style={{ padding: "9px 10px", fontWeight: 700 }}>
                            <span style={{ color: tierFg(p.greengrade_score, isDark) }}>
                              {p.greengrade_score}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "9px 10px",
                              color: isDark ? "#b0c4b1" : "#555",
                            }}
                          >
                            {p.total_carbon_footprint_kg_co2e} kg
                          </td>
                          <td style={{ padding: "9px 10px" }}>
                            <span
                              style={{
                                padding: "2px 10px",
                                borderRadius: 12,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: tierBg(p.greengrade_score, isDark),
                                color: tierFg(p.greengrade_score, isDark),
                              }}
                            >
                              {tierLabel(p.greengrade_score)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {portfolio.length === 0 && !portfolioData && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 20px",
              color: isDark ? "#7a9a7e" : "#aaa",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>📊</div>
            <p style={{ fontSize: "0.9rem", margin: "0 0 12px" }}>
              Search for products above to build your portfolio, then click &ldquo;Score&rdquo; to
              get a sustainability analysis.
            </p>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>
              This tool is designed for food brands, procurement teams, and ESG analysts. It uses
              the same{" "}
              <Link
                href="/methodology"
                style={{
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                  textDecoration: "underline",
                }}
              >
                GreenGrade methodology
              </Link>{" "}
              that powers individual product scores.
            </p>
          </div>
        )}

        {/* Info footer */}
        <div
          style={{
            marginTop: 32,
            padding: "20px 24px",
            background: isDark
              ? "linear-gradient(135deg, #1a3327, #14352a)"
              : "linear-gradient(135deg, #edf7f0, #d8f3dc)",
            borderRadius: 14,
            fontSize: "0.83rem",
            color: isDark ? "#b0c4b1" : "#2d6a4f",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <strong style={{ fontFamily: "'Outfit', sans-serif" }}>
            For food brands & procurement teams
          </strong>
          <span>
            Need a Digital Product Passport for a specific product?{" "}
            <Link
              href="/products"
              style={{ color: isDark ? "#95d5b2" : "#1b4332", fontWeight: 600 }}
            >
              Browse the catalogue
            </Link>{" "}
            and open any product to access its full DPP, including the 7-dimension emission
            breakdown, data confidence tier, and score provenance.
          </span>
        </div>
      </div>
    </div>
  );
}
