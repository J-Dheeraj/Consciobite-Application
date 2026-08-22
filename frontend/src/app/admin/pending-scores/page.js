"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPendingScores,
  triggerStagedRescore,
  publishPendingScore,
  rejectPendingScore,
} from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

function deltaColor(delta) {
  if (delta > 0) return "#27ae60";
  if (delta < 0) return "#e74c3c";
  return "#999";
}

function ActionModal({ change, isDark, onPublish, onReject, onClose, busy }) {
  const [notes, setNotes] = useState("");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card(isDark, { padding: 28, radius: 16 }),
          width: "100%",
          maxWidth: 480,
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            marginBottom: 4,
          }}
        >
          {change.product_name}
        </div>
        <div
          style={{ fontSize: 13, color: isDark ? "#6b8a6e" : "#999", marginBottom: 18 }}
        >
          Score: {change.old_score ?? "—"} → {change.new_score} (
          <span style={{ fontWeight: 700, color: deltaColor(change.score_delta) }}>
            {change.score_delta > 0 ? "+" : ""}
            {change.score_delta}
          </span>
          )
        </div>

        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: isDark ? "#b0c4b1" : "#555",
            marginBottom: 6,
          }}
        >
          Review notes (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cite the evidence or reason for your decision…"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
            background: isDark ? "#111d16" : "#f9fafb",
            color: isDark ? "#e8f5e9" : "#1a3a2a",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
              background: "transparent",
              color: isDark ? "#b0c4b1" : "#555",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onReject(change.id, notes)}
            disabled={busy}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#e74c3c",
              color: "#fff",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 13,
              opacity: busy ? 0.6 : 1,
            }}
          >
            Reject
          </button>
          <button
            onClick={() => onPublish(change.id, notes)}
            disabled={busy}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: "none",
              background: "#2d6a4f",
              color: "#fff",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              fontSize: 13,
              opacity: busy ? 0.6 : 1,
            }}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PendingScoresPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [stageReason, setStageReason] = useState("");
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-scores"],
    queryFn: () => fetchPendingScores(),
    enabled: isAuthenticated,
  });

  const stageRescore = useMutation({
    mutationFn: () => triggerStagedRescore(stageReason || "Staged rescore via admin UI"),
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["pending-scores"] });
    },
    onError: (err) => setFeedback({ type: "error", text: err.message }),
  });

  const publish = useMutation({
    mutationFn: ({ id, notes }) => publishPendingScore(id, notes),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["pending-scores"] });
      setFeedback({ type: "success", text: "Score change published successfully." });
    },
    onError: (err) => setFeedback({ type: "error", text: err.message }),
  });

  const reject = useMutation({
    mutationFn: ({ id, notes }) => rejectPendingScore(id, notes),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["pending-scores"] });
      setFeedback({ type: "success", text: "Score change rejected." });
    },
    onError: (err) => setFeedback({ type: "error", text: err.message }),
  });

  const busy = publish.isPending || reject.isPending;

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to view this page."
        />
      </div>
    );
  }

  if (isLoading) return <Spinner message="Loading pending score changes…" />;

  if (error) {
    const isAdminError = error.message?.includes("Admin") || error.message?.includes("403");
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Access Denied"
          subtitle={isAdminError ? "Admin role required to view this page." : error.message}
        />
      </div>
    );
  }

  const { changes } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="⏳"
        title="Pending Score Changes"
        subtitle="Score changes staged for review. Publish to make them live, or reject to discard without writing an audit entry."
      />

      <div style={pageContainer(1000)}>
        {/* Admin nav */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { href: "/admin/conflict-log", label: "📊 Conflict Log", active: false },
            { href: "/admin/pending-scores", label: "⏳ Pending Scores", active: true },
            { href: "/admin/manufacturers", label: "🏭 Manufacturers", active: false },
          ].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background: tab.active ? "#2d6a4f" : isDark ? "#1c2e22" : "#f0f0f0",
                color: tab.active ? "#fff" : isDark ? "#b0c4b1" : "#555",
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Stage rescore controls */}
        <div
          style={{
            ...card(isDark, { padding: 20, radius: 14 }),
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? "#b0c4b1" : "#555",
                marginBottom: 6,
              }}
            >
              Stage new rescore (queues changes for review)
            </label>
            <input
              type="text"
              value={stageReason}
              onChange={(e) => setStageReason(e.target.value)}
              placeholder="Reason for rescore (optional)"
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
                background: isDark ? "#111d16" : "#f9fafb",
                color: isDark ? "#e8f5e9" : "#1a3a2a",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={() => stageRescore.mutate()}
            disabled={stageRescore.isPending}
            style={primaryButton({ loading: stageRescore.isPending })}
          >
            {stageRescore.isPending ? "Staging…" : "Stage Rescore"}
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              fontWeight: 600,
              background: feedback.type === "success" ? (isDark ? "#1c3a25" : "#ecfdf5") : "#fef2f2",
              color: feedback.type === "success" ? "#27ae60" : "#dc2626",
              cursor: "pointer",
            }}
            onClick={() => setFeedback(null)}
          >
            {feedback.text} ✕
          </div>
        )}

        {/* Pending changes table */}
        <div style={{ ...card(isDark, { radius: 14 }), overflow: "auto" }}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
              {changes.length} pending
              {changes.length === 1 ? " change" : " changes"}
            </span>
            <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>
              Click a row to review
            </span>
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 700,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
                  textAlign: "left",
                }}
              >
                {["Product", "Old Score", "New Score", "Delta", "Staged By", "Staged At", "Reason"].map(
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
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {changes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: isDark ? "#6b8a6e" : "#999",
                    }}
                  >
                    No pending score changes. Use &ldquo;Stage Rescore&rdquo; above to queue new changes for review.
                  </td>
                </tr>
              ) : (
                changes.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    style={{
                      borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = isDark ? "#1c2e22" : "#f9fafb")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                    <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999" }}>
                      {row.old_score ?? "—"}
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
                    <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999" }}>
                      {row.staged_by}
                    </td>
                    <td
                      style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 12 }}
                    >
                      {new Date(row.staged_at).toLocaleString()}
                    </td>
                    <td
                      style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 12 }}
                    >
                      {row.stage_reason || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ActionModal
          change={selected}
          isDark={isDark}
          busy={busy}
          onClose={() => setSelected(null)}
          onPublish={(id, notes) => publish.mutate({ id, notes })}
          onReject={(id, notes) => reject.mutate({ id, notes })}
        />
      )}
    </div>
  );
}
