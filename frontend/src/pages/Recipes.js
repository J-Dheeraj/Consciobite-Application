import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";
import { fetchRecipes } from "../services/api";
import Spinner from "../components/Spinner";
import PageHero from "../components/PageHero";

const TAG_LABELS = [
  { key: "", label: "All", icon: "🍽️" },
  { key: "quick", label: "Quick", icon: "⚡" },
  { key: "healthy", label: "Healthy", icon: "💚" },
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "high-protein", label: "Protein", icon: "💪" },
  { key: "vegetarian", label: "Veggie", icon: "🥬" },
];

export default function Recipes() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tag, setTag] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["recipes", tag],
    queryFn: () => fetchRecipes(tag || undefined),
  });
  const recipes = data?.recipes || [];

  const gradeColor = (score) => (score >= 7 ? "#2d6a4f" : score >= 4 ? "#e9c46a" : "#e63946");

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"\uD83C\uDF73"}
        title="Sustainable Recipes"
        subtitle="Delicious meals made with low-emission ingredients."
      />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Tag filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "20px 0 16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {TAG_LABELS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTag(t.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 24,
                border:
                  tag === t.key
                    ? "2px solid #2d6a4f"
                    : "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                background: tag === t.key ? "#2d6a4f" : isDark ? "#1c2e22" : "#fff",
                color: tag === t.key ? "#fff" : isDark ? "#b0c4b1" : "#555",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.82rem",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner message="Loading recipes..." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                  animation: "fadeInUp 0.4s ease",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Recipe header */}
                <button
                  onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                  aria-expanded={expandedId === recipe.id}
                  aria-label={`${expandedId === recipe.id ? "Collapse" : "Expand"} ${recipe.name}`}
                  style={{
                    width: "100%",
                    padding: "18px 20px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}
                    >
                      <h3
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: isDark ? "#e8f5e9" : "#333",
                          margin: 0,
                        }}
                      >
                        {recipe.name}
                      </h3>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 8,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: gradeColor(recipe.sustainabilityScore) + "22",
                          color: gradeColor(recipe.sustainabilityScore),
                        }}
                      >
                        {recipe.sustainabilityScore}/10
                      </span>
                    </div>
                    <p
                      style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888", margin: 0 }}
                    >
                      {recipe.description}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                        {"⏱"} {recipe.prepTime} prep · {recipe.cookTime} cook
                      </span>
                      <span style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                        {"👥"} {recipe.servings} servings
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      color: isDark ? "#7a9a7e" : "#aaa",
                      marginLeft: 12,
                      transition: "transform 0.2s",
                      transform: expandedId === recipe.id ? "rotate(180deg)" : "none",
                    }}
                  >
                    {"\u25BC"}
                  </span>
                </button>

                {/* Expanded content */}
                {expandedId === recipe.id && (
                  <div
                    style={{
                      padding: "0 20px 20px",
                      borderTop: "1px solid " + (isDark ? "#2d4a35" : "#f0f0f0"),
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    {/* Green Ingredients */}
                    <h4
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        margin: "16px 0 8px",
                        color: isDark ? "#95d5b2" : "#2d6a4f",
                      }}
                    >
                      {"🌿"} Recommended Green Ingredients
                    </h4>
                    {Object.entries(recipe.ingredients).map(([category, items]) => (
                      <div key={category} style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: isDark ? "#b0c4b1" : "#666",
                            marginBottom: 4,
                          }}
                        >
                          {category}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {items.map((item) => (
                            <Link
                              key={item.id}
                              to={`/product/${item.id}`}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: "0.78rem",
                                textDecoration: "none",
                                background: isDark ? "#1c2e22" : "#edf7f0",
                                color: isDark ? "#95d5b2" : "#2d6a4f",
                                fontWeight: 500,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                border: "1px solid " + (isDark ? "#2d4a35" : "#d8f3dc"),
                                transition: "all 0.2s",
                              }}
                            >
                              {item.name}
                              <span style={{ fontWeight: 700, color: gradeColor(item.score) }}>
                                {item.score}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Instructions */}
                    <h4
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        margin: "16px 0 8px",
                        color: isDark ? "#95d5b2" : "#2d6a4f",
                      }}
                    >
                      {"📋"} Steps
                    </h4>
                    <ol style={{ paddingLeft: 20, margin: 0 }}>
                      {recipe.instructions.map((step, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.85rem",
                            color: isDark ? "#b0c4b1" : "#555",
                            marginBottom: 6,
                            lineHeight: 1.6,
                          }}
                        >
                          {step}
                        </li>
                      ))}
                    </ol>

                    {/* Tags */}
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      {recipe.tags.map((t) => (
                        <span
                          key={t}
                          onClick={() => setTag(t)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: isDark ? "#1c2e22" : "#f5faf7",
                            color: isDark ? "#7a9a7e" : "#888",
                            border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
