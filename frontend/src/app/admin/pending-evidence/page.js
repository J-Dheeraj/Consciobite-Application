"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, inputField, errorAlert } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, isDark, onApprove, onReject, loading }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        ...card(isDark, { padding: 20, radius: 12 }),
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c3a25" : "#d1fae5",
                color: isDark ? "#6ee7b7" : "#065f46",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span
                style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}
              >
                {item.year}
              </span>
            )}
          </div>

          <div
            style={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Product #{item.product_id}
          </div>

          <div
            style={{
              fontSize: "0.85rem",
              color: isDark ? "#b0c4b1" : "#444",
              lineHeight: 1.5,
              marginBottom: 6,
            }}
          >
            {item.citation}
          </div>

          {item.methodology && (
            <div
              style={{
                fontSize: "0.8rem",
                color: isDark ? "#6b8a6e" : "#666",
                fontStyle: "italic",
                marginBottom: 4,
              }}
            >
              Methodology: {item.methodology}
            </div>
          )}

          {item.url && (
            <div style={{ fontSize: "0.8rem", marginBottom: 4 }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#6ee7b7" : "#2d6a4f" }}
              >
                {item.url.length > 60 ? item.url.slice(0, 60) + "…" : item.url}
              </a>
            </div>
          )}

          <div
            style={{ fontSize: "0.75rem", color: isDark ? "#4a6550" : "#bbb", marginTop: 4 }}
          >
            Submitted by {item.submitter_email} &middot;{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
          <button
            style={{
              ...primaryButton({ loading }),
              background: loading ? "#95d5b2" : "linear-gradient(135deg, #2d6a4f, #40916c)",
              fontSize: "0.85rem",
              padding: "8px 16px",
            }}
            onClick={() => onApprove(item.id, notes)}
            disabled={loading}
          >
            ✓ Approve
          </button>
          <button
            style={{
              padding: "8px 16px",
              background: loading ? "#fca5a5" : "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: loading ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
            }}
            onClick={() => onReject(item.id, notes)}
            disabled={loading}
          >
            ✗ Reject
          </button>
          <button
            style={{
              padding: "6px 12px",
              background: "transparent",
              color: isDark ? "#6b8a6e" : "#999",
              border: `1px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: "0.78rem",
            }}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide notes" : "Add notes"}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <textarea
            placeholder="Reviewer notes (optional)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{
              ...inputField(isDark, { fullWidth: true }),
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "0.85rem",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function PendingEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onMutate: ({ id }) => setReviewingId(id),
    onSettled: () => {
      setReviewingId(null);
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
    },
  });

  const handleApprove = (id, notes) => review.mutate({ id, status: "approved", notes });
  const handleReject = (id, notes) => review.mutate({ id, status: "rejected", notes });

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to review evidence submissions."
        />
      </div>
    );
  }

  const items = data?.evidence ?? [];

  return (
    <div>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle="Approve or reject community-submitted evidence citations before they go public."
      />

      <div style={pageContainer(800)}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "28px 0 20px",
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
            {!isLoading && (
              <span
                style={{
                  marginLeft: 10,
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  background: items.length > 0 ? "#fef3c7" : isDark ? "#1c2e22" : "#f3f4f6",
                  color: items.length > 0 ? "#92400e" : isDark ? "#6b8a6e" : "#999",
                }}
              >
                {items.length}
              </span>
            )}
          </h2>
        </div>

        {isLoading && <Spinner />}

        {error && (
          <div style={errorAlert(isDark)}>
            Failed to load pending evidence. {error.message || "Please try again."}
          </div>
        )}

        {review.isError && (
          <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>
            Review action failed. {review.error?.message || "Please try again."}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div
            style={{
              ...card(isDark, { padding: 40, radius: 14 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600 }}>All caught up</div>
            <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
              No pending evidence submissions to review.
            </div>
          </div>
        )}

        {items.map((item) => (
          <EvidenceCard
            key={item.id}
            item={item}
            isDark={isDark}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={reviewingId === item.id}
          />
        ))}
      </div>
    </div>
  );
}
