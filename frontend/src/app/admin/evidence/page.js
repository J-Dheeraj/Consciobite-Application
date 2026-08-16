"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, errorAlert, formLabel } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleAction = (status) => {
    onReview({ id: item.id, status, notes: notes.trim() || undefined });
    setNotes("");
    setExpanded(false);
  };

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        marginBottom: 16,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c3a28" : "#d1fae5",
                color: isDark ? "#6ee7b7" : "#065f46",
              }}
            >
              Product #{item.product_id}
            </span>
            <span
              style={{
                padding: "2px 10px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1e2d3a" : "#eff6ff",
                color: isDark ? "#93c5fd" : "#1e40af",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>
                {item.year}
              </span>
            )}
          </div>

          <p
            style={{
              margin: "0 0 8px",
              fontSize: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {item.citation}
          </p>

          {item.url && (
            <p style={{ margin: "0 0 6px", fontSize: 12 }}>
              <span style={{ color: isDark ? "#6b8a6e" : "#999" }}>URL: </span>
              <span
                style={{
                  color: isDark ? "#6ee7b7" : "#2d6a4f",
                  wordBreak: "break-all",
                }}
              >
                {item.url}
              </span>
            </p>
          )}

          {item.methodology && (
            <p style={{ margin: "0 0 6px", fontSize: 12, color: isDark ? "#6b8a6e" : "#888" }}>
              <span style={{ fontWeight: 600 }}>Methodology: </span>
              {item.methodology}
            </p>
          )}

          <p style={{ margin: 0, fontSize: 11, color: isDark ? "#4a6e50" : "#bbb" }}>
            Submitted by {item.submitter_email} &middot;{" "}
            {new Date(item.submitted_at).toLocaleString()}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#2d4a35" : "#d1fae5"}`,
              background: "transparent",
              color: isDark ? "#6ee7b7" : "#2d6a4f",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {expanded ? "Hide notes" : "Add notes"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14 }}>
          <label style={formLabel(isDark)}>Reviewer notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for approval or rejection..."
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `2px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
              background: isDark ? "#0d1f15" : "#fafafa",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontSize: 13,
              resize: "vertical",
              marginBottom: 10,
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => handleAction("approved")}
          style={{
            ...primaryButton(),
            padding: "8px 20px",
            fontSize: 13,
          }}
        >
          Approve
        </button>
        <button
          onClick={() => handleAction("rejected")}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: `2px solid ${isDark ? "#5a1e1e" : "#fecaca"}`,
            background: isDark ? "#2a1515" : "#fff1f2",
            color: isDark ? "#f87171" : "#b91c1c",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function AdminEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewError, setReviewError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      setReviewError("");
    },
    onError: (err) => setReviewError(err.message),
  });

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ ...pageContainer(700), paddingTop: 40, textAlign: "center" }}>
        <p style={{ color: isDark ? "#b0c4b1" : "#555" }}>Admin access required.</p>
      </div>
    );
  }

  const items = data?.evidence ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <PageHero
        title="Evidence Review"
        subtitle="Review and approve community-submitted evidence citations"
        icon="🔬"
      />
      <div style={pageContainer(800)}>
        {reviewError && (
          <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>{reviewError}</div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              margin: 0,
            }}
          >
            Pending Submissions
          </h2>
          <span
            style={{
              padding: "4px 14px",
              borderRadius: 20,
              background: total > 0
                ? isDark ? "#3a2e1c" : "#fef3c7"
                : isDark ? "#1c2e22" : "#f3f4f6",
              color: total > 0 ? "#92400e" : isDark ? "#6b8a6e" : "#999",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {total} pending
          </span>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spinner />
          </div>
        ) : error ? (
          <div style={errorAlert(isDark)}>
            {error.status === 403
              ? "Admin privileges required to view this page."
              : "Failed to load pending evidence. You may not have admin access."}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 40 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ margin: 0, fontWeight: 600 }}>No pending submissions</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              All community evidence has been reviewed.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={({ id, status, notes }) => review.mutate({ id, status, notes })}
            />
          ))
        )}
      </div>
    </div>
  );
}
