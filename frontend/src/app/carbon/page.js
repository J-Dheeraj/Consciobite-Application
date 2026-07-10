"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchCarbonSummary, fetchCarbonLogs, deleteCarbonLog } from "@/services/api";
import { WEEKLY_CARBON_GOAL_KG } from "@/utils/constants";
import Spinner from "@/components/Spinner";
import PageHero from "@/components/PageHero";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CarbonTracker() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState("");
  const [logsPage, setLogsPage] = useState(1);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["carbon", "summary"],
    queryFn: fetchCarbonSummary,
  });

  const {
    data: logsData,
    isLoading: logsLoading,
    error,
  } = useQuery({
    queryKey: ["carbon", "logs", logsPage],
    queryFn: () => fetchCarbonLogs(logsPage),
  });

  const loading = summaryLoading || logsLoading;
  const logs = logsData?.logs || [];
  const totalPages = logsData?.totalPages || 1;

  const handleDelete = useCallback(
    async (id) => {
      setDeleteError("");
      try {
        await deleteCarbonLog(id);
        queryClient.invalidateQueries({ queryKey: ["carbon", "summary"] });
        queryClient.invalidateQueries({ queryKey: ["carbon", "logs"] });
      } catch (err) {
        setDeleteError(err.message || "Failed to delete log. Please try again.");
      }
    },
    [queryClient]
  );

  if (!isAuthenticated) {
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        <PageHero
          icon={"🌍"}
          title="Carbon Tracker"
          subtitle="Track your food carbon footprint over time."
        />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px 40px" }}>
          <div
            style={{
              marginTop: -20,
              background: isDark ? "#162419" : "#fff",
              borderRadius: 14,
              padding: 32,
              textAlign: "center",
              boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12, opacity: 0.4 }}>{"🔒"}</div>
            <p style={{ color: isDark ? "#7a9a7e" : "#888", marginBottom: 20 }}>
              Sign in to start tracking your carbon footprint.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "linear-gradient(135deg, #2d6a4f, #40916c)",
                color: "#fff",
                borderRadius: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Spinner message="Loading carbon data..." />;
  }

  const weeklyProgress = summary
    ? Math.min((summary.weekly.emissions / WEEKLY_CARBON_GOAL_KG) * 100, 100)
    : 0;
  const trendData = summary?.trend || [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"🌍"}
        title="Carbon Tracker"
        subtitle="Monitor your food-related carbon footprint."
      />

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 40px" }}>
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              marginTop: 16,
              padding: 14,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 10,
              color: "#e63946",
            }}
          >
            {error?.message || "Unable to load carbon data."}
          </div>
        )}

        {deleteError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              marginTop: 16,
              padding: 14,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 10,
              color: "#e63946",
            }}
          >
            {deleteError}
          </div>
        )}

        {summary && (
          <>
            {/* Summary Cards */}
            <div
              style={{
                marginTop: -20,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
                marginBottom: 20,
                animation: "fadeInUp 0.4s ease",
              }}
            >
              <div
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  padding: 18,
                  textAlign: "center",
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 4,
                  }}
                >
                  This Week
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    color: summary.weekly.emissions > WEEKLY_CARBON_GOAL_KG ? "#e63946" : "#2d6a4f",
                  }}
                >
                  {summary.weekly.emissions}
                </div>
                <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                  kg CO{"\u2082"}e
                </div>
              </div>
              <div
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  padding: 18,
                  textAlign: "center",
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 4,
                  }}
                >
                  This Month
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    color: "#e9c46a",
                  }}
                >
                  {summary.monthly.emissions}
                </div>
                <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                  kg CO{"\u2082"}e
                </div>
              </div>
              <div
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  padding: 18,
                  textAlign: "center",
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: isDark ? "#7a9a7e" : "#888",
                    marginBottom: 4,
                  }}
                >
                  All Time
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    color: isDark ? "#95d5b2" : "#2d6a4f",
                  }}
                >
                  {summary.total.emissions}
                </div>
                <div style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                  {summary.total.logs} logs
                </div>
              </div>
            </div>

            {/* Weekly Goal */}
            <div
              style={{
                background: isDark ? "#162419" : "#fff",
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
                boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    color: isDark ? "#e8f5e9" : "#333",
                  }}
                >
                  Weekly Goal: {WEEKLY_CARBON_GOAL_KG} kg CO{"\u2082"}e
                </span>
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: weeklyProgress < 80 ? "#2d6a4f" : "#e63946",
                    fontWeight: 600,
                  }}
                >
                  {Math.round(weeklyProgress)}%
                </span>
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  background: isDark ? "#1c2e22" : "#edf7f0",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 5,
                    transition: "width 0.5s ease",
                    width: `${weeklyProgress}%`,
                    background:
                      weeklyProgress < 80
                        ? "linear-gradient(90deg, #52b788, #2d6a4f)"
                        : "linear-gradient(90deg, #e9c46a, #e63946)",
                  }}
                />
              </div>
            </div>

            {/* Trend Chart */}
            {trendData.length > 0 && (
              <div
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    marginBottom: 12,
                    color: isDark ? "#e8f5e9" : "#333",
                  }}
                >
                  Weekly Trend (Last 90 Days)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#2d4a35" : "#f0f0f0"} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: isDark ? "#7a9a7e" : "#888" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? "#7a9a7e" : "#888" }} />
                    <Tooltip />
                    <Bar dataKey="emissions" name="kg CO₂e" fill="#52b788" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Impact Products */}
            {summary.topProducts.length > 0 && (
              <div
                style={{
                  background: isDark ? "#162419" : "#fff",
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                  boxShadow: isDark
                    ? "0 4px 12px rgba(0,0,0,0.2)"
                    : "0 2px 8px rgba(27,67,50,0.06)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    marginBottom: 12,
                    color: isDark ? "#e8f5e9" : "#333",
                  }}
                >
                  Highest Impact Products
                </h3>
                {summary.topProducts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom:
                        i < summary.topProducts.length - 1
                          ? "1px solid " + (isDark ? "#2d4a35" : "#f0f0f0")
                          : "none",
                    }}
                  >
                    <Link
                      href={`/product/${p.product_id}`}
                      style={{
                        fontWeight: 500,
                        fontSize: "0.88rem",
                        color: isDark ? "#95d5b2" : "#2d6a4f",
                      }}
                    >
                      {p.product_name}
                    </Link>
                    <span style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
                      {p.totalEmissions} kg ({p.totalQuantity}x)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Recent Logs */}
        <div
          style={{
            background: isDark ? "#162419" : "#fff",
            borderRadius: 14,
            padding: 20,
            boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(27,67,50,0.06)",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              marginBottom: 12,
              color: isDark ? "#e8f5e9" : "#333",
            }}
          >
            Recent Logs
          </h3>
          {logs.length === 0 ? (
            <p
              style={{
                color: isDark ? "#7a9a7e" : "#888",
                fontSize: "0.9rem",
                textAlign: "center",
                padding: 20,
              }}
            >
              No logs yet. Browse products and log your purchases to start tracking!
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid " + (isDark ? "#2d4a35" : "#f0f0f0"),
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: "0.88rem",
                      color: isDark ? "#e8f5e9" : "#333",
                    }}
                  >
                    {log.product_name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: isDark ? "#7a9a7e" : "#888" }}>
                    {new Date(log.logged_at).toLocaleDateString()} · Qty: {log.quantity}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#e9c46a" }}>
                    {(log.emissions * log.quantity).toFixed(2)} kg
                  </span>
                  <button
                    onClick={() => handleDelete(log.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e63946",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      padding: "4px 8px",
                      borderRadius: 6,
                    }}
                    title="Remove log"
                    aria-label={`Remove log for ${log.product_name}`}
                  >
                    {"\u2715"}
                  </button>
                </div>
              </div>
            ))
          )}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
              }}
            >
              <button
                onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                disabled={logsPage === 1}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid " + (isDark ? "#2d4a35" : "#d1e8d9"),
                  background: "none",
                  color:
                    logsPage === 1 ? (isDark ? "#3d5a45" : "#ccc") : isDark ? "#95d5b2" : "#2d6a4f",
                  cursor: logsPage === 1 ? "default" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Prev
              </button>
              <span style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
                Page {logsPage} of {totalPages}
              </span>
              <button
                onClick={() => setLogsPage((p) => Math.min(totalPages, p + 1))}
                disabled={logsPage === totalPages}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid " + (isDark ? "#2d4a35" : "#d1e8d9"),
                  background: "none",
                  color:
                    logsPage === totalPages
                      ? isDark
                        ? "#3d5a45"
                        : "#ccc"
                      : isDark
                        ? "#95d5b2"
                        : "#2d6a4f",
                  cursor: logsPage === totalPages ? "default" : "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            fontSize: "0.82rem",
            color: isDark ? "#7a9a7e" : "#aaa",
          }}
        >
          Tip: Visit any product page and click &ldquo;Log Purchase&rdquo; to add it to your carbon
          tracker.
        </p>
      </div>
    </div>
  );
}
