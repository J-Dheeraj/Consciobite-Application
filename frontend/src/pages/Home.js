import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../services/api";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeleton";
import { useTheme } from "../context/ThemeContext";

const CATEGORIES = [
  { key: "All", icon: "\uD83C\uDF0D" },
  { key: "Protein", icon: "\uD83E\uDD69" },
  { key: "Seafood", icon: "\uD83D\uDC1F" },
  { key: "Dairy & Eggs", icon: "\uD83E\uDD5B" },
  { key: "Grains", icon: "\uD83C\uDF3E" },
  { key: "Fruits", icon: "\uD83C\uDF53" },
  { key: "Vegetables", icon: "\uD83E\uDD66" },
  { key: "Beverages", icon: "\uD83E\uDDC3" },
  { key: "Snacks", icon: "\uD83C\uDF6A" },
  { key: "Pantry", icon: "\uD83C\uDF6F" },
];

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("grade_desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const loadProducts = useCallback(() => {
    setError("");
    setLoading(true);
    fetchProducts({
      search: search || undefined,
      category: category === "All" ? undefined : category,
      sort,
      page,
      limit: 20,
    })
      .then((data) => {
        setProducts(data.products);
        setPagination(data.pagination);
      })
      .catch(() => setError("Unable to load products. Please try again later."))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);
  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  // Autocomplete logic
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionsLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchProducts({ search: val, limit: 6 })
        .then((data) => {
          setSuggestions(data.products);
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestionsLoading(false));
    }, 250);
  };

  // Keyboard navigation for autocomplete
  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      setShowSuggestions(false);
      navigate(`/product/${suggestions[activeIndex].id}`);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const gradeColor = (score) => (score >= 7 ? "#2d6a4f" : score >= 4 ? "#e9c46a" : "#e63946");

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 40%, #40916c 100%)",
          padding: "40px 24px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: 8,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            {"\uD83C\uDF3F"}
          </div>
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "1.8rem",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Discover Sustainable Food
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.95rem",
              maxWidth: 420,
              margin: "0 auto 24px",
            }}
          >
            Browse 550+ products and their GreenGrade sustainability scores across Singapore.
          </p>
          {/* Search bar with autocomplete */}
          <div
            style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}
            ref={searchRef}
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-haspopup="listbox"
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1rem",
                opacity: 0.5,
                zIndex: 2,
              }}
            >
              {"\uD83D\uDD0D"}
            </span>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              aria-label="Search products"
              aria-autocomplete="list"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
              style={{
                width: "100%",
                padding: "14px 16px 14px 42px",
                borderRadius: showSuggestions && suggestions.length > 0 ? "14px 14px 0 0" : 14,
                border: "2px solid rgba(255,255,255,0.2)",
                fontSize: "0.95rem",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                backdropFilter: "blur(10px)",
                outline: "none",
                transition: "all 0.2s ease",
                position: "relative",
                zIndex: 2,
              }}
            />
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                id="search-suggestions"
                role="listbox"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  background: isDark ? "#1c2e22" : "#fff",
                  borderRadius: "0 0 14px 14px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderTop: "none",
                  maxHeight: 300,
                  overflowY: "auto",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                {suggestionsLoading && (
                  <div
                    style={{ padding: 12, textAlign: "center", color: "#888", fontSize: "0.85rem" }}
                  >
                    Searching...
                  </div>
                )}
                {suggestions.map((p, i) => (
                  <button
                    key={p.id}
                    id={`suggestion-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/product/${p.id}`);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid " + (isDark ? "#2d4a35" : "#f0f0f0"),
                      background:
                        i === activeIndex ? (isDark ? "#243a2b" : "#f5faf7") : "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      transition: "background 0.15s",
                      color: isDark ? "#e8f5e9" : "#333",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? "#243a2b" : "#f5faf7";
                      setActiveIndex(i);
                    }}
                    onMouseLeave={(e) => {
                      if (i !== activeIndex) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: isDark ? "#2d4a35" : "#edf7f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        color: gradeColor(p.greenGrade.score),
                        flexShrink: 0,
                      }}
                    >
                      {p.greenGrade.score}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                        {p.brand} {"\u00B7"} {p.category}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                      {p.greenGrade.totalEmissions} kg
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Category pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "20px 0 16px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 24,
                border:
                  category === c.key
                    ? "2px solid #2d6a4f"
                    : "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                background: category === c.key ? "#2d6a4f" : isDark ? "#1c2e22" : "#fff",
                color: category === c.key ? "#fff" : isDark ? "#b0c4b1" : "#555",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.82rem",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow:
                  category === c.key
                    ? "0 2px 8px rgba(45,106,79,0.3)"
                    : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{c.icon}</span>
              {c.key}
            </button>
          ))}
        </div>

        {/* Sort & count row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {pagination && !loading && (
            <p style={{ color: isDark ? "#7a9a7e" : "#888", fontSize: "0.85rem" }}>
              Showing {products.length} of {pagination.totalCount} products
            </p>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort products"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
              fontSize: "0.85rem",
              color: isDark ? "#b0c4b1" : "#555",
            }}
          >
            <option value="grade_desc">Best Grade First</option>
            <option value="grade_asc">Lowest Grade First</option>
            <option value="emissions_asc">Lowest Emissions First</option>
            <option value="emissions_desc">Highest Emissions First</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              color: "#e63946",
              marginBottom: 12,
              padding: 20,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 12,
              border: "1px solid #fecaca",
              animation: "fadeInUp 0.3s ease",
            }}
          >
            <p style={{ marginBottom: 8 }}>{error}</p>
            <button
              onClick={loadProducts}
              style={{
                padding: "8px 18px",
                background: "#e63946",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && <ProductListSkeleton count={8} />}

        {!loading && !error && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {products.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: "#888",
                    background: isDark ? "#1c2e22" : "#fff",
                    borderRadius: 14,
                    boxShadow: "0 1px 4px rgba(27,67,50,0.06)",
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>{"\uD83D\uDD0D"}</div>
                  No products found. Try adjusting your search or filters.
                </div>
              )}
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} delay={Math.min(i * 30, 300)} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 28,
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  aria-label="Previous page"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: pagination.hasPrev ? "#2d6a4f" : isDark ? "#2d4a35" : "#e8e8e8",
                    color: pagination.hasPrev ? "#fff" : "#aaa",
                    cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    fontSize: "0.88rem",
                    color: isDark ? "#7a9a7e" : "#666",
                    fontWeight: 500,
                  }}
                >
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  aria-label="Next page"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: pagination.hasNext ? "#2d6a4f" : isDark ? "#2d4a35" : "#e8e8e8",
                    color: pagination.hasNext ? "#fff" : "#aaa",
                    cursor: pagination.hasNext ? "pointer" : "not-allowed",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
