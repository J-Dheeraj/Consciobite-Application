import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { scoreColor } from "../utils/constants";
import MarketIllustration from "../components/MarketIllustration";

/* Decorative green blob for top-left corner */
function GreenBlob() {
  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, width: 180, height: 200, zIndex: 0 }}
      viewBox="0 0 180 200"
      aria-hidden="true"
    >
      <circle cx="-10" cy="-10" r="140" fill="#1a7a42" opacity="0.7" />
      <ellipse cx="50" cy="60" rx="70" ry="80" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

/* Consciobite pot logo matching the mockup */
function ConsciobiteLogo() {
  return (
    <svg viewBox="0 0 64 64" width="56" height="56">
      {/* Pot */}
      <rect x="16" y="34" width="32" height="22" rx="4" fill="#1a5e35" />
      <rect x="12" y="30" width="40" height="8" rx="3" fill="#2d8a4e" />
      {/* Soil */}
      <ellipse cx="32" cy="36" rx="14" ry="3" fill="#3d2b1f" />
      {/* Plant stems */}
      <line x1="32" y1="32" x2="32" y2="14" stroke="#52b788" strokeWidth="2.5" />
      <line x1="32" y1="22" x2="24" y2="14" stroke="#52b788" strokeWidth="2" />
      <line x1="32" y1="22" x2="40" y2="14" stroke="#52b788" strokeWidth="2" />
      {/* Leaves */}
      <ellipse cx="24" cy="13" rx="6" ry="4" fill="#52b788" transform="rotate(-30, 24, 13)" />
      <ellipse cx="40" cy="13" rx="6" ry="4" fill="#74c69d" transform="rotate(30, 40, 13)" />
      <ellipse cx="32" cy="10" rx="5" ry="4" fill="#52b788" />
      {/* Pot detail */}
      <rect x="22" y="42" width="20" height="3" rx="1" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      fetchProducts({ search: val, limit: 8 })
        .then((data) => {
          setResults(data.products);
          setShowResults(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && search.trim().length >= 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setLoading(true);
      fetchProducts({ search, limit: 8 })
        .then((data) => {
          setResults(data.products);
          setShowResults(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }
  };

  // Close results on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = showResults && results.length > 0;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background:
          "linear-gradient(180deg, #0d1f17 0%, #0d2818 12%, #1a5e3a 35%, #4a8b6b 65%, #6d9e80 100%)",
        position: "relative",
        overflow: "hidden",
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Green blob decoration */}
      <GreenBlob />

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 20px 32px",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <ConsciobiteLogo />
          <h1
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.3rem",
              marginTop: 4,
              letterSpacing: "-0.01em",
            }}
          >
            Consciobite
          </h1>
        </div>

        {/* Market Illustration - only show when not searching */}
        {!hasResults && (
          <div style={{ marginBottom: 20, width: "100%", maxWidth: 320 }}>
            <MarketIllustration />
          </div>
        )}

        {/* Search bar */}
        <div
          ref={searchRef}
          role="combobox"
          aria-expanded={hasResults}
          aria-controls="search-results"
          aria-haspopup="listbox"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 380,
            marginBottom: hasResults ? 0 : 8,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1rem",
              zIndex: 2,
              opacity: 0.8,
            }}
          >
            {"\uD83D\uDD0D"}
          </span>
          <input
            type="text"
            placeholder="Search for Product..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) setShowResults(true);
            }}
            aria-label="Search products"
            aria-autocomplete="list"
            style={{
              width: "100%",
              padding: "14px 48px 14px 44px",
              borderRadius: hasResults ? "22px 22px 0 0" : 28,
              border: "none",
              fontSize: "0.95rem",
              background: "#27ae60",
              color: "#fff",
              outline: "none",
              fontWeight: 500,
              transition: "border-radius 0.2s ease",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1rem",
              zIndex: 2,
              opacity: 0.6,
            }}
          >
            {"\uD83C\uDF99\uFE0F"}
          </span>

          {/* Search results panel */}
          {hasResults && (
            <div
              id="search-results"
              role="listbox"
              style={{
                background: "rgba(30, 100, 60, 0.85)",
                backdropFilter: "blur(12px)",
                borderRadius: "0 0 18px 18px",
                padding: "8px 0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                animation: "fadeIn 0.15s ease",
              }}
            >
              {results.map((p) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    setShowResults(false);
                    navigate(`/product/${p.id}`);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 18px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "#fff",
                    transition: "background 0.15s",
                    gap: 12,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {p.brand} {p.name}
                  </span>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: scoreColor(p.greenGrade.score),
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    {p.greenGrade.score}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Powered by GreenGrade */}
        {!hasResults && (
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.78rem",
              marginBottom: 16,
              letterSpacing: "0.03em",
            }}
          >
            Powered by GreenGrade{"\u2122"}
          </p>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginTop: 12 }}>
            Searching...
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Motivational message */}
        <div
          style={{
            textAlign: "center",
            maxWidth: 300,
            marginBottom: 28,
            padding: "0 16px",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              margin: "0 auto 12px",
            }}
          />
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Choose a product and our latest GreenGrade rating will show you which product is the
            best for you!
          </p>
        </div>

        {/* Bottom action buttons */}
        <div style={{ display: "flex", gap: 20, width: "100%", maxWidth: 380, padding: "0 16px" }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: "#27ae60",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
            }}
          >
            Home
          </button>
          <button
            onClick={() => navigate("/about")}
            style={{
              flex: 1,
              padding: "13px 0",
              borderRadius: 10,
              border: "none",
              background: "#27ae60",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 12px rgba(39,174,96,0.3)",
            }}
          >
            About Us
          </button>
        </div>
      </div>
    </div>
  );
}
