"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import GradeBadge from "@/components/GradeBadge";
import PageHero from "@/components/PageHero";
import { useTheme } from "@/context/ThemeContext";
import { scoreColor } from "@/utils/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

function gradeColor(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "yellow";
  return "red";
}

function tier(score) {
  if (score >= 7) return "green";
  if (score >= 4) return "amber";
  return "red";
}

const TIER_COLOR = { green: "#52b788", amber: "#e9c46a", red: "#e63946" };

function KPICard({ label, value, sub, accent, isDark }) {
  return (
    <div
      style={{
        flex: "1 1 160px",
        background: isDark ? "#14352a" : "#fff",
        borderRadius: 14,
        padding: "20px 18px",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.7rem",
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          color: accent,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa", marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label, isDark }) {
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
      <div>{payload[0].value} products</div>
    </div>
  );
}

export default function Portfolio() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [allProducts, setAllProducts] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [sortKey, setSortKey] = useState("score_desc");

  useEffect(() => {
    fetchProducts({ limit: 100 })
      .then((data) => setAllProducts(data.products || []))
      .catch(() => setLoadError("Unable to load product catalog."));
  }, []);

  const filtered = useMemo(() => {
    if (!searchFilter) return allProducts;
    const q = searchFilter.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [allProducts, searchFilter]);

  const toggleProduct = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 100) return prev;
      return [...prev, id];
    });
    setResult(null);
  };

  const runScore = async () => {
    if (selected.length < 1) return;
    setScoreError("");
    setLoading(true);
    try {
      const data = await fetchPortfolioScore(selected.map(String));
      setResult(data);
    } catch (err) {
      setScoreError(err.message || "Unable to score portfolio.");
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelected([]);
    setResult(null);
    setScoreError("");
  };

  const sortedProducts = useMemo(() => {
    if (!result) return [];
    const items = [...result.products];
    switch (sortKey) {
      case "score_desc":
        return items.sort((a, b) => b.greengrade_score - a.greengrade_score);
      case "score_asc":
        return items.sort((a, b) => a.greengrade_score - b.greengrade_score);
      case "emissions_desc":
        return items.sort(
          (a, b) => b.total_carbon_footprint_kg_co2e - a.total_carbon_footprint_kg_co2e
        );
      case "emissions_asc":
        return items.sort(
          (a, b) => a.total_carbon_footprint_kg_co2e - b.total_carbon_footprint_kg_co2e
        );
      default:
        return items;
    }
  }, [result, sortKey]);

  const distributionData = useMemo(() => {
    if (!result) return [];
    const green = result.products.filter((p) => p.greengrade_score >= 7).length;
    const amber = result.products.filter(
      (p) => p.greengrade_score >= 4 && p.greengrade_score < 7
    ).length;
    const red = result.products.filter((p) => p.greengrade_score < 4).length;
    return [
      { name: "Green (≥7)", count: green, fill: "#52b788" },
      { name: "Amber (4–7)", count: amber, fill: "#e9c46a" },
      { name: "Red (<4)", count: red, fill: "#e63946" },
    ];
  }, [result]);

  const cardStyle = {
    background: isDark ? "#162419" : "#fff",
    borderRadius: 14,
    padding: 20,
    boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
    marginBottom: 20,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid " + (isDark ? "#2d4a35" : "#d8f3dc"),
    background: isDark ? "#1a2e22" : "#f9fef9",
    color: isDark ? "#e8f5e9" : "#1b4332",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📊"
        title="Portfolio Scorer"
        subtitle="Select up to 100 SKUs to analyse their collective carbon footprint."
      />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Product selector */}
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                color: isDark ? "#e8f5e9" : "#1b4332",
              }}
            >
              Select Products{" "}
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 400,
                  color: isDark ? "#7a9a7e" : "#888",
                }}
              >
                ({selected.length} / 100)
              </span>
            </span>
            {selected.length > 0 && (
              <button
                onClick={clearSelection}
                style={{
                  background: "none",
                  border: "none",
                  color: isDark ? "#7a9a7e" : "#888",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {loadError && (
            <div style={{ color: "#e63946", marginBottom: 12, fontSize: "0.9rem" }}>
              {loadError}
            </div>
          )}

          <input
            type="text"
            placeholder="Search by name, brand, or category…"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }}
            aria-label="Search products"
          />

          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              border: "1px solid " + (isDark ? "#2d4a35" : "#e8f5e9"),
              borderRadius: 8,
            }}
          >
            {filtered.slice(0, 80).map((p) => {
              const checked = selected.includes(String(p.id));
              return (
                <label
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: checked
                      ? isDark
                        ? "rgba(82,183,136,0.12)"
                        : "rgba(82,183,136,0.08)"
                      : "transparent",
                    borderBottom: "1px solid " + (isDark ? "#1a2e22" : "#f0faf4"),
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(String(p.id))}
                    style={{ accentColor: "#52b788", flexShrink: 0 }}
                    aria-label={`Select ${p.name}`}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: "0.88rem",
                      color: isDark ? "#e8f5e9" : "#1b4332",
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: isDark ? "#7a9a7e" : "#888",
                      flexShrink: 0,
                    }}
                  >
                    {p.brand} · {p.category}
                  </span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: isDark ? "#7a9a7e" : "#aaa",
                  fontSize: "0.88rem",
                }}
              >
                No products match your search.
              </div>
            )}
            {filtered.length > 80 && (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "0.78rem",
                  color: isDark ? "#7a9a7e" : "#aaa",
                  textAlign: "center",
                }}
              >
                Showing first 80 of {filtered.length} results — refine your search to see more.
              </div>
            )}
          </div>

          {scoreError && (
            <div style={{ color: "#e63946", marginTop: 12, fontSize: "0.88rem" }}>
              {scoreError}
            </div>
          )}

          <button
            onClick={runScore}
            disabled={selected.length < 1 || loading}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "12px 0",
              borderRadius: 10,
              border: "none",
              background: selected.length < 1 ? (isDark ? "#2d4a35" : "#d8f3dc") : "#2d6a4f",
              color: selected.length < 1 ? (isDark ? "#7a9a7e" : "#aaa") : "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: selected.length < 1 || loading ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Scoring…" : `Score Portfolio (${selected.length} SKU${selected.length !== 1 ? "s" : ""})`}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* KPI row */}
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginBottom: 20,
              }}
            >
              <KPICard
                label="Average GreenGrade"
                value={result.portfolio_summary.average_score}
                sub="out of 10"
                accent={scoreColor(result.portfolio_summary.average_score)}
                isDark={isDark}
              />
              <KPICard
                label="Products Scored"
                value={result.portfolio_summary.product_count}
                sub="SKUs in portfolio"
                accent="#40916c"
                isDark={isDark}
              />
              <KPICard
                label="Best Performer"
                value={result.portfolio_summary.highest.score}
                sub={result.portfolio_summary.highest.name}
                accent="#52b788"
                isDark={isDark}
              />
              <KPICard
                label="Needs Improvement"
                value={result.portfolio_summary.lowest.score}
                sub={result.portfolio_summary.lowest.name}
                accent="#e63946"
                isDark={isDark}
              />
            </div>

            {/* Distribution chart */}
            <div style={cardStyle}>
              <div
                style={{
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  marginBottom: 4,
                  color: isDark ? "#e8f5e9" : "#1b4332",
                }}
              >
                Score Distribution
              </div>
              <div
                style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888", marginBottom: 16 }}
              >
                Green ≥7 · Amber 4–7 · Red &lt;4
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={distributionData} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? "#2d4a35" : "#e8f5e9"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: isDark ? "#95d5b2" : "#2d6a4f" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#aaa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category benchmarks */}
            {result.category_benchmarks.length > 0 && (
              <div style={cardStyle}>
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    marginBottom: 4,
                    color: isDark ? "#e8f5e9" : "#1b4332",
                  }}
                >
                  Category Benchmarks
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 14,
                  }}
                >
                  Average GreenGrade and emissions by category across your portfolio.
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.88rem",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Category", "SKUs", "Avg Score", "Avg CO₂e (kg)"].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              textAlign: i === 0 ? "left" : "right",
                              padding: "8px 10px",
                              color: isDark ? "#95d5b2" : "#2d6a4f",
                              fontWeight: 700,
                              borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#d8f3dc"),
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.category_benchmarks
                        .sort((a, b) => b.avg_score - a.avg_score)
                        .map((cat) => (
                          <tr
                            key={cat.category}
                            style={{
                              borderBottom: "1px solid " + (isDark ? "#1a2e22" : "#f0faf4"),
                            }}
                          >
                            <td
                              style={{
                                padding: "10px 10px",
                                fontWeight: 600,
                                color: isDark ? "#e8f5e9" : "#1b4332",
                              }}
                            >
                              {cat.category}
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "10px 10px",
                                color: isDark ? "#7a9a7e" : "#666",
                              }}
                            >
                              {cat.count}
                            </td>
                            <td style={{ textAlign: "right", padding: "10px 10px" }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: scoreColor(cat.avg_score),
                                }}
                              >
                                {cat.avg_score}
                              </span>
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                padding: "10px 10px",
                                color: isDark ? "#7a9a7e" : "#666",
                              }}
                            >
                              {cat.avg_emissions.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product table */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    color: isDark ? "#e8f5e9" : "#1b4332",
                  }}
                >
                  All Products
                </div>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid " + (isDark ? "#2d4a35" : "#d8f3dc"),
                    background: isDark ? "#1a2e22" : "#f9fef9",
                    color: isDark ? "#e8f5e9" : "#1b4332",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                  aria-label="Sort products"
                >
                  <option value="score_desc">Score: high → low</option>
                  <option value="score_asc">Score: low → high</option>
                  <option value="emissions_desc">CO₂e: high → low</option>
                  <option value="emissions_asc">CO₂e: low → high</option>
                </select>
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 14,
                }}
              >
                Click a product to view its Digital Product Passport.
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}
                >
                  <thead>
                    <tr>
                      {["#", "Product", "Brand", "Category", "Score", "CO₂e (kg)", ""].map(
                        (h, i) => (
                          <th
                            key={h + i}
                            style={{
                              textAlign: i <= 3 ? "left" : "right",
                              padding: "8px 10px",
                              color: isDark ? "#95d5b2" : "#2d6a4f",
                              fontWeight: 700,
                              borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#d8f3dc"),
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((p, idx) => {
                      const color = gradeColor(p.greengrade_score);
                      return (
                        <tr
                          key={p.product_id}
                          style={{
                            borderBottom: "1px solid " + (isDark ? "#1a2e22" : "#f0faf4"),
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 10px",
                              color: isDark ? "#7a9a7e" : "#aaa",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td
                            style={{
                              padding: "10px 10px",
                              fontWeight: 600,
                              color: isDark ? "#e8f5e9" : "#1b4332",
                              maxWidth: 200,
                            }}
                          >
                            {p.product_name}
                          </td>
                          <td
                            style={{
                              padding: "10px 10px",
                              color: isDark ? "#7a9a7e" : "#666",
                            }}
                          >
                            {p.brand}
                          </td>
                          <td
                            style={{
                              padding: "10px 10px",
                              color: isDark ? "#7a9a7e" : "#666",
                            }}
                          >
                            {p.category}
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right" }}>
                            <div
                              style={{ display: "flex", justifyContent: "flex-end" }}
                            >
                              <GradeBadge
                                score={p.greengrade_score}
                                color={color}
                                size="normal"
                              />
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "10px 10px",
                              textAlign: "right",
                              color: isDark ? "#7a9a7e" : "#666",
                            }}
                          >
                            {p.total_carbon_footprint_kg_co2e.toFixed(2)}
                          </td>
                          <td style={{ padding: "10px 10px", textAlign: "right" }}>
                            <Link
                              href={`/passport/${p.product_id}`}
                              style={{
                                fontSize: "0.78rem",
                                color: "#40916c",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                              }}
                            >
                              Passport →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
