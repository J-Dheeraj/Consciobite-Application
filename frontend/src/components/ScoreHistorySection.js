"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScoreHistory } from "@/services/api";
import { useTheme } from "@/context/ThemeContext";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DeltaChip({ delta }) {
  if (delta === null || delta === undefined) return null;
  const pos = delta > 0;
  const neutral = Math.abs(delta) < 0.001;
  const color = neutral ? "#7a9a7e" : pos ? "#27ae60" : "#e74c3c";
  const bg = neutral
    ? "rgba(122,154,126,0.15)"
    : pos
      ? "rgba(39,174,96,0.15)"
      : "rgba(231,76,60,0.15)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 700,
        color,
        background: bg,
      }}
    >
      {pos ? "+" : ""}
      {delta.toFixed(2)}
    </span>
  );
}

export default function ScoreHistorySection({ productId }) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["scoreHistory", productId],
    queryFn: () => fetchScoreHistory(productId),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const borderColor = isDark ? "rgba(82,183,136,0.2)" : "rgba(39,174,96,0.2)";
  const cardBg = isDark ? "#0f2a1e" : "#f0faf4";
  const headingColor = isDark ? "#52b788" : "#1a7a40";
  const textColor = isDark ? "#c8e6c9" : "#1b4332";
  const mutedColor = isDark ? "#7a9a7e" : "#4a7c59";
  const rowHover = isDark ? "#14352a" : "#e8f5e0";

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 14,
        border: `1px solid ${borderColor}`,
        background: cardBg,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: headingColor,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: "0.88rem",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        <span>Score History</span>
        <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 18px 16px" }}>
          {isLoading && (
            <p style={{ color: mutedColor, fontSize: "0.85rem", margin: "8px 0" }}>Loading…</p>
          )}
          {isError && (
            <p style={{ color: "#e74c3c", fontSize: "0.85rem", margin: "8px 0" }}>
              Could not load score history.
            </p>
          )}
          {data && data.history.length === 0 && (
            <p style={{ color: mutedColor, fontSize: "0.85rem", margin: "8px 0" }}>
              No score changes recorded yet. The current score of{" "}
              <strong style={{ color: headingColor }}>{data.currentScore}</strong> is the initial
              score assigned when this product was catalogued.
            </p>
          )}
          {data && data.history.length > 0 && (
            <>
              <p style={{ color: mutedColor, fontSize: "0.78rem", marginBottom: 10 }}>
                {data.total} change{data.total !== 1 ? "s" : ""} recorded
              </p>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.82rem",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  <thead>
                    <tr>
                      {["Date", "Before", "After", "Change", "Methodology", "Reason"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "6px 8px",
                            color: mutedColor,
                            fontWeight: 600,
                            borderBottom: `1px solid ${borderColor}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = rowHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "8px 8px", color: textColor, whiteSpace: "nowrap" }}>
                          {formatDate(row.changed_at)}
                        </td>
                        <td style={{ padding: "8px 8px", color: textColor }}>
                          {row.old_score?.toFixed(1) ?? "—"}
                        </td>
                        <td style={{ padding: "8px 8px", color: textColor }}>
                          {row.new_score?.toFixed(1) ?? "—"}
                        </td>
                        <td style={{ padding: "8px 8px" }}>
                          <DeltaChip delta={row.score_delta} />
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            color: mutedColor,
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          v{row.methodology_version ?? "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            color: mutedColor,
                            fontSize: "0.78rem",
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={row.change_reason}
                        >
                          {row.change_reason ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
