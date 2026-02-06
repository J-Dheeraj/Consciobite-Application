import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProduct } from "../services/api";
import GradeBadge from "../components/GradeBadge";
import GradeBreakdown from "../components/GradeBreakdown";
import { getProductImageLarge } from "../utils/productImage";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError("Unable to load product details."));
  }, [id]);

  if (error) return <div style={{ padding: 24, color: "#e63946" }}>{error}</div>;
  if (!product) return <div style={{ padding: 24 }}>Loading...</div>;

  const { greenGrade } = product;
  const imageUrl = getProductImageLarge(product);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <Link to="/" style={{ fontSize: "0.85rem" }}>&larr; Back to products</Link>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginTop: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: "100%",
              maxWidth: 280,
              height: "auto",
              borderRadius: 12,
              objectFit: "cover",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
          <GradeBadge score={greenGrade.score} color={greenGrade.color} size="large" />
          <div>
            <h2 style={{ marginBottom: 2 }}>{product.name}</h2>
            <div style={{ color: "#666", fontSize: "0.9rem" }}>
              {product.brand} &middot; {product.category}
            </div>
          </div>
        </div>

        <p style={{ marginBottom: 16, fontSize: "0.9rem" }}>{product.description}</p>

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
            marginBottom: 12,
          }}
        >
          {showBreakdown ? "Hide" : "Show"} Emissions Breakdown
        </button>

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
