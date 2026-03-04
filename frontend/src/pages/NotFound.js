import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "4rem",
            marginBottom: 16,
            animation: "float 3s ease-in-out infinite",
            opacity: 0.9,
          }}
        >
          {"\uD83C\uDF43"}
        </div>
        <div
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: "4rem",
            color: "rgba(255,255,255,0.2)",
            marginBottom: 8,
          }}
        >
          404
        </div>
        <h1
          style={{
            color: "#fff",
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1.5rem",
            marginBottom: 8,
          }}
        >
          Page Not Found
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, fontSize: "0.95rem" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "#fff",
            color: "#2d6a4f",
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
