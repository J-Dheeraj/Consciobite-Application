"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewPendingEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, errorAlert } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textMuted = isDark ? "#6b8a6e" : "#999";
  const textBody = isDark ? "#c8d6c8" : "#444";
  const textHeading = isDark ? "#e8f5e9" : "#1a3a2a";
  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        marginBottom: 16,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c2e22" : "#f0fdf4",
                color: isDark ? "#74c69d" : "#2d6a4f",
                border: `1px solid ${isDark ? "#2d4a35" : "#bbf7d0"}`,
              }}
            >
              Product #{item.product_id}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1c2a3a" : "#eff6ff",
                color: isDark ? "#7db8e8" : "#1d4ed8",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: textHeading,
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            {item.citation}
          </p>

          {item.methodology && (
            <p style={{ fontSize: 13, color: textBody, marginBottom: 4, lineHeight: 1.5 }}>
              <strong style={{ color: textMuted }}>Method:</strong> {item.methodology}
            </p>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: isDark ? "#74c69d" : "#2d6a4f" }}
              >
                View source →
              </a>
            )}
            {item.year && <span style={{ fontSize: 12, color: textMuted }}>Year: {item.year}</span>}
            <span style={{ fontSize: 12, color: textMuted }}>From: {item.submitter_email}</span>
            <span style={{ fontSize: 12, color: textMuted }}>
              {new Date(item.submitted_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 140,
            alignItems: "flex-end",
          }}
        >
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: `1px solid ${borderColor}`,
              background: "transparent",
              color: textMuted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {expanded ? "Hide notes" : "Add notes"}
          </button>
          <button
            onClick={() => onReview(item.id, "approved", notes)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#16a34a",
              transition: "all 0.15s ease",
            }}
          >
            Approve
          </button>
          <button
            onClick={() => onReview(item.id, "rejected", notes)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              background: isDark ? "#3a1c1c" : "#fef2f2",
              color: "#dc2626",
              transition: "all 0.15s ease",
            }}
          >
            Reject
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${borderColor}`, paddingTop: 12 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: textMuted,
              display: "block",
              marginBottom: 6,
            }}
          >
            Reviewer notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Reason for approval or rejection…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
              background: isDark ? "#0f1d14" : "#fff",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontSize: 13,
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function AdminEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewError, setReviewError] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewPendingEvidence(id, { status, notes }),
    onSuccess: () => {
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
    },
    onError: (err) => setReviewError(err.message),
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

  const { evidence = [], total = 0 } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review Queue"
        subtitle="Community-submitted LCA citations awaiting admin approval. Approved entries appear on product detail pages."
      />

      <div style={pageContainer(860)}>
        {reviewError && (
          <div role="alert" style={{ ...errorAlert(isDark), marginBottom: 16, fontSize: 13 }}>
            {reviewError}
          </div>
        )}

        {review.isSuccess && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#16a34a",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Decision recorded.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              margin: 0,
            }}
          >
            Pending Submissions
          </h2>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              background:
                total > 0 ? (isDark ? "#3a2800" : "#fef3c7") : isDark ? "#1c2e22" : "#f3f4f6",
              color: total > 0 ? "#92400e" : isDark ? "#6b8a6e" : "#999",
            }}
          >
            {total} pending
          </span>
        </div>

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 48 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <p style={{ margin: 0, fontSize: 14 }}>No pending submissions — the queue is clear.</p>
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(id, status, notes) => review.mutate({ id, status, notes })}
            />
          ))
        )}
      </div>
    </div>
  );
}
