"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreHistory } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";

function formatDate(iso) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function DeltaBadge({ delta }) {
  const up = delta > 0;
  const zero = delta === 0;
  const bg = zero ? "#e5e7eb" : up ? "rgba(39,174,96,0.15)" : "rgba(231,76,60,0.15)";
  const color = zero ? "#777" : up ? "#27ae60" : "#e74c3c";
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 8,
        background: bg,
        color,
        fontWeight: 700,
        fontSize: 12,
      }}
    >
      {sign}
      {delta.toFixed(2)}
    </span>
  );
}

function HistoryEntry({ entry, isDark, isLast }) {
  const textColor = isDark ? "#b0c4b1" : "#555";
  const border = isDark ? "#1c2e22" : "#e5e7eb";
  return (
    <div style={{ display: "flex", gap: 14, paddingBottom: isLast ? 0 : 20 }}>
      {/* Timeline spine */}
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#2d6a4f",
            marginTop: 4,
          }}
        />
        {!isLast && <div style={{ width: 2, flexGrow: 1, background: border, marginTop: 4 }} />}
      </div>

      {/* Entry body */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, color: textColor }}>{formatDate(entry.changed_at)}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
            {entry.old_score.toFixed(2)} → {entry.new_score.toFixed(2)}
          </span>
          <DeltaBadge delta={entry.score_delta} />
          {entry.methodology_version && (
            <span
              style={{
                fontSize: 11,
                color: isDark ? "#4a6a4e" : "#999",
                fontStyle: "italic",
              }}
            >
              v{entry.methodology_version}
            </span>
          )}
        </div>
        {entry.change_reason && (
          <p style={{ margin: 0, fontSize: 13, color: textColor, lineHeight: 1.5 }}>
            {entry.change_reason}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ScoreHistoryTimeline({ productId }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["score-history", productId],
    queryFn: () => fetchScoreHistory(productId),
    staleTime: 5 * 60 * 1000,
  });

  const borderColor = isDark ? "#1c2e22" : "#e5e7eb";
  const headingColor = isDark ? "#e8f5e9" : "#1a3a2a";
  const textColor = isDark ? "#b0c4b1" : "#555";

  return (
    <div
      style={{
        background: isDark ? "#141d17" : "#fff",
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        padding: 20,
        marginTop: 20,
      }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: headingColor,
          margin: "0 0 14px",
        }}
      >
        Score History
      </h3>

      {isLoading && <p style={{ color: textColor, fontSize: 14 }}>Loading score history…</p>}

      {isError && <p style={{ color: "#e74c3c", fontSize: 14 }}>Could not load score history.</p>}

      {!isLoading && !isError && data && (
        <>
          {data.history.length === 0 ? (
            <p style={{ color: textColor, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              No score changes recorded.{" "}
              {data.scoredSince
                ? `Score has been stable since ${formatDate(data.scoredSince)}.`
                : "Score is stable since initial assessment."}
            </p>
          ) : (
            <div>
              {data.history.map((entry, i) => (
                <HistoryEntry
                  key={entry.changed_at + i}
                  entry={entry}
                  isDark={isDark}
                  isLast={i === data.history.length - 1}
                />
              ))}
              <p
                style={{
                  marginTop: 14,
                  fontSize: 12,
                  color: isDark ? "#4a6a4e" : "#aaa",
                  fontStyle: "italic",
                }}
              >
                Showing last {data.history.length} change
                {data.history.length !== 1 ? "s" : ""}.{" "}
                <a href="/transparency" style={{ color: "#2d6a4f", textDecoration: "none" }}>
                  Learn about our governance →
                </a>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
