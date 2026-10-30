"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchProducts, fetchCarbonSummary } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_ICONS, WEEKLY_CARBON_GOAL_KG } from "@/utils/constants";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const PIE_COLORS = [
  "#2d6a4f",
  "#40916c",
  "#52b788",
  "#74c69d",
  "#95d5b2",
  "#b7e4c7",
  "#d8f3dc",
  "#e9c46a",
  "#e63946",
];

const cardStyle = (isDark) => ({
  background: isDark ? "#14352a" : "#fff",
  borderRadius: 14,
  padding: 24,
  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
});

const sectionHeadingStyle = (isDark) => ({
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 700,
  marginBottom: 4,
  color: isDark ? "#e8f5e9" : "inherit",
});

const subtextStyle = (isDark) => ({
  fontSize: "0.82rem",
  color: isDark ? "#7a9a7e" : "#888",
  marginBottom: 16,
});

const thStyle = (isDark, textAlign = "left") => ({
  textAlign,
  padding: "10px 8px",
  color: isDark ? "#95d5b2" : "#2d6a4f",
  fontWeight: 700,
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
        <div key={i} style={{ color: p.color, display: "flex", gap: 8, alignItems: "center" }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, subtext, color, isDark }) {
  return (
    <div
      style={{
        background: isDark ? "#14352a" : "#fff",
        borderRadius: 14,
        padding: "20px 18px",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.8rem",
          color: color || (isDark ? "#95d5b2" : "#2d6a4f"),
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          color: isDark ? "#b0c4b1" : "#555",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      {subtext && (
        <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#888" }}>{subtext}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated } = useAuth();

  const {
    data: dashData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      Promise.all([fetchStats(), fetchProducts({ sort: "grade_desc", limit: 10 })]).then(
        ([statsData, prodData]) => ({ stats: statsData, topProducts: prodData.products })
      ),
  });

  const { data: carbonSummary } = useQuery({
    queryKey: ["carbon-summary-widget"],
    queryFn: fetchCarbonSummary,
    enabled: isAuthenticated,
  });

  const stats = dashData?.stats;
  const topProducts = dashData?.topProducts || [];
  const {
    categories,
    overallAvgScore,
    overallAvgEmissions,
    bestCategory,
    greenCount,
    scoreChartData,
    emissionsChartData,
    pieData,
    radarData,
  } = useMemo(() => {
    const cats = stats?.categories || [];
    const totalProds = stats?.totalProducts || 0;

    if (!cats.length || !totalProds) {
      return {
        categories: [],
        overallAvgScore: "0",
        overallAvgEmissions: "0",
        bestCategory: null,
        greenCount: 0,
        scoreChartData: [],
        emissionsChartData: [],
        pieData: [],
        radarData: [],
      };
    }
    const avgScore = (
      cats.reduce((s, c) => s + c.avgScore * c.productCount, 0) / totalProds
    ).toFixed(1);
    const avgEmissions = (
      cats.reduce((s, c) => s + c.avgEmissions * c.productCount, 0) / totalProds
    ).toFixed(2);
    const best = cats[0];
    const green = cats.reduce((sum, c) => {
      if (c.avgScore >= 7) return sum + c.productCount;
      return sum;
    }, 0);
    const score = cats.map((c) => ({
      name: c.category,
      icon: CATEGORY_ICONS[c.category] || "",
      score: c.avgScore,
      fill: c.avgScore >= 7 ? "#2d6a4f" : c.avgScore >= 4 ? "#e9c46a" : "#e63946",
    }));
    const emissions = cats.map((c) => ({
      name: c.category,
      emissions: c.avgEmissions,
    }));
    const pie = cats.map((c) => ({
      name: c.category,
      value: c.productCount,
    }));
    const radar = cats.map((c) => ({
      category: c.category.length > 8 ? c.category.slice(0, 8) + "..." : c.category,
      score: c.avgScore,
      fullMark: 10,
    }));
    return {
      categories: cats,
      overallAvgScore: avgScore,
      overallAvgEmissions: avgEmissions,
      bestCategory: best,
      greenCount: green,
      scoreChartData: score,
      emissionsChartData: emissions,
      pieData: pie,
      radarData: radar,
    };
  }, [stats]);
  const totalProducts = stats?.totalProducts || 0;

  if (isLoading) {
    return <Spinner message="Loading dashboard..." />;
  }

  if (error || !stats) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            padding: 24,
            background: isDark ? "#2a1519" : "#fef2f2",
            borderRadius: 14,
            color: "#e63946",
            textAlign: "center",
          }}
        >
          {error?.message || "Unable to load dashboard data."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"\uD83D\uDCCA"}
        title="Sustainability Dashboard"
        subtitle={`Insights across ${totalProducts} products and ${categories.length} categories.`}
      />

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Summary Stats */}
        <div
          style={{
            marginTop: -20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 24,
            animation: "fadeInUp 0.4s ease",
          }}
        >
          <StatCard
            icon={"\uD83C\uDF3F"}
            label="Total Products"
            value={totalProducts}
            isDark={isDark}
          />
          <StatCard
            icon={"\u2B50"}
            label="Avg GreenGrade"
            value={overallAvgScore}
            subtext="out of 10"
            color={parseFloat(overallAvgScore) >= 7 ? (isDark ? "#95d5b2" : "#2d6a4f") : "#e9c46a"}
            isDark={isDark}
          />
          <StatCard
            icon={"\uD83C\uDF0D"}
            label="Avg Emissions"
            value={overallAvgEmissions}
            subtext="kg CO\u2082e per product"
            isDark={isDark}
          />
          <StatCard
            icon={"\uD83C\uDFC6"}
            label="Best Category"
            value={bestCategory.category}
            subtext={`Score: ${bestCategory.avgScore}`}
            isDark={isDark}
          />
        </div>

        {/* Personal Carbon Widget (authenticated users only) */}
        {isAuthenticated && carbonSummary && (
          <div
            style={{
              ...cardStyle(isDark),
              marginBottom: 16,
              animation: "fadeInUp 0.4s ease 0.05s both",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div>
                <h3 style={{ ...sectionHeadingStyle(isDark), marginBottom: 2 }}>
                  Your Carbon Footprint
                </h3>
                <p style={subtextStyle(isDark)}>
                  Weekly progress toward your {WEEKLY_CARBON_GOAL_KG} kg CO₂e goal.
                </p>
              </div>
              <Link
                href="/carbon"
                style={{
                  fontSize: "0.8rem",
                  color: isDark ? "#95d5b2" : "#2d6a4f",
                  textDecoration: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                View Tracker →
              </Link>
            </div>

            {/* Weekly progress bar */}
            {(() => {
              const weekly = carbonSummary.weeklyEmissions ?? 0;
              const pct = Math.min(100, (weekly / WEEKLY_CARBON_GOAL_KG) * 100);
              const overGoal = weekly > WEEKLY_CARBON_GOAL_KG;
              const barColor = overGoal
                ? "#e63946"
                : weekly / WEEKLY_CARBON_GOAL_KG > 0.75
                  ? "#e9c46a"
                  : "#52b788";
              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.8rem",
                      marginBottom: 6,
                      color: isDark ? "#b0c4b1" : "#555",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: overGoal ? "#e63946" : barColor }}>
                      {weekly.toFixed(2)} kg this week
                    </span>
                    <span>{WEEKLY_CARBON_GOAL_KG} kg goal</span>
                  </div>
                  <div
                    style={{
                      background: isDark ? "#1e3a28" : "#e8f5e9",
                      borderRadius: 8,
                      height: 10,
                      overflow: "hidden",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: barColor,
                        borderRadius: 8,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </>
              );
            })()}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Total Logged",
                  value: `${(carbonSummary.totalEmissions ?? 0).toFixed(1)} kg`,
                  icon: "🌍",
                },
                {
                  label: "This Month",
                  value: `${(carbonSummary.monthlyEmissions ?? 0).toFixed(1)} kg`,
                  icon: "📅",
                },
                {
                  label: "Log Entries",
                  value: carbonSummary.totalLogs ?? 0,
                  icon: "📋",
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  style={{
                    background: isDark ? "#1a3327" : "#f5fbf7",
                    borderRadius: 10,
                    padding: "10px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "1.1rem", marginBottom: 2 }}>{icon}</div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.05rem",
                      color: isDark ? "#95d5b2" : "#2d6a4f",
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: isDark ? "#7a9a7e" : "#888" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score by Category Chart */}
        <div
          style={{
            ...cardStyle(isDark),
            marginBottom: 16,
            animation: "fadeInUp 0.4s ease 0.1s both",
          }}
        >
          <h3 style={sectionHeadingStyle(isDark)}>Average GreenGrade by Category</h3>
          <p style={subtextStyle(isDark)}>Higher scores indicate more sustainable products.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2d4a35" : "#f0f0f0"} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Bar dataKey="score" name="Avg Score" radius={[6, 6, 0, 0]}>
                {scoreChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Two column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Emissions Chart */}
          <div
            style={{
              ...cardStyle(isDark),
              animation: "fadeInUp 0.4s ease 0.15s both",
            }}
          >
            <h3 style={sectionHeadingStyle(isDark)}>Average Emissions</h3>
            <p style={subtextStyle(isDark)}>kg CO{"\u2082"}e per product by category.</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={emissionsChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#2d4a35" : "#f0f0f0"}
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#666" }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar
                  dataKey="emissions"
                  name="Avg Emissions"
                  fill="#e9c46a"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product Distribution Pie */}
          <div
            style={{
              ...cardStyle(isDark),
              animation: "fadeInUp 0.4s ease 0.2s both",
            }}
          >
            <h3 style={sectionHeadingStyle(isDark)}>Product Distribution</h3>
            <p style={subtextStyle(isDark)}>Number of products by category.</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={{ strokeWidth: 1 }}
                  style={{ fontSize: "0.72rem" }}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div
          style={{
            ...cardStyle(isDark),
            marginBottom: 16,
            animation: "fadeInUp 0.4s ease 0.25s both",
          }}
        >
          <h3 style={sectionHeadingStyle(isDark)}>Category Score Radar</h3>
          <p style={subtextStyle(isDark)}>
            Visual overview of sustainability scores across categories.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={isDark ? "#2d4a35" : "#e0e0e0"} />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: isDark ? "#b0c4b1" : "#555" }}
              />
              <Radar
                name="Avg Score"
                dataKey="score"
                stroke="#2d6a4f"
                fill="#52b788"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table */}
        <div
          style={{
            ...cardStyle(isDark),
            animation: "fadeInUp 0.4s ease 0.3s both",
          }}
        >
          <h3 style={sectionHeadingStyle(isDark)}>Top 10 Greenest Products</h3>
          <p style={subtextStyle(isDark)}>Products with the highest GreenGrade scores.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + (isDark ? "#2d4a35" : "#edf7f0") }}>
                  <th style={thStyle(isDark)}>#</th>
                  <th style={thStyle(isDark)}>Product</th>
                  <th style={thStyle(isDark)}>Brand</th>
                  <th style={thStyle(isDark)}>Category</th>
                  <th style={thStyle(isDark, "right")}>Score</th>
                  <th style={thStyle(isDark, "right")}>CO{"\u2082"}e</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: "1px solid " + (isDark ? "#2d4a35" : "#f5f5f5"),
                      transition: "background 0.15s",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 8px",
                        fontWeight: 600,
                        color: i < 3 ? "#2d6a4f" : "#888",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        fontWeight: 500,
                        color: isDark ? "#e8f5e9" : "inherit",
                      }}
                    >
                      {p.name}
                    </td>
                    <td style={{ padding: "10px 8px", color: isDark ? "#b0c4b1" : "#666" }}>
                      {p.brand}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: "0.8rem" }}>
                          {CATEGORY_ICONS[p.category] || ""}
                        </span>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          background:
                            p.greenGrade.score >= 7
                              ? isDark
                                ? "#1c3a2a"
                                : "#edf7f0"
                              : isDark
                                ? "#3a3420"
                                : "#fff8e1",
                          color:
                            p.greenGrade.score >= 7 ? (isDark ? "#95d5b2" : "#2d6a4f") : "#b45309",
                        }}
                      >
                        {p.greenGrade.score}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 8px",
                        textAlign: "right",
                        color: isDark ? "#b0c4b1" : "#666",
                      }}
                    >
                      {p.greenGrade.totalEmissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Green Products Summary */}
        <div
          style={{
            marginTop: 16,
            background: "linear-gradient(135deg, #2d6a4f, #40916c)",
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            animation: "fadeInUp 0.4s ease 0.35s both",
          }}
        >
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "2.5rem",
              color: "#fff",
            }}
          >
            {Math.round((greenCount / totalProducts) * 100)}%
          </div>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem" }}>
            of tracked products fall in categories with green-rated average scores (7+)
          </p>
        </div>
      </div>
    </div>
  );
}
