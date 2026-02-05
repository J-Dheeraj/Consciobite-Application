import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { scanBarcode } from "../services/api";
import GradeBadge from "../components/GradeBadge";

export default function Scan() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleScan = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    try {
      const data = await scanBarcode(barcode.trim());
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to scan barcode. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Scan a Product</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Enter a barcode number to instantly get the GreenGrade for any product.
      </p>

      <form onSubmit={handleScan} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter barcode (e.g. 1234567890123)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Scan
        </button>
      </form>

      {error && <p style={{ color: "#e63946" }}>{error}</p>}

      {result && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/product/${result.id}`)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <GradeBadge score={result.greenGrade.score} color={result.greenGrade.color} size="large" />
            <div>
              <h3>{result.name}</h3>
              <div style={{ color: "#666", fontSize: "0.85rem" }}>
                {result.brand} &middot; {result.category}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
                Tap to see full details
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
