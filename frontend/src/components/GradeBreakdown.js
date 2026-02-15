import React from "react";

const scoreColor = (score) => {
  if (score >= 7) return "#2d6a4f";
  if (score >= 4) return "#e9c46a";
  return "#e63946";
};

const scoreRing = (score) => {
  if (score >= 7) return "#52b788";
  if (score >= 4) return "#e9c46a";
  return "#e63946";
};

const scoreLabel = (score) => {
  if (score >= 7) return "Low Impact";
  if (score >= 4) return "Moderate";
  return "High Impact";
};

const scoreBg = (score) => {
  if (score >= 7) return "#edf7f0";
  if (score >= 4) return "#fff8e1";
  return "#fef2f2";
};

const STAGE_ICONS = {
  "Land Use Change": "\uD83C\uDF33",
  "Animal Feed": "\uD83C\uDF3E",
  Farm: "\uD83D\uDE9C",
  Processing: "\u2699\uFE0F",
  Transport: "\uD83D\uDE9A",
  Packaging: "\uD83D\uDCE6",
  Retail: "\uD83D\uDED2",
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
      {/* Supply chain flow */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, flexWrap: "wrap", fontSize: "0.75rem" }}>
        {breakdown.map((b, i) => (
          <React.Fragment key={b.category}>
            <span style={{ padding: "4px 10px", borderRadius: 20, background: scoreBg(b.categoryScore), color: scoreColor(b.categoryScore), fontWeight: 600, fontSize: "0.72rem", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span>{STAGE_ICONS[b.category] || ""}</span>{b.category}
            </span>
            {i < breakdown.length - 1 && <span style={{ color: "#ccc", fontSize: "0.8rem" }}>&rarr;</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Category cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {enriched.map((b, i) => (
          <div key={b.category} style={{ border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", background: "#fff", animation: `fadeInUp 0.35s ease ${i * 60}ms both` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: scoreBg(b.categoryScore), border: `2px solid ${scoreRing(b.categoryScore)}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0, color: scoreColor(b.categoryScore) }} title={`${b.category} score: ${b.categoryScore}/10`}>
                {b.categoryScore}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.85rem" }}>{STAGE_ICONS[b.category] || ""}</span>{b.category}
                  </span>
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: 20, background: scoreBg(b.categoryScore), color: scoreColor(b.categoryScore), fontWeight: 600 }}>
                    {scoreLabel(b.categoryScore)}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>
                  {b.emission} kg CO&#8322;e of {b.maxReference} max
                </div>
              </div>
            </div>

            {/* Bar */}
            <div style={{ background: "#f0f0f0", borderRadius: 6, height: 7, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min((b.emission / b.maxReference) * 100, 100)}%`,
                height: "100%", borderRadius: 6,
                background: `linear-gradient(90deg, ${scoreRing(b.categoryScore)}, ${scoreColor(b.categoryScore)})`,
                animation: "growBar 0.6s ease both",
                animationDelay: `${i * 60 + 200}ms`,
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: "0.75rem", color: "#999" }}>
              <span>Weight: {Math.round(b.weight * 100)}%</span>
              <span>Contributes <strong style={{ color: "#555" }}>+{b.contribution}</strong> to total</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{ marginTop: 18, padding: "16px 18px", background: "linear-gradient(135deg, #edf7f0 0%, #d8f3dc 100%)", borderRadius: 14, border: "2px solid #52b788" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1b4332", fontFamily: "'Outfit', sans-serif" }}>Total GreenGrade</div>
            <div style={{ fontSize: "0.8rem", color: "#40916c", marginTop: 2 }}>Sum of all weighted category scores</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: "1.6rem", color: scoreColor(totalScore || computedTotal), fontFamily: "'Outfit', sans-serif" }}>
              {totalScore || computedTotal}<span style={{ fontSize: "0.85rem", color: "#888", fontWeight: 400 }}> / 10</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginTop: 12, fontSize: "0.75rem", color: "#666", flexWrap: "wrap", alignItems: "center" }}>
          {enriched.map((b, i) => (
            <React.Fragment key={b.category}>
              <span style={{ padding: "3px 8px", borderRadius: 6, background: "#fff", border: `1px solid ${scoreColor(b.categoryScore)}`, color: scoreColor(b.categoryScore), fontWeight: 600, whiteSpace: "nowrap" }}>
                {b.contribution}
              </span>
              {i < enriched.length - 1 && <span>+</span>}
            </React.Fragment>
          ))}
          <span>=</span>
          <span style={{ padding: "3px 10px", borderRadius: 6, background: scoreColor(totalScore || computedTotal), color: (totalScore || computedTotal) >= 4 && (totalScore || computedTotal) < 7 ? "#1a1a2e" : "#fff", fontWeight: 700 }}>
            {totalScore || computedTotal}
          </span>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#40916c", marginTop: 10 }}>
          Total emissions: <strong style={{ color: "#1b4332" }}>{totalEmissions} kg CO&#8322;e/kg</strong>
        </div>
      </div>
    </div>
  );
}
