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

function EvidenceRow({ item, isDark, onReview, reviewing }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  const handleReview = async (status) => {
    setLocalError("");
    try {
      await onReview(item.id, status, notes.trim() || undefined);
    } catch (err) {
      setLocalError(err.message || "Review failed");
    }
  };

  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";
  const mutedColor = isDark ? "#6b8a6e" : "#999";
  const textColor = isDark ? "#c8d6c8" : "#444";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 12,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Product #{item.product_id} — {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </div>
          <div style={{ fontSize: "0.78rem", color: mutedColor }}>
            Submitted by {item.submitter_email} on{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
            {item.year ? ` · Study year: ${item.year}` : ""}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            padding: "4px 12px",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: isDark ? "#95d5b2" : "#2d6a4f",
            whiteSpace: "nowrap",
          }}
          aria-expanded={expanded}
        >
          {expanded ? "Collapse" : "Review"}
        </button>
      </div>

      <div
        style={{
          fontSize: "0.88rem",
          color: textColor,
          lineHeight: 1.6,
          background: isDark ? "#1a2d1f" : "#f9fafb",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: expanded ? 12 : 0,
        }}
      >
        <em>{item.citation}</em>
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          {(item.url || item.methodology) && (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: "0.8rem",
                color: mutedColor,
                marginBottom: 12,
              }}
            >
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: isDark ? "#74c69d" : "#2d6a4f" }}
                >
                  View source →
                </a>
              )}
              {item.methodology && <span>Methodology: {item.methodology}</span>}
            </div>
          )}

          <label>
            <span style={formLabel(isDark)}>Reviewer notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Verified source, appropriate methodology..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 12px",
                borderRadius: 8,
                border: `2px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
                fontSize: "0.88rem",
                resize: "vertical",
                background: isDark ? "#0f1f14" : "#fff",
                color: isDark ? "#e8f5e9" : "#222",
                fontFamily: "inherit",
              }}
            />
          </label>

          {localError && (
            <div
              role="alert"
              style={{ ...errorAlert(isDark), fontSize: 13, marginTop: 10, marginBottom: 10 }}
            >
              {localError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => handleReview("approved")}
              disabled={reviewing}
              style={{
                ...primaryButton({ loading: reviewing }),
                fontSize: 13,
                padding: "8px 20px",
              }}
            >
              {reviewing ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() => handleReview("rejected")}
              disabled={reviewing}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                border: `2px solid ${isDark ? "#5c2d2d" : "#fca5a5"}`,
                cursor: reviewing ? "wait" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: isDark ? "#3a1c1c" : "#fff1f2",
                color: "#e63946",
                transition: "all 0.2s ease",
              }}
            >
              {reviewing ? "Saving..." : "Reject"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 50, offset: 0 }),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, status, notes),
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_, { status }) => {
      setReviewingId(null);
      setSuccessMessage(`Evidence ${status}.`);
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: () => setReviewingId(null),
  });

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

  if (isLoading) return <Spinner message="Loading pending evidence..." />;

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

  const { evidence = [], total = 0 } = data || {};

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review Queue"
        subtitle={`${total} pending submission${total !== 1 ? "s" : ""} awaiting admin review.`}
      />

      <div style={pageContainer(860)}>
        {successMessage && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#27ae60",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {successMessage}
          </div>
        )}

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 40,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              fontSize: "0.9rem",
            }}
          >
            No pending evidence submissions. The queue is clear.
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(id, status, notes) => review.mutate({ id, status, notes })}
              reviewing={reviewingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
