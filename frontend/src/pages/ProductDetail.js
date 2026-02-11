import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import GradeBadge from "../components/GradeBadge";
import GradeBreakdown from "../components/GradeBreakdown";

function isFavorited(id) {
  try {
    return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]").includes(id);
  } catch {
    return false;
  }
}

function toggleFavorite(id) {
  try {
    const favs = JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    localStorage.setItem("consciobite_favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return next.includes(id);
  } catch {
    return false;
  }
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setError("");
    setLoading(true);
    fetchProduct(id)
      .then((data) => {
        setProduct(data);
        setFav(isFavorited(data.id));
      })
      .catch(() => setError("Unable to load product details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#888" }}>
        <div style={{
          width: 32,
          height: 32,
          border: "3px solid #e0e0e0",
          borderTopColor: "#2d6a4f",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        Loading product...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
        <Link to="/" style={{ fontSize: "0.85rem" }}>&larr; Back to products</Link>
        <div style={{
          marginTop: 16,
          padding: 24,
          background: "#fef2f2",
          borderRadius: 12,
          border: "1px solid #fecaca",
          color: "#e63946",
          textAlign: "center",
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const { greenGrade } = product;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <Link to="/" style={{ fontSize: "0.85rem" }}>&larr; Back to products</Link>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginTop: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
          <GradeBadge score={greenGrade.score} color={greenGrade.color} size="large" />
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: 2 }}>{product.name}</h2>
            <div style={{ color: "#666", fontSize: "0.9rem" }}>
              {product.brand} &middot; {product.category}
            </div>
          </div>
          <button
            onClick={() => setFav(toggleFavorite(product.id))}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            title={fav ? "Remove from favorites" : "Add to favorites"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: fav ? "#e63946" : "#ccc",
              flexShrink: 0,
              transition: "color 0.2s",
            }}
          >
            {fav ? "\u2665" : "\u2661"}
          </button>
        </div>

        <p style={{ marginBottom: 16, fontSize: "0.9rem" }}>{product.description}</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            style={{
              background: "none",
              border: "1px solid #2d6a4f",
              color: "#2d6a4f",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            {showBreakdown ? "Hide" : "Show"} Emissions Breakdown
          </button>
        </div>

        {showBreakdown && (
          <GradeBreakdown
            breakdown={greenGrade.breakdown}
            totalEmissions={greenGrade.totalEmissions}
          />
        )}

        {product.purchaseLinks && product.purchaseLinks.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ marginBottom: 8 }}>Buy This Product</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {product.purchaseLinks.map((link) => (
                <a
                  key={link.seller}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 14px",
                    background: "#2d6a4f",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: "0.85rem",
                  }}
                >
                  {link.seller}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
