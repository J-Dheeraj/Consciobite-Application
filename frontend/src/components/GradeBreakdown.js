import React from "react";

const scoreColor = (score) => {
  if (score >= 7) return "#2d6a4f";
  if (score >= 4) return "#e9c46a";
  return "#e63946";
};

const scoreLabel = (score) => {
  if (score >= 7) return "Low Impact";
  if (score >= 4) return "Moderate";
  return "High Impact";
};

const scoreBg = (score) => {
  if (score >= 7) return "#e8f5e9";
  if (score >= 4) return "#fff8e1";
  return "#fef2f2";
};

export default function GradeBreakdown({ breakdown, totalEmissions, totalScore }) {
  const totalMax = breakdown.reduce((sum, b) => sum + b.maxReference, 0);

  const enriched = breakdown.map((b) => {
    const weight = b.maxReference / totalMax;
    const contribution = Math.round(b.categoryScore * weight * 100) / 100;
    return { ...b, weight, contribution };
  });

  const computedTotal = Math.round(enriched.reduce((s, b) => s + b.contribution, 0) * 10) / 10;

  return (
    <div>
      {/* Supply chain flow header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
        flexWrap: "wrap",
        fontSize: "0.75rem",
        color: "#888",
      }}>
        {breakdown.map((b, i) => (
          <React.Fragment key={b.category}>
            <span style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: scoreBg(b.categoryScore),
              color: scoreColor(b.categoryScore),
              fontWeight: 600,
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
            }}>
              {b.category}
            </span>
            {i < breakdown.length - 1 && <span style={{ color: "#ccc" }}>&rarr;</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Category detail cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {enriched.map((b) => (
          <div
            key={b.category}
            style={{
              border: "1px solid #e8e8e8",
              borderRadius: 10,
              padding: "12px 16px",
              background: "#fafafa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              {/* Category score badge */}
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: scoreColor(b.categoryScore),
                color: b.categoryScore >= 4 && b.categoryScore < 7 ? "#1a1a2e" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
                title={`${b.category} score: ${b.categoryScore}/10`}
              >
                {b.categoryScore}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{b.category}</span>
                  <span style={{
                    fontSize: "0.75rem",
                    color: scoreColor(b.categoryScore),
                    fontWeight: 600,
                  }}>
                    {scoreLabel(b.categoryScore)}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>
                  {b.emission} kg CO&#8322;e of {b.maxReference} max
                </div>
              </div>
            </div>

            {/* Emissions bar */}
            <div style={{ background: "#e0e0e0", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min((b.emission / b.maxReference) * 100, 100)}%`,
                  height: "100%",
                  backgroundColor: scoreColor(b.categoryScore),
                  borderRadius: 4,
                  transition: "width 0.3s",
                }}
              />
            </div>

            {/* Contribution to total */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: "0.75rem",
              color: "#999",
            }}>
              <span>Weight: {Math.round(b.weight * 100)}%</span>
              <span>Contributes <strong style={{ color: "#555" }}>+{b.contribution}</strong> to total</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sum total row */}
      <div style={{
        marginTop: 16,
        padding: "14px 16px",
        background: "#f0f7f2",
        borderRadius: 10,
        border: "2px solid #2d6a4f",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1a1a2e" }}>
              Total GreenGrade
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 2 }}>
              Sum of all weighted category scores
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontWeight: 700,
              fontSize: "1.5rem",
              color: scoreColor(totalScore || computedTotal),
            }}>
              {totalScore || computedTotal}<span style={{ fontSize: "0.85rem", color: "#888" }}> / 10</span>
            </div>
          </div>
        </div>

        {/* Visual sum */}
        <div style={{
          display: "flex",
          gap: 4,
          marginTop: 10,
          fontSize: "0.75rem",
          color: "#666",
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          {enriched.map((b, i) => (
            <React.Fragment key={b.category}>
              <span style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: "#fff",
                border: `1px solid ${scoreColor(b.categoryScore)}`,
                color: scoreColor(b.categoryScore),
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}>
                {b.contribution}
              </span>
              {i < enriched.length - 1 && <span>+</span>}
            </React.Fragment>
          ))}
          <span>=</span>
          <span style={{
            padding: "2px 8px",
            borderRadius: 4,
            background: scoreColor(totalScore || computedTotal),
            color: (totalScore || computedTotal) >= 4 && (totalScore || computedTotal) < 7 ? "#1a1a2e" : "#fff",
            fontWeight: 700,
          }}>
            {totalScore || computedTotal}
          </span>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 8 }}>
          Total emissions: <strong>{totalEmissions} kg CO&#8322;e/kg</strong>
        </div>
      </div>
    </div>
  );
}
