/**
 * States plainly that a score is an estimate, next to the score itself.
 *
 * Scores are shown beside real brand names but are computed from published
 * lifecycle research for the product type, not from the brand's own supply
 * chain. A reader, or the brand, must not mistake one for the other.
 *
 * `tone` matches the surface it sits on: "light" for pale cards, "dark" for
 * the dark passport card.
 */
export default function EstimateNotice({ brand, tone = "light" }) {
  const dark = tone === "dark";
  return (
    <p
      role="note"
      style={{
        margin: 0,
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: "0.82rem",
        lineHeight: 1.45,
        textAlign: "left",
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(26,58,42,0.10)",
        color: dark ? "rgba(255,255,255,0.85)" : "#1a3a2a",
        border: `1px solid ${dark ? "rgba(255,255,255,0.16)" : "rgba(26,58,42,0.22)"}`,
      }}
    >
      <strong>Estimate.</strong> Based on published research for this type of product. Not measured
      from, or supplied by, {brand || "the brand"}.
    </p>
  );
}
