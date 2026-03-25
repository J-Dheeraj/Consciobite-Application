import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchProducts } from "../services/api";
import { scoreColor } from "../utils/constants";
import { useTheme } from "../context/ThemeContext";

export default function Home() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
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

  const bg = isDark ? "#0a0a0a" : "#fafafa";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textPrimary = isDark ? "#ededed" : "#111";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "#666";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "#999";
  const accent = "#2d6a4f";

  const features = [
    {
      title: "GreenGrade Ratings",
      desc: "Every product scored on nutrition, environmental impact, and sustainability. Shop with confidence.",
    },
    {
      title: "Carbon Tracker",
      desc: "Track your food-related carbon emissions with personalized insights and weekly reduction goals.",
    },
    {
      title: "Smart Comparisons",
      desc: "Compare products side-by-side to instantly find healthier, greener alternatives.",
    },
    {
      title: "Eco-Friendly Recipes",
      desc: "Discover recipes that are good for you and gentle on the planet, curated by sustainability experts.",
    },
  ];

  const steps = [
    { step: "01", title: "Search", desc: "Look up any food product by name or barcode." },
    {
      step: "02",
      title: "Understand",
      desc: "See the GreenGrade score, nutrition facts, and carbon impact.",
    },
    {
      step: "03",
      title: "Choose better",
      desc: "Pick the healthiest, most sustainable option every time.",
    },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh" }}>
      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "80px 24px 88px",
          textAlign: "center",
          background: isDark
            ? "linear-gradient(180deg, #0a1f14 0%, #0a0a0a 100%)"
            : "linear-gradient(180deg, #f0faf4 0%, #fafafa 100%)",
        }}
      >
        {/* Subtle gradient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 800,
            height: 500,
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(ellipse, rgba(45,106,79,0.15) 0%, transparent 70%)"
              : "radial-gradient(ellipse, rgba(45,106,79,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: 20,
              background: isDark ? "rgba(45,106,79,0.2)" : "rgba(45,106,79,0.08)",
              color: accent,
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: 24,
            }}
          >
            Powered by GreenGrade{"\u2122"}
          </div>

          <h1
            style={{
              color: textPrimary,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 5.5vw, 3.2rem)",
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: "-0.03em",
            }}
          >
            Know what you eat.
            <br />
            Protect what matters.
          </h1>

          <p
            style={{
              color: textSecondary,
              fontSize: "clamp(1rem, 2.5vw, 1.18rem)",
              lineHeight: 1.7,
              maxWidth: 500,
              margin: "0 auto 36px",
            }}
          >
            Consciobite gives you real-time product ratings, carbon tracking, and personalized
            insights so every food choice is a smart one.
          </p>

          {/* CTA buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 40,
            }}
          >
            <button
              onClick={() => navigate("/scan")}
              style={{
                padding: "14px 36px",
                borderRadius: 10,
                border: "none",
                background: accent,
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
            >
              Try Now
            </button>
            <Link
              to="/about"
              style={{
                padding: "14px 36px",
                borderRadius: 10,
                border: `1px solid ${cardBorder}`,
                background: "transparent",
                color: textPrimary,
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                transition: "border-color 0.2s",
              }}
            >
              Learn More
            </Link>
          </div>

          {/* Inline search widget */}
          <div
            ref={searchRef}
            role="combobox"
            aria-expanded={hasResults}
            aria-controls="search-results"
            aria-haspopup="listbox"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            <input
              type="text"
              placeholder="Search for a product..."
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
                padding: "15px 24px",
                borderRadius: hasResults ? "12px 12px 0 0" : 12,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                fontSize: "0.95rem",
                background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                color: textPrimary,
                outline: "none",
                fontWeight: 500,
                transition: "border-radius 0.15s ease",
                boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            />
            {loading && (
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: textMuted,
                  fontSize: "0.82rem",
                }}
              >
                Searching...
              </span>
            )}

            {hasResults && (
              <div
                id="search-results"
                role="listbox"
                style={{
                  background: isDark ? "rgba(18,18,18,0.98)" : "#fff",
                  borderRadius: "0 0 12px 12px",
                  padding: "4px 0",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                  border: `1px solid ${cardBorder}`,
                  borderTop: "none",
                  position: "absolute",
                  width: "100%",
                  zIndex: 10,
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
                      padding: "11px 18px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: textPrimary,
                      transition: "background 0.12s",
                      gap: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.92rem",
                        textAlign: "left",
                        flex: 1,
                      }}
                    >
                      {p.brand} {p.name}
                    </span>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: scoreColor(p.greenGrade.score),
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {p.greenGrade.score}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "72px 24px 56px",
        }}
      >
        <p
          style={{
            textAlign: "center",
            color: accent,
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          How it works
        </p>
        <h2
          style={{
            textAlign: "center",
            color: textPrimary,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
            marginBottom: 48,
            letterSpacing: "-0.02em",
          }}
        >
          Three steps to better food choices
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 32,
          }}
        >
          {steps.map((s) => (
            <div key={s.step} style={{ textAlign: "center" }}>
              <div
                style={{
                  color: accent,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: "2.4rem",
                  opacity: 0.2,
                  marginBottom: 8,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.step}
              </div>
              <h3
                style={{
                  color: textPrimary,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  marginBottom: 8,
                }}
              >
                {s.title}
              </h3>
              <p style={{ color: textSecondary, fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          borderTop: `1px solid ${cardBorder}`,
        }}
      />

      {/* ── Features ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px" }}>
        <p
          style={{
            textAlign: "center",
            color: accent,
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Features
        </p>
        <h2
          style={{
            textAlign: "center",
            color: textPrimary,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          Everything you need to eat consciously
        </h2>
        <p
          style={{
            textAlign: "center",
            color: textSecondary,
            fontSize: "0.95rem",
            maxWidth: 460,
            margin: "0 auto 44px",
            lineHeight: 1.6,
          }}
        >
          Nutritional science, environmental data, and smart technology combined in one platform.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 14,
                padding: "28px 24px",
                transition: "box-shadow 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: accent,
                  marginBottom: 18,
                }}
              />
              <h3
                style={{
                  color: textPrimary,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: 8,
                }}
              >
                {f.title}
              </h3>
              <p style={{ color: textSecondary, fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 72px" }}>
        <div
          style={{
            background: isDark
              ? "linear-gradient(135deg, #0d2818, #1b4332)"
              : "linear-gradient(135deg, #1b4332, #2d6a4f)",
            borderRadius: 18,
            padding: "56px 32px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              color: "#fff",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)",
              marginBottom: 14,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to make better food choices?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "1rem",
              lineHeight: 1.7,
              maxWidth: 440,
              margin: "0 auto 32px",
            }}
          >
            Try our product search and discover the GreenGrade score of your favorite foods. It only
            takes a few seconds.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/scan")}
              style={{
                padding: "14px 36px",
                borderRadius: 10,
                border: "none",
                background: "#fff",
                color: "#1b4332",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try Our Product Scanner
            </button>
            <Link
              to="/dashboard"
              style={{
                padding: "14px 36px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          borderTop: `1px solid ${cardBorder}`,
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 56,
            flexWrap: "wrap",
            maxWidth: 600,
            margin: "0 auto",
          }}
        >
          {[
            { value: "1,000+", label: "Products Rated" },
            { value: "10+", label: "Categories" },
            { value: "100%", label: "Transparent Data" },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  color: textPrimary,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </div>
              <div style={{ color: textMuted, fontSize: "0.8rem", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
