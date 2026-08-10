"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidenceItem } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, inputField, errorAlert, formLabel } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        marginBottom: 16,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c3a25" : "#ecfdf5",
                color: isDark ? "#6ee7b7" : "#065f46",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>
              Product #{item.product_id}
            </span>
            <span style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#999" }}>
              {new Date(item.submitted_at).toLocaleDateString()}
            </span>
          </div>

          <p
            style={{
              margin: "0 0 4px",
              fontWeight: 600,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {item.citation}
          </p>

          <p style={{ margin: 0, fontSize: 12, color: isDark ? "#6b8a6e" : "#777" }}>
            Submitted by {item.submitter_email}
            {item.year ? ` · ${item.year}` : ""}
          </p>
        </div>
      </div>

      {(item.methodology || item.url) && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? "#52b788" : "#2d6a4f",
              padding: 0,
            }}
            aria-expanded={expanded}
          >
            {expanded ? "Hide details ▲" : "Show details ▼"}
          </button>
          {expanded && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 8,
                background: isDark ? "#1a2e1f" : "#f9fafb",
                fontSize: 13,
              }}
            >
              {item.methodology && (
                <p style={{ margin: "0 0 6px", color: isDark ? "#b0c4b1" : "#555" }}>
                  <strong>Methodology:</strong> {item.methodology}
                </p>
              )}
              {item.url && (
                <p style={{ margin: 0, color: isDark ? "#b0c4b1" : "#555" }}>
                  <strong>URL:</strong>{" "}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: isDark ? "#52b788" : "#2d6a4f" }}
                  >
                    {item.url}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <label style={{ ...formLabel(isDark), display: "block", marginBottom: 6 }}>
          Reviewer notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note explaining your decision..."
          maxLength={500}
          rows={2}
          style={{
            ...inputField(isDark, { fullWidth: true }),
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: 13,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button
          onClick={() => onReview(item.id, "approved", notes)}
          disabled={reviewing}
          style={{
            ...primaryButton({ loading: reviewing }),
            padding: "9px 20px",
            fontSize: 13,
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onReview(item.id, "rejected", notes)}
          disabled={reviewing}
          style={{
            padding: "9px 20px",
            borderRadius: 12,
            border: `1px solid ${isDark ? "#4a2020" : "#fecaca"}`,
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: isDark ? "#2a1519" : "#fef2f2",
            color: "#e63946",
            transition: "all 0.15s ease",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function PendingEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const [reviewingId, setReviewingId] = useState(null);
  const [toast, setToast] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidenceItem(id, { status, notes }),
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
      setToast({ ok: true, msg: `Evidence ${status}.` });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ ok: false, msg: err.message || "Review failed." });
      setTimeout(() => setToast(null), 4000);
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

  const items = data?.evidence ?? [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Pending Evidence Review"
        subtitle={`${items.length} community submission${items.length !== 1 ? "s" : ""} awaiting review. Approved citations appear on product pages.`}
      />

      <div style={pageContainer(860)}>
        {toast && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              fontWeight: 600,
              fontSize: 13,
              background: toast.ok
                ? isDark ? "#1c3a25" : "#ecfdf5"
                : isDark ? "#2a1519" : "#fef2f2",
              color: toast.ok ? "#27ae60" : "#e63946",
            }}
            role="status"
          >
            {toast.msg}
          </div>
        )}

        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 48 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
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
              reviewing={reviewingId === item.id && review.isPending}
              onReview={(id, status, notes) => review.mutate({ id, status, notes })}
            />
          ))
        )}
      </div>
    </div>
  );
}
