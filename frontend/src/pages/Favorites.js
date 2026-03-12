import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import ProductCard from "../components/ProductCard";
import { useTheme } from "../context/ThemeContext";
import { getFavoriteIds, clearFavorites } from "../utils/favorites";

export default function Favorites() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const ids = getFavoriteIds();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => fetchProduct(id).catch(() => null)))
      .then((results) => setProducts(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  const handleClearAll = () => {
    clearFavorites();
    setProducts([]);
    setShowConfirm(false);
  };

  if (loading) {
    return (
      <div
        style={{ maxWidth: 700, margin: "0 auto", padding: 48, textAlign: "center", color: "#888" }}
      >
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
        Loading favorites...
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div
        style={{
          background: "#0d2818",
          padding: "36px 24px 44px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{"\u2665"}</div>
        <h1
          style={{
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            marginBottom: 6,
          }}
        >
          My Favorites
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
          Products you've saved for quick access.
        </p>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 40px" }}>
        {products.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0 8px",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: isDark ? "#7a9a7e" : "#888" }}>
              {products.length} saved product{products.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: "8px 16px",
                background: "none",
                border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.82rem",
                color: isDark ? "#7a9a7e" : "#888",
                transition: "all 0.2s ease",
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.2s ease",
              padding: 20,
            }}
            onClick={() => setShowConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#162419" : "#fff",
                borderRadius: 16,
                padding: 28,
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                maxWidth: 360,
                width: "100%",
                animation: "fadeInUp 0.25s ease",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{"\u26A0\uFE0F"}</div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  marginBottom: 8,
                  color: isDark ? "#e8f5e9" : "#1a1a2e",
                }}
              >
                Clear all favorites?
              </h3>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: isDark ? "#7a9a7e" : "#888",
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                This will remove all {products.length} saved products. This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  style={{
                    padding: "10px 24px",
                    background: isDark ? "#1c2e22" : "#f0f0f0",
                    color: isDark ? "#b0c4b1" : "#555",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: "10px 24px",
                    background: "#e63946",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              marginTop: -20,
              background: isDark ? "#162419" : "#fff",
              borderRadius: 14,
              boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
              animation: "fadeInUp 0.4s ease",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>{"\u2661"}</div>
            <p
              style={{ color: isDark ? "#7a9a7e" : "#888", marginBottom: 20, fontSize: "0.95rem" }}
            >
              You haven't saved any favorites yet.
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(45,106,79,0.3)",
              }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 40} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
