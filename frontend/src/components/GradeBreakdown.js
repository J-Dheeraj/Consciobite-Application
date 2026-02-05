import React from "react";

const barColor = (score) => {
  if (score >= 7) return "#2d6a4f";
  if (score >= 4) return "#e9c46a";
  return "#e63946";
};

export default function GradeBreakdown({ breakdown, totalEmissions }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ marginBottom: 8 }}>
        Emissions Breakdown (Total: {totalEmissions} kg CO₂e/kg)
      </h4>
      {breakdown.map((b) => (
        <div key={b.category} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span>{b.category}</span>
            <span>{b.emission} / {b.maxReference} kg CO₂e</span>
          </div>
          <div style={{ background: "#ddd", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min((b.emission / b.maxReference) * 100, 100)}%`,
                height: "100%",
                backgroundColor: barColor(b.categoryScore),
                borderRadius: 4,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
