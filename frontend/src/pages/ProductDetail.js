import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import GradeBadge from "../components/GradeBadge";
import GradeBreakdown from "../components/GradeBreakdown";

function isFavorited(id) {
  try { return JSON.parse(localStorage.getItem("consciobite_favorites") || "[]").includes(id); }
  catch { return false; }
}

function toggleFavorite(id) {
  try {
    const favs = JSON.parse(localStorage.getItem("consciobite_favorites") || "[]");
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    localStorage.setItem("consciobite_favorites", JSON.stringify(next));
    window.dispatchEvent(new Event("favorites-updated"));
    return next.includes(id);
  } catch { return false; }
}

const CATEGORY_ICONS = {
  Protein: "\uD83E\uDD69", Seafood: "\uD83D\uDC1F", "Dairy & Eggs": "\uD83E\uDD5B",
  Grains: "\uD83C\uDF3E", Fruits: "\uD83C\uDF53", Vegetables: "\uD83E\uDD66",
  Beverages: "\uD83E\uDDC3", Snacks: "\uD83C\uDF6A", Pantry: "\uD83C\uDF6F",
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setError("");
    setLoading(true);
    fetchProduct(id)
      .then((data) => { setProduct(data); setFav(isFavorited(data.id)); })
      .catch(() => setError("Unable to load product details."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #d8f3dc", borderTopColor: "#2d6a4f", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        Loading product...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, animation: "fadeIn 0.3s ease" }}>
        <Link to="/" style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6 }}>{"\u2190"} Back to products</Link>
        <div style={{ marginTop: 16, padding: 24, background: "#fef2f2", borderRadius: 14, border: "1px solid #fecaca", color: "#e63946", textAlign: "center" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!product) return null;

  const { greenGrade } = product;
  const catIcon = CATEGORY_ICONS[product.category] || "\uD83C\uDF3F";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Product hero */}
      <div style={{
        background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
        padding: "20px 24px 36px",
        position: "relative",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Link to="/" style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            {"\u2190"} Back to products
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <GradeBadge score={greenGrade.score} color={greenGrade.color} size="large" />
            <div style={{ flex: 1 }}>
              <h2 style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.5rem", marginBottom: 4 }}>{product.name}</h2>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                {product.brand}
                <span style={{ padding: "2px 10px", borderRadius: 20, background: "rgba(255,255,255,0.15)", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>{catIcon}</span> {product.category}
                </span>
              </div>
            </div>
            <button onClick={() => setFav(toggleFavorite(product.id))}
              aria-label={fav ? "Remove from favorites" : "Add to favorites"}
              title={fav ? "Remove from favorites" : "Add to favorites"}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", fontSize: "1.5rem", color: fav ? "#e63946" : "rgba(255,255,255,0.5)", flexShrink: 0, transition: "all 0.2s ease", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {fav ? "\u2665" : "\u2661"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Description */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginTop: -20, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", animation: "fadeInUp 0.4s ease" }}>
          <p style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.7 }}>{product.description}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#edf7f0", fontSize: "0.82rem", color: "#2d6a4f", fontWeight: 600 }}>
              Score: {greenGrade.score}/10
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#edf7f0", fontSize: "0.82rem", color: "#2d6a4f", fontWeight: 600 }}>
              {greenGrade.totalEmissions} kg CO&#8322;e/kg
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginTop: 16, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", animation: "fadeInUp 0.4s ease 0.1s both" }}>
          <h3 style={{ marginBottom: 4, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Supply Chain Breakdown</h3>
          <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: 16 }}>
            Score per stage of the supply chain, weighted by environmental significance.
          </p>
          <GradeBreakdown breakdown={greenGrade.breakdown} totalEmissions={greenGrade.totalEmissions} totalScore={greenGrade.score} />
        </div>

        {/* Purchase links */}
        {product.purchaseLinks && product.purchaseLinks.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginTop: 16, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", animation: "fadeInUp 0.4s ease 0.2s both" }}>
            <h4 style={{ marginBottom: 10, fontFamily: "'Outfit', sans-serif" }}>Buy This Product</h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {product.purchaseLinks.map((link) => (
                <a key={link.seller} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: "10px 20px", background: "linear-gradient(135deg, #2d6a4f, #40916c)", color: "#fff", borderRadius: 10, fontSize: "0.88rem", textDecoration: "none", fontWeight: 600, transition: "all 0.2s ease", boxShadow: "0 2px 8px rgba(45,106,79,0.3)" }}>
                  {link.seller} {"\u2192"}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
