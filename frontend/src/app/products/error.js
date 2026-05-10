"use client";

export default function ProductsError({ error, reset }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }} role="alert">
      <h2 style={{ fontWeight: 700, marginBottom: 8 }}>Failed to load products</h2>
      <p style={{ color: "#888", marginBottom: 20 }}>{error?.message}</p>
      <button
        onClick={reset}
        style={{
          padding: "12px 28px",
          background: "#2d6a4f",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  );
}
