import React, { useEffect, useState } from "react";
import { fetchStats, fetchProducts } from "../services/api";
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

const CATEGORY_ICONS = {
  Protein: "\uD83E\uDD69",
  Seafood: "\uD83D\uDC1F",
  "Dairy & Eggs": "\uD83E\uDD5B",
  Grains: "\uD83C\uDF3E",
  Fruits: "\uD83C\uDF53",
  Vegetables: "\uD83E\uDD66",
  Beverages: "\uD83E\uDDC3",
  Snacks: "\uD83C\uDF6A",
  Pantry: "\uD83C\uDF6F",
};

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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        border: "1px solid #eee",
        fontSize: "0.82rem",
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

function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "20px 18px",
        boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{icon}</div>
      <div
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: "1.8rem",
          color: color || "#2d6a4f",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#555", marginBottom: 2 }}>
        {label}
      </div>
      {subtext && <div style={{ fontSize: "0.75rem", color: "#888" }}>{subtext}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchStats(), fetchProducts({ sort: "grade_desc", limit: 10 })])
      .then(([statsData, prodData]) => {
        setStats(statsData);
        setTopProducts(prodData.products);
      })
      .catch(() => setError("Unable to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #d8f3dc",
            borderTopColor: "#2d6a4f",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            padding: 24,
            background: "#fef2f2",
            borderRadius: 14,
            color: "#e63946",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const { categories } = stats;
  const totalProducts = stats.totalProducts;
  const overallAvgScore = (
    categories.reduce((s, c) => s + c.avgScore * c.productCount, 0) / totalProducts
  ).toFixed(1);
  const overallAvgEmissions = (
    categories.reduce((s, c) => s + c.avgEmissions * c.productCount, 0) / totalProducts
  ).toFixed(2);
  const bestCategory = categories[0];
  const greenCount = categories.reduce((sum, c) => {
    if (c.avgScore >= 7) return sum + c.productCount;
    return sum;
  }, 0);

  const scoreChartData = categories.map((c) => ({
    name: c.category,
    icon: CATEGORY_ICONS[c.category] || "",
    score: c.avgScore,
    fill: c.avgScore >= 7 ? "#2d6a4f" : c.avgScore >= 4 ? "#e9c46a" : "#e63946",
  }));

  const emissionsChartData = categories.map((c) => ({
    name: c.category,
    emissions: c.avgEmissions,
  }));

  const pieData = categories.map((c) => ({
    name: c.category,
    value: c.productCount,
  }));

  const radarData = categories.map((c) => ({
    category: c.category.length > 8 ? c.category.slice(0, 8) + "..." : c.category,
    score: c.avgScore,
    fullMark: 10,
  }));

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
          padding: "36px 24px 44px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{"\uD83D\uDCCA"}</div>
        <h1
          style={{
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            marginBottom: 6,
          }}
        >
          Sustainability Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
          Insights across {totalProducts} products and {categories.length} categories.
        </p>
      </div>

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
          <StatCard icon={"\uD83C\uDF3F"} label="Total Products" value={totalProducts} />
          <StatCard
            icon={"\u2B50"}
            label="Avg GreenGrade"
            value={overallAvgScore}
            subtext="out of 10"
            color={parseFloat(overallAvgScore) >= 7 ? "#2d6a4f" : "#e9c46a"}
          />
          <StatCard
            icon={"\uD83C\uDF0D"}
            label="Avg Emissions"
            value={overallAvgEmissions}
            subtext="kg CO\u2082e per product"
          />
          <StatCard
            icon={"\uD83C\uDFC6"}
            label="Best Category"
            value={bestCategory.category}
            subtext={`Score: ${bestCategory.avgScore}`}
          />
        </div>

        {/* Score by Category Chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
            marginBottom: 16,
            animation: "fadeInUp 0.4s ease 0.1s both",
          }}
        >
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 4 }}>
            Average GreenGrade by Category
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
            Higher scores indicate more sustainable products.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                height={70}
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
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
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
              animation: "fadeInUp 0.4s ease 0.15s both",
            }}
          >
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 4 }}>
              Average Emissions
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
              kg CO{"\u2082"}e per product by category.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={emissionsChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
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
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
              animation: "fadeInUp 0.4s ease 0.2s both",
            }}
          >
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 4 }}>
              Product Distribution
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
              Number of products by category.
            </p>
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
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
            marginBottom: 16,
            animation: "fadeInUp 0.4s ease 0.25s both",
          }}
        >
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 4 }}>
            Category Score Radar
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
            Visual overview of sustainability scores across categories.
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: "#555" }} />
              <Radar
                name="Avg Score"
                dataKey="score"
                stroke="#2d6a4f"
                fill="#52b788"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 2px 8px rgba(27,67,50,0.06)",
            animation: "fadeInUp 0.4s ease 0.3s both",
          }}
        >
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 4 }}>
            Top 10 Greenest Products
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: 16 }}>
            Products with the highest GreenGrade scores.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #edf7f0" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    #
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    Brand
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    Category
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    Score
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 8px",
                      color: "#2d6a4f",
                      fontWeight: 700,
                    }}
                  >
                    CO{"\u2082"}e
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: "1px solid #f5f5f5", transition: "background 0.15s" }}
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
                    <td style={{ padding: "10px 8px", fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: "10px 8px", color: "#666" }}>{p.brand}</td>
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
                          background: p.greenGrade.score >= 7 ? "#edf7f0" : "#fff8e1",
                          color: p.greenGrade.score >= 7 ? "#2d6a4f" : "#b45309",
                        }}
                      >
                        {p.greenGrade.score}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: "#666" }}>
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
