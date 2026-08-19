"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import {
  pageContainer,
  card,
  primaryButton,
  inputField,
  errorAlert,
  formLabel,
} from "@/utils/pageStyles";

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

  const textColor = isDark ? "#c8d6c8" : "#444";
  const subColor = isDark ? "#6b8a6e" : "#888";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 18 }),
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
        marginBottom: 14,
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2d6a4f",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Product #{item.product_id} &middot;{" "}
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
              wordBreak: "break-word",
            }}
          >
            {item.citation}
          </div>
          <div style={{ fontSize: 12, color: subColor }}>
            Submitted by {item.submitter_email} &middot;{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
            {item.year ? ` · Year: ${item.year}` : ""}
          </div>
          {(item.url || item.methodology) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#2d6a4f",
                fontSize: 12,
                padding: "4px 0",
                marginTop: 4,
              }}
            >
              {expanded ? "Hide details ▲" : "Show details ▼"}
            </button>
          )}
          {expanded && (
            <div style={{ marginTop: 8, fontSize: 13, color: textColor }}>
              {item.methodology && (
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Methodology: </span>
                  {item.methodology}
                </div>
              )}
              {item.url && (
                <div>
                  <span style={{ fontWeight: 600 }}>URL: </span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2d6a4f", wordBreak: "break-all" }}
                  >
                    {item.url}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={formLabel(isDark)}>Reviewer notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context or reason for decision..."
          maxLength={500}
          rows={2}
          style={{
            ...inputField(isDark, { radius: 8, fullWidth: true }),
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          disabled={reviewing}
          onClick={() => onReview(item.id, "approved", notes)}
          style={{
            ...primaryButton({ loading: reviewing }),
            padding: "8px 20px",
            fontSize: 13,
          }}
        >
          Approve
        </button>
        <button
          disabled={reviewing}
          onClick={() => onReview(item.id, "rejected", notes)}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: `1px solid ${isDark ? "#4a2a2a" : "#fecaca"}`,
            background: isDark ? "#2a1519" : "#fef2f2",
            color: "#e63946",
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function PendingEvidencePage() {
  const { isAuthenticated, initializing } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 50 }),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onMutate: ({ id }) => {
      setReviewingId(id);
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
      setReviewingId(null);
    },
    onError: (err) => {
      setActionError(err.message || "Action failed");
      setReviewingId(null);
    },
  });

  const handleReview = (id, status, notes) => {
    mutation.mutate({ id, status, notes });
  };

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
          title={isAdminError ? "Admin Role Required" : "Error"}
          subtitle={isAdminError ? "Admin role required to view this page." : error.message}
        />
      </div>
    );
  }

  const items = data?.evidence ?? [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Pending Evidence Review"
        subtitle={`${items.length} submission${items.length !== 1 ? "s" : ""} awaiting review`}
      />
      <div style={pageContainer(760)}>
        {actionError && (
          <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>{actionError}</div>
        )}
        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 32 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#aaa",
              fontSize: 15,
            }}
          >
            No pending submissions — all caught up!
          </div>
        ) : (
          items.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              reviewing={reviewingId === item.id}
              onReview={handleReview}
            />
          ))
        )}
      </div>
    </div>
  );
}
