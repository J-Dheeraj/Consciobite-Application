// Shared page-level style helpers. Each returns a plain style object so
// callers can spread and override. Only add a helper here when a pattern
// appears in 3+ places — otherwise keep it inline at the call site.

export const pageContainer = (maxWidth = 700) => ({
  maxWidth,
  margin: "0 auto",
  padding: "0 20px 40px",
});

export const card = (isDark, { radius = 14, padding } = {}) => ({
  background: isDark ? "#162419" : "#fff",
  borderRadius: radius,
  boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
  ...(padding !== undefined && { padding }),
});

// `loading` collapses the gradient to a flat green + switches cursor to wait.
export const primaryButton = ({ loading = false, width } = {}) => ({
  padding: "12px 24px",
  background: loading ? "#95d5b2" : "linear-gradient(135deg, #2d6a4f, #40916c)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  cursor: loading ? "wait" : "pointer",
  fontWeight: 600,
  boxShadow: "0 2px 8px rgba(45,106,79,0.3)",
  transition: "all 0.2s ease",
  ...(width !== undefined && { width }),
});

// `fullWidth: true` is needed when the input is the only child of a label;
// omit for flex layouts where the parent sizes the input.
export const inputField = (isDark, { radius = 12, fullWidth = false } = {}) => ({
  padding: "12px 14px",
  borderRadius: radius,
  border: `2px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
  fontSize: "0.95rem",
  transition: "border-color 0.2s",
  ...(fullWidth && { width: "100%", boxSizing: "border-box" }),
});

export const errorAlert = (isDark) => ({
  color: "#e63946",
  padding: 14,
  background: isDark ? "#2a1519" : "#fef2f2",
  borderRadius: 10,
  border: "1px solid #fecaca",
});

export const heading = (fontSize = "1.25rem") => ({
  fontFamily: "'Outfit', sans-serif",
  fontWeight: 700,
  fontSize,
});

export const formLabel = (isDark) => ({
  fontSize: "0.85rem",
  fontWeight: 600,
  color: isDark ? "#b0c4b1" : "#555",
  marginBottom: 6,
  display: "block",
});
