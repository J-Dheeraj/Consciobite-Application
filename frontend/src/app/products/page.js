"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchProducts, fetchProductSuggestions } from "@/services/api";
import { scoreColor } from "@/utils/constants";
import { useTheme } from "@/context/ThemeContext";

const CATEGORIES = [
  "All",
  "Beverages",
  "Dairy & Eggs",
  "Fruits",
  "Grains",
  "Pantry",
  "Protein",
  "Seafood",
  "Snacks",
  "Vegetables",
];

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "grade_desc", label: "GreenGrade: High to Low" },
  { value: "grade_asc", label: "GreenGrade: Low to High" },
  { value: "emissions_asc", label: "Emissions: Low to High" },
  { value: "emissions_desc", label: "Emissions: High to Low" },
];

export default function Products() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestDebounceRef = useRef(null);
  const searchWrapperRef = useRef(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 24 };
      if (search.trim()) params.search = search.trim();
      if (category !== "All") params.category = category;
      if (sort) params.sort = sort;
      const data = await fetchProducts(params);
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearch(val);
    setActiveSuggestion(-1);
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchProductSuggestions(val.trim());
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }

  function handleSearchKeyDown(e) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      router.push(`/product/${suggestions[activeSuggestion].id}`);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  }

  const bg = isDark ? "#0a0a0a" : "#f8f9fa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "#ededed" : "#1a1a2e";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#555";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#888";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <div style={{ background: bg, minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              color: textPrimary,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            Browse Products
          </h1>
          <p style={{ color: textSecondary, fontSize: "0.95rem" }}>
            Explore GreenGrade scores across {products.length > 0 ? "500+" : "all"} food products
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
            alignItems: "center",
          }}
        >
          <div ref={searchWrapperRef} style={{ flex: "1 1 240px", position: "relative" }}>
            <input
              type="text"
              role="combobox"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="product-suggestions-list"
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: textPrimary,
                fontSize: "0.9rem",
                outline: "none",
                fontWeight: 500,
                boxSizing: "border-box",
              }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                id="product-suggestions-list"
                role="listbox"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  zIndex: 100,
                  background: cardBg,
                  border: `1.5px solid ${inputBorder}`,
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  listStyle: "none",
                  margin: 0,
                  padding: "6px 0",
                  overflow: "hidden",
                }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s.id}
                    role="option"
                    aria-selected={i === activeSuggestion}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      router.push(`/product/${s.id}`);
                      setShowSuggestions(false);
                    }}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      cursor: "pointer",
                      background:
                        i === activeSuggestion
                          ? isDark
                            ? "rgba(45,106,79,0.18)"
                            : "#f0faf4"
                          : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: scoreColor(s.score || 0),
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {s.score ?? "—"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 600,
                          color: textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: textMuted }}>
                        {s.brand} &middot; {s.category}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              border: `1.5px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "11px 16px",
              borderRadius: 10,
              border: `1.5px solid ${inputBorder}`,
              background: inputBg,
              color: textPrimary,
              fontSize: "0.9rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: 10,
              background: isDark ? "rgba(231,76,60,0.15)" : "#fef2f2",
              color: "#e74c3c",
              marginBottom: 20,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 48, textAlign: "center", color: textMuted }}>
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
            Loading products...
          </div>
        )}

        {/* No results */}
        {!loading && !error && products.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: textMuted, fontSize: "0.95rem" }}>
            No products found. Try adjusting your search or filters.
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/product/${p.id}`)}
                style={{
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: 14,
                  padding: "20px 18px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  e.currentTarget.style.borderColor = "#2d6a4f";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = cardBorder;
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: textPrimary,
                        marginBottom: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: textMuted }}>{p.brand}</div>
                  </div>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: scoreColor(p.greenGrade?.score || 0),
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginLeft: 12,
                    }}
                  >
                    {p.greenGrade?.score ?? "—"}
                  </div>
                </div>

                {p.greenGrade?.emissions && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: isDark ? "rgba(45,106,79,0.15)" : "#edf7f0",
                        color: "#2d6a4f",
                        fontWeight: 500,
                      }}
                    >
                      {p.greenGrade.emissions.total?.toFixed(1)} kg CO₂e
                    </span>
                    {p.category && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isDark ? "rgba(255,255,255,0.06)" : "#f5f5f5",
                          color: textSecondary,
                          fontWeight: 500,
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              marginTop: 32,
            }}
          >
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: page <= 1 ? textMuted : textPrimary,
                cursor: page <= 1 ? "default" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <span style={{ color: textSecondary, fontSize: "0.9rem" }}>
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: `1.5px solid ${inputBorder}`,
                background: inputBg,
                color: page >= totalPages ? textMuted : textPrimary,
                cursor: page >= totalPages ? "default" : "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
