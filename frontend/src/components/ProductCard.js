import React from "react";
import { Link } from "react-router-dom";
import GradeBadge from "./GradeBadge";
import { getProductImage } from "../utils/productImage";

export default function ProductCard({ product }) {
  const { greenGrade } = product;
  const imageUrl = getProductImage(product);

  return (
    <Link
      to={`/product/${product.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 0.2s",
      }}
    >
      <img
        src={imageUrl}
        alt={product.name}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      <GradeBadge score={greenGrade.score} color={greenGrade.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{product.name}</div>
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          {product.brand} &middot; {product.category}
        </div>
      </div>
      <div style={{ fontSize: "0.8rem", color: "#888" }}>
        {greenGrade.totalEmissions} kg CO₂e
      </div>
    </Link>
  );
}
