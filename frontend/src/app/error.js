"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }} role="alert">
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            marginBottom: 8,
            color: "#1a1a2e",
          }}
        >
          Something went wrong
        </h2>
        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.6 }}>
          {error?.message || "An unexpected error occurred."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
