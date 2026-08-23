"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { fetchProducts, fetchPortfolioScore } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import PageHero from "@/components/PageHero";
import GradeBadge from "@/components/GradeBadge";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, errorAlert } from "@/utils/pageStyles";

function tierOf(score) {
  if (score >= 7) return { label: "Green", color: "green" };
  if (score >= 4) return { label: "Amber", color: "yellow" };
  return { label: "Red", color: "red" };
}

const TIER_CHIP_STYLE = {
  green: { background: "rgba(45,106,79,0.12)", color: "#2d6a4f" },
  yellow: { background: "rgba(180,83,9,0.1)", color: "#92400e" },
  red: { background: "rgba(192,57,43,0.1)", color: "#c0392b" },
};

const SCORE_BANDS = [
  { label: "1–2", min: 1, max: 2.99 },
  { label: "3–4", min: 3, max: 4.99 },
  { label: "5–6", min: 5, max: 6.99 },
  { label: "7–8", min: 7, max: 8.99 },
  { label: "9–10", min: 9, max: 10 },
];

const BAND_COLORS = ["#e63946", "#e9c46a", "#e9c46a", "#52b788", "#2d6a4f"];

function buildDistribution(products) {
  return SCORE_BANDS.map((band, i) => ({
    band: band.label,
    count: products.filter((p) => p.greengrade_score >= band.min && p.greengrade_score <= band.max)
      .length,
    fill: BAND_COLORS[i],
  }));
}

function exportPortfolioCsv(products) {
  const header = [
    "Product Name",
    "Brand",
    "Category",
    "GreenGrade Score",
    "Tier",
    "Total CO2e (kg)",
    "Land Use Change",
    "Animal Feed",
    "Farm",
    "Processing",
    "Transport",
    "Packaging",
    "Retail",
    "Confidence",
  ].join(",");

  const rows = products.map((p) => {
    const tier = tierOf(p.greengrade_score).label;
    const em = p.emission_breakdown;
    return [
      `"${p.product_name}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      p.greengrade_score,
      tier,
      p.total_carbon_footprint_kg_co2e,
      em.land_use_change,
      em.animal_feed,
      em.farm_operations,
      em.processing,
      em.transport,
      em.packaging,
      em.retail,
      `"${p.data_confidence_label || ""}"`,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio-scores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, sub, accent, isDark }) {
  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        flex: 1,
        minWidth: 140,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          color: accent || (isDark ? "#a7f3d0" : "#2d6a4f"),
        }}
      >
        {value}
      </div>
      <div
        style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#b0c4b1" : "#555", marginTop: 4 }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#999", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function TierChip({ score }) {
  const { label, color } = tierOf(score);
  const styles = TIER_CHIP_STYLE[color];
  return (
    <span
      style={{
        ...styles,
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

const CustomTooltip = ({ active, payload, isDark }) => {
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
        color: isDark ? "#e8f5e9" : "#222",
      }}
    >
      <strong>Score band {payload[0].payload.band}</strong>
      <br />
      {payload[0].value} product{payload[0].value !== 1 ? "s" : ""}
    </div>
  );
};

export default function Portfolio() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const { data: productList, isLoading: listLoading } = useQuery({
    queryKey: ["products-all"],
    queryFn: () => fetchProducts({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const scoreMutation = useMutation({
    mutationFn: (ids) => fetchPortfolioScore(ids),
    onSuccess: (data) => setResult(data),
  });

  const allProducts = productList?.products || [];
  const filtered = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allProducts;

  const toggleSelect = useCallback((id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 100 ? prev : [...prev, id]
    );
    setResult(null);
  }, []);

  const handleScore = () => {
    if (selected.length < 1) return;
    scoreMutation.mutate(selected.map(String));
  };

  const handleReset = () => {
    setSelected([]);
    setResult(null);
    scoreMutation.reset();
  };

  const distribution = result ? buildDistribution(result.products) : [];
  const summary = result?.portfolio_summary;
  const categoryBenchmarks = result?.category_benchmarks || [];

  const bg = isDark ? "#0a0a0a" : "#f4f7f4";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#888";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)";
  const rowBg = isDark ? "rgba(255,255,255,0.03)" : "#fafafa";

  return (
    <div style={{ background: bg, minHeight: "100vh", paddingBottom: 80 }}>
      <PageHero
        icon="📊"
        title="Portfolio Scoring"
        subtitle="Score up to 100 SKUs and analyse your product line's carbon footprint."
      />

      <div style={{ ...pageContainer(1100), paddingTop: 8 }}>
        {/* Selector panel */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}
        >
          <div style={{ ...card(isDark, { radius: 14, padding: 20 }) }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: textPrimary,
                  margin: 0,
                }}
              >
                Select Products
              </h2>
              <span style={{ fontSize: "0.8rem", color: textMuted }}>
                {selected.length} / 100 selected
              </span>
            </div>

            <input
              type="text"
              placeholder="Search by name, brand, or category…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: textPrimary,
                fontSize: "0.88rem",
                outline: "none",
                marginBottom: 12,
              }}
            />

            {listLoading ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <Spinner />
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 340,
                  overflowY: "auto",
                  borderRadius: 10,
                  border: `1px solid ${borderColor}`,
                }}
              >
                {filtered.slice(0, 80).map((p) => {
                  const isSelected = selected.includes(String(p.id));
                  const tier = tierOf(p.greenGrade?.score ?? 5);
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 12px",
                        cursor: "pointer",
                        background: isSelected
                          ? isDark
                            ? "rgba(82,183,136,0.1)"
                            : "#f0faf4"
                          : "transparent",
                        borderBottom: `1px solid ${borderColor}`,
                        transition: "background 0.12s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(String(p.id))}
                        style={{ accentColor: "#2d6a4f", width: 15, height: 15, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: textMuted }}>
                          {p.brand} · {p.category}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color:
                            tier.color === "green"
                              ? "#2d6a4f"
                              : tier.color === "yellow"
                                ? "#92400e"
                                : "#c0392b",
                          flexShrink: 0,
                        }}
                      >
                        {p.greenGrade?.score?.toFixed(1) ?? "–"}
                      </div>
                    </label>
                  );
                })}
                {filtered.length > 80 && (
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "0.78rem",
                      color: textMuted,
                      textAlign: "center",
                    }}
                  >
                    Showing 80 of {filtered.length} results — refine your search to find more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action panel */}
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 20 }),
              width: 220,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: "0.8rem", color: textMuted, textAlign: "center" }}>
              {selected.length === 0
                ? "Select at least 1 product to score"
                : `${selected.length} product${selected.length !== 1 ? "s" : ""} ready`}
            </div>

            <button
              onClick={handleScore}
              disabled={selected.length === 0 || scoreMutation.isPending}
              style={{
                ...primaryButton({ loading: scoreMutation.isPending }),
                width: "100%",
                opacity: selected.length === 0 ? 0.5 : 1,
                fontSize: "0.9rem",
              }}
            >
              {scoreMutation.isPending ? "Scoring…" : "Score Portfolio"}
            </button>

            {selected.length > 0 && (
              <button
                onClick={handleReset}
                style={{
                  padding: "10px 0",
                  background: "transparent",
                  border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: textMuted,
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Clear Selection
              </button>
            )}

            {result && (
              <button
                onClick={() => exportPortfolioCsv(result.products)}
                style={{
                  padding: "10px 0",
                  background: isDark ? "rgba(82,183,136,0.08)" : "#f0faf4",
                  border: `1.5px solid ${isDark ? "#2d6a4f" : "#b7e4c7"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  color: isDark ? "#74c69d" : "#2d6a4f",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Export CSV
              </button>
            )}

            {/* Selected list */}
            {selected.length > 0 && (
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  borderTop: `1px solid ${borderColor}`,
                  paddingTop: 10,
                  marginTop: 2,
                }}
              >
                {selected.map((id) => {
                  const p = allProducts.find((x) => String(x.id) === id);
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "5px 0",
                        fontSize: "0.78rem",
                        color: textPrimary,
                      }}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {p?.name ?? id}
                      </span>
                      <button
                        aria-label={`Remove ${p?.name ?? id}`}
                        onClick={() => toggleSelect(id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: textMuted,
                          fontSize: 14,
                          padding: "0 0 0 6px",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {scoreMutation.isError && (
          <div style={{ ...errorAlert(isDark), marginTop: 20 }}>
            {scoreMutation.error?.message || "Scoring failed. Please try again."}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ marginTop: 32, animation: "fadeInUp 0.4s ease both" }}>
            {/* Summary stat cards */}
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: textPrimary,
                marginBottom: 16,
              }}
            >
              Portfolio Summary
            </h2>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              <StatCard label="Products Scored" value={summary.product_count} isDark={isDark} />
              <StatCard
                label="Avg GreenGrade"
                value={summary.average_score}
                sub={tierOf(summary.average_score).label + " tier"}
                accent={
                  summary.average_score >= 7
                    ? "#2d6a4f"
                    : summary.average_score >= 4
                      ? "#b45309"
                      : "#c0392b"
                }
                isDark={isDark}
              />
              <StatCard
                label="Best Performer"
                value={summary.highest.score}
                sub={summary.highest.name}
                accent="#2d6a4f"
                isDark={isDark}
              />
              <StatCard
                label="Needs Attention"
                value={summary.lowest.score}
                sub={summary.lowest.name}
                accent="#c0392b"
                isDark={isDark}
              />
            </div>

            {/* Distribution chart */}
            <div style={{ ...card(isDark, { radius: 14, padding: 20 }), marginBottom: 20 }}>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: textPrimary,
                  marginBottom: 16,
                }}
              >
                Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distribution} barSize={38}>
                  <CartesianGrid
                    vertical={false}
                    stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                  />
                  <XAxis
                    dataKey="band"
                    tick={{ fill: isDark ? "#7a9a7e" : "#777", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: isDark ? "#7a9a7e" : "#777", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    content={(props) => <CustomTooltip {...props} isDark={isDark} />}
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category benchmarks */}
            {categoryBenchmarks.length > 0 && (
              <div style={{ ...card(isDark, { radius: 14, padding: 20 }), marginBottom: 20 }}>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: textPrimary,
                    marginBottom: 14,
                  }}
                >
                  Category Breakdown
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        {["Category", "SKUs", "Avg Score", "Avg CO2e (kg)"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 10px",
                              color: isDark ? "#95d5b2" : "#2d6a4f",
                              fontWeight: 700,
                              borderBottom: `2px solid ${borderColor}`,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryBenchmarks
                        .sort((a, b) => b.avg_score - a.avg_score)
                        .map((cat, i) => (
                          <tr
                            key={cat.category}
                            style={{
                              background: i % 2 === 0 ? "transparent" : rowBg,
                            }}
                          >
                            <td
                              style={{ padding: "9px 10px", color: textPrimary, fontWeight: 600 }}
                            >
                              {cat.category}
                            </td>
                            <td style={{ padding: "9px 10px", color: textMuted }}>{cat.count}</td>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <TierChip score={cat.avg_score} />
                                <span style={{ color: textPrimary }}>{cat.avg_score}</span>
                              </span>
                            </td>
                            <td style={{ padding: "9px 10px", color: textMuted }}>
                              {cat.avg_emissions} kg
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Per-product results table */}
            <div style={{ ...card(isDark, { radius: 14, padding: 20 }) }}>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: textPrimary,
                  marginBottom: 14,
                }}
              >
                Product Results
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      {["Product", "Category", "Score", "Tier", "CO2e (kg)", "Confidence"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "8px 10px",
                              color: isDark ? "#95d5b2" : "#2d6a4f",
                              fontWeight: 700,
                              borderBottom: `2px solid ${borderColor}`,
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
                    {result.products
                      .slice()
                      .sort((a, b) => b.greengrade_score - a.greengrade_score)
                      .map((p, i) => {
                        const { color } = tierOf(p.greengrade_score);
                        return (
                          <tr
                            key={p.product_id}
                            style={{ background: i % 2 === 0 ? "transparent" : rowBg }}
                          >
                            <td style={{ padding: "9px 10px" }}>
                              <Link
                                href={`/product/${p.product_id}`}
                                style={{
                                  color: isDark ? "#74c69d" : "#2d6a4f",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                }}
                              >
                                {p.product_name}
                              </Link>
                              <div style={{ fontSize: "0.72rem", color: textMuted }}>{p.brand}</div>
                            </td>
                            <td style={{ padding: "9px 10px", color: textMuted }}>{p.category}</td>
                            <td style={{ padding: "9px 10px" }}>
                              <GradeBadge score={p.greengrade_score} color={color} />
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <TierChip score={p.greengrade_score} />
                            </td>
                            <td style={{ padding: "9px 10px", color: textMuted }}>
                              {p.total_carbon_footprint_kg_co2e.toFixed(2)}
                            </td>
                            <td
                              style={{ padding: "9px 10px", color: textMuted, fontSize: "0.78rem" }}
                            >
                              {p.data_confidence_label || "–"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
