"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewPendingEvidence } from "@/services/admin";
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
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function SourceBadge({ type, isDark }) {
  const label = SOURCE_TYPE_LABELS[type] || type;
  const isPrimary = type === "peer_reviewed_lca" || type === "lca_database";
  return (
    <span
      style={{
        padding: "2px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: isPrimary ? (isDark ? "#1c3a25" : "#ecfdf5") : isDark ? "#1c2e22" : "#f3f4f6",
        color: isPrimary ? "#27ae60" : isDark ? "#6b8a6e" : "#888",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textMuted = isDark ? "#6b8a6e" : "#999";
  const textBody = isDark ? "#c8d6c8" : "#444";

  return (
    <div
      style={{
        ...card(isDark, { radius: 14 }),
        padding: 20,
        marginBottom: 16,
        borderLeft: `4px solid ${isDark ? "#2d4a35" : "#b7e4c7"}`,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link
            href={`/product/${item.product_id}`}
            style={{
              fontWeight: 700,
              color: isDark ? "#74c69d" : "#2d6a4f",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Product #{item.product_id}
          </Link>
          <SourceBadge type={item.source_type} isDark={isDark} />
          {item.year && (
            <span style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>{item.year}</span>
          )}
        </div>
        <span style={{ fontSize: 11, color: textMuted }}>
          Submitted {new Date(item.submitted_at).toLocaleDateString()} by {item.submitter_email}
        </span>
      </div>

      {/* Citation */}
      <p
        style={{
          fontSize: 14,
          color: textBody,
          lineHeight: 1.6,
          marginBottom: item.methodology || item.url ? 10 : 16,
          wordBreak: "break-word",
        }}
      >
        {item.citation}
      </p>

      {/* Optional fields */}
      {(item.methodology || item.url) && (
        <div style={{ marginBottom: 14 }}>
          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: "none",
                border: "none",
                color: isDark ? "#74c69d" : "#2d6a4f",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                padding: 0,
              }}
            >
              Show details ▾
            </button>
          )}
          {expanded && (
            <div
              style={{
                fontSize: 13,
                color: textBody,
                lineHeight: 1.6,
                borderTop: `1px solid ${isDark ? "#2d4a35" : "#f0f0f0"}`,
                paddingTop: 10,
              }}
            >
              {item.methodology && (
                <p style={{ marginBottom: 6 }}>
                  <strong style={{ color: isDark ? "#b0c4b1" : "#555" }}>Methodology:</strong>{" "}
                  {item.methodology}
                </p>
              )}
              {item.url && (
                <p>
                  <strong style={{ color: isDark ? "#b0c4b1" : "#555" }}>URL:</strong>{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: isDark ? "#74c69d" : "#2d6a4f", wordBreak: "break-all" }}
                  >
                    {item.url}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Review area */}
      <div
        style={{
          borderTop: `1px solid ${isDark ? "#1c2e22" : "#f0f0f0"}`,
          paddingTop: 14,
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <label>
            <span style={formLabel(isDark)}>Reviewer notes (optional)</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for approval or rejection..."
              disabled={reviewing}
              style={inputField(isDark, { radius: 8, fullWidth: true })}
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onReview(item.id, "approved", notes)}
            disabled={reviewing}
            style={{
              ...primaryButton({ loading: reviewing }),
              padding: "10px 20px",
              fontSize: 13,
            }}
          >
            {reviewing ? "..." : "Approve"}
          </button>
          <button
            onClick={() => onReview(item.id, "rejected", notes)}
            disabled={reviewing}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: reviewing ? "#f5c6cb" : isDark ? "#2a1519" : "#fef2f2",
              color: reviewing ? "#999" : "#e63946",
              transition: "all 0.2s ease",
            }}
          >
            {reviewing ? "..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [lastAction, setLastAction] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: fetchPendingEvidence,
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewPendingEvidence(id, status, notes),
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_res, { id, status }) => {
      setLastAction({ id, status });
      queryClient.setQueryData(["pending-evidence"], (old) => {
        if (!old) return old;
        return { ...old, evidence: old.evidence.filter((e) => e.id !== id) };
      });
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

  const pending = data?.evidence ?? [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle={
          pending.length === 0
            ? "No pending submissions — all caught up."
            : `${pending.length} community submission${pending.length !== 1 ? "s" : ""} awaiting review.`
        }
      />

      <div style={pageContainer(820)}>
        {lastAction && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 600,
              background:
                lastAction.status === "approved"
                  ? isDark
                    ? "#1c3a25"
                    : "#ecfdf5"
                  : isDark
                    ? "#2a1519"
                    : "#fef2f2",
              color: lastAction.status === "approved" ? "#27ae60" : "#e63946",
            }}
          >
            Evidence #{lastAction.id}{" "}
            {lastAction.status === "approved" ? "approved and now public." : "rejected."}
          </div>
        )}

        {review.error && (
          <div role="alert" style={{ ...errorAlert(isDark), fontSize: 13, marginBottom: 16 }}>
            {review.error.message}
          </div>
        )}

        {pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 40 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#aaa",
              fontSize: 15,
            }}
          >
            No pending submissions. New community evidence will appear here.
          </div>
        ) : (
          pending.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              reviewing={reviewingId === item.id}
              onReview={(id, status, notes) => review.mutate({ id, status, notes })}
            />
          ))
        )}
      </div>
    </div>
  );
}
