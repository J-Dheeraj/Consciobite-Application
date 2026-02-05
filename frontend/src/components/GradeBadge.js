import React from "react";

const colorMap = {
  green: { bg: "#2d6a4f", text: "#fff" },
  yellow: { bg: "#e9c46a", text: "#1a1a2e" },
  red: { bg: "#e63946", text: "#fff" },
};

export default function GradeeBadge({ score, color, size = "normal" }) {
  const colors = colorMap[color] || colorMap.yellow;
  const dim = size === "large" ? 80 : 48;
  const fontSize = size === "large" ? "1.6rem" : "1rem";

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        backgroundColor: colors.bg,
        color: colors.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
        flexShrink: 0,
      }}
      title={`GreenGrade: ${score}/10`}
    >
      {score}
    </div>
  );
}
