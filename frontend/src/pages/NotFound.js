import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      maxWidth: 500,
      margin: "0 auto",
      padding: 48,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "4rem", marginBottom: 16, color: "#2d6a4f" }}>404</div>
      <h1 style={{ marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "10px 24px",
          background: "#2d6a4f",
          color: "#fff",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
