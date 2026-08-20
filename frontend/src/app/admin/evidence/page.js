"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, errorAlert } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceRow({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        ...card(isDark, { padding: 16, radius: 10 }),
        marginBottom: 12,
        borderLeft: `4px solid ${isDark ? "#40916c" : "#2d6a4f"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c3a25" : "#d1fae5",
                color: isDark ? "#a7f3d0" : "#065f46",
              }}
            >
              Product: {item.product_id}
            </span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: isDark ? "#1e2a38" : "#eff6ff",
                color: isDark ? "#93c5fd" : "#1d4ed8",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  background: isDark ? "#1c2e22" : "#f3f4f6",
                  color: isDark ? "#6b8a6e" : "#6b7280",
                }}
              >
                {item.year}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            {item.citation}
          </div>
          {item.url && (
            <div style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#6b7280" }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#6ee7b7" : "#2d6a4f" }}
              >
                {item.url}
              </a>
            </div>
          )}
          <div
            style={{
              fontSize: 11,
              color: isDark ? "#6b8a6e" : "#9ca3af",
              marginTop: 4,
            }}
          >
            By {item.submitter_email} · {new Date(item.submitted_at).toLocaleDateString()}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
            background: "transparent",
            color: isDark ? "#b0c4b1" : "#6b7280",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? "Hide Review" : "Review"}
        </button>
      </div>

      {item.methodology && (
        <div
          style={{
            fontSize: 12,
            color: isDark ? "#6b8a6e" : "#6b7280",
            marginTop: 8,
            padding: "8px 10px",
            background: isDark ? "#0f1d14" : "#f9fafb",
            borderRadius: 6,
          }}
        >
          <span style={{ fontWeight: 600 }}>Methodology: </span>
          {item.methodology}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${isDark ? "#1c2e22" : "#e5e7eb"}` }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reviewer notes (optional, max 500 chars)..."
            maxLength={500}
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
              background: isDark ? "#0f1d14" : "#fff",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontSize: 13,
              resize: "vertical",
              marginBottom: 10,
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onReview(item.id, "approved", notes)}
              disabled={reviewing}
              style={{
                ...primaryButton({ loading: reviewing }),
                padding: "8px 18px",
                fontSize: 13,
              }}
            >
              Approve
            </button>
            <button
              onClick={() => onReview(item.id, "rejected", notes)}
              disabled={reviewing}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                cursor: reviewing ? "wait" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: reviewing ? "#fca5a5" : "#e63946",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(230,57,70,0.3)",
              }}
            >
              Reject
            </button>
          </div>
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
  const [reviewingId, setReviewingId] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, status, notes),
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_, { status }) => {
      setActionResult({ type: status, message: `Evidence ${status}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      setTimeout(() => setActionResult(null), 3000);
    },
    onSettled: () => setReviewingId(null),
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
        subtitle={`${total} pending submission${total !== 1 ? "s" : ""} awaiting admin review. Approved evidence appears on product pages.`}
      />

      <div style={pageContainer(840)}>
        {actionResult && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontWeight: 600,
              fontSize: 13,
              background:
                actionResult.type === "approved"
                  ? isDark
                    ? "#1c3a25"
                    : "#ecfdf5"
                  : isDark
                    ? "#2a1519"
                    : "#fef2f2",
              color: actionResult.type === "approved" ? "#27ae60" : "#e63946",
              border: `1px solid ${actionResult.type === "approved" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {actionResult.message}
          </div>
        )}

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { padding: 40, radius: 14 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#9ca3af",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Queue is empty</div>
            <div style={{ fontSize: 13 }}>No pending evidence submissions.</div>
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(id, status, notes) => reviewMutation.mutate({ id, status, notes })}
              reviewing={reviewingId === item.id && reviewMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}
