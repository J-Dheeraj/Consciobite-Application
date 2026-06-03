"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchConflictLog, triggerRescore } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "paying", label: "Paying Clients" },
  { key: "non-paying", label: "Non-Paying" },
];

function StatCard({ label, value, sub, isDark, accent }) {
  return (
    <div
      style={{
        ...card(isDark, { padding: 20, radius: 12 }),
        textAlign: "center",
        minWidth: 140,
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: "'Outfit', sans-serif",
          color: accent || (isDark ? "#a7f3d0" : "#2d6a4f"),
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDark ? "#b0c4b1" : "#555",
          marginTop: 4,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#999", marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function deltaColor(delta) {
  if (delta > 0) return "#27ae60";
  if (delta < 0) return "#e74c3c";
  return "#999";
}

export default function ConflictLogPage() {
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const isDark = theme === "dark";
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["conflict-log", filter],
    queryFn: () => fetchConflictLog(filter),
    enabled: isAdmin,
  });

  const rescore = useMutation({
    mutationFn: triggerRescore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conflict-log"] }),
  });

  if (isLoading) return <Spinner message="Loading conflict log..." />;

  if (error) {
    return (
      <div>
        <PageHero icon="⚠️" title="Error" subtitle={error.message} />
      </div>
    );
  }

  const { logs, stats } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📊"
        title="Score Audit — Conflict Log"
        subtitle="Every GreenGrade score change, with paying-client attribution. This is what the advisory panel reviews."
      />

      <div style={pageContainer(1000)}>
        {/* Summary Stats */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
          <StatCard isDark={isDark} label="Total Changes (12mo)" value={stats.totalChanges} />
          <StatCard
            isDark={isDark}
            label="Paying Client Changes"
            value={stats.paying.count}
            sub={`avg delta: ${stats.paying.avgDelta >= 0 ? "+" : ""}${stats.paying.avgDelta}`}
            accent="#f39c12"
          />
          <StatCard
            isDark={isDark}
            label="Non-Paying Changes"
            value={stats.nonPaying.count}
            sub={`avg delta: ${stats.nonPaying.avgDelta >= 0 ? "+" : ""}${stats.nonPaying.avgDelta}`}
          />
          <StatCard
            isDark={isDark}
            label="Paying: Up / Down"
            value={`${stats.paying.increases} / ${stats.paying.decreases}`}
          />
          <StatCard
            isDark={isDark}
            label="Non-Paying: Up / Down"
            value={`${stats.nonPaying.increases} / ${stats.nonPaying.decreases}`}
          />
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  background: filter === f.key ? "#2d6a4f" : isDark ? "#1c2e22" : "#f0f0f0",
                  color: filter === f.key ? "#fff" : isDark ? "#b0c4b1" : "#555",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => rescore.mutate()}
            disabled={rescore.isPending}
            style={primaryButton({ loading: rescore.isPending })}
          >
            {rescore.isPending ? "Rescoring..." : "Rescore All Products"}
          </button>
        </div>

        {rescore.isSuccess && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#27ae60",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {rescore.data.message}
          </div>
        )}

        {/* Log Table */}
        <div style={{ ...card(isDark, { radius: 14 }), overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 800,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
                  textAlign: "left",
                }}
              >
                {["Product", "Paying", "Old", "New", "Delta", "Changed", "By", "Reason"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 10px",
                        fontWeight: 700,
                        color: isDark ? "#b0c4b1" : "#555",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: isDark ? "#6b8a6e" : "#999",
                    }}
                  >
                    No score changes recorded yet. Changes will appear here after the next algorithm
                    update or rescore.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "10px",
                        fontWeight: 600,
                        color: isDark ? "#e8f5e9" : "#1a3a2a",
                      }}
                    >
                      {row.product_name}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: row.is_paying_client
                            ? "#fef3c7"
                            : isDark
                              ? "#1c2e22"
                              : "#f3f4f6",
                          color: row.is_paying_client ? "#92400e" : isDark ? "#6b8a6e" : "#999",
                        }}
                      >
                        {row.is_paying_client ? "YES" : "NO"}
                      </span>
                    </td>
                    <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999" }}>
                      {row.old_score}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        fontWeight: 600,
                        color: deltaColor(row.score_delta),
                      }}
                    >
                      {row.new_score}
                    </td>
                    <td
                      style={{
                        padding: "10px",
                        fontWeight: 700,
                        color: deltaColor(row.score_delta),
                      }}
                    >
                      {row.score_delta > 0 ? "+" : ""}
                      {row.score_delta}
                    </td>
                    <td
                      style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 12 }}
                    >
                      {new Date(row.changed_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999" }}>
                      {row.changed_by}
                    </td>
                    <td
                      style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 12 }}
                    >
                      {row.change_reason || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
