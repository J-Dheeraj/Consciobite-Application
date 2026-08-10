"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, inputField, formLabel } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed: "Peer-Reviewed",
  government: "Government",
  ngo: "NGO",
  industry: "Industry",
  user_submitted: "User Submitted",
  other: "Other",
};

function StatusBadge({ status }) {
  const colors = {
    pending: { bg: "#fef3c7", color: "#92400e" },
    approved: { bg: "#ecfdf5", color: "#27ae60" },
    rejected: { bg: "#fef2f2", color: "#e63946" },
  };
  const s = colors[status] || colors.pending;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);
  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#999";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 12,
        border: `1px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
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
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? "#a7f3d0" : "#2d6a4f" }}>
              Product #{item.product_id}
            </span>
            {item.source_type && (
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  background: isDark ? "#1c2e22" : "#f0fdf4",
                  color: isDark ? "#74c69d" : "#2d6a4f",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
              </span>
            )}
            {item.year && <span style={{ fontSize: 11, color: mutedColor }}>{item.year}</span>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: textColor, lineHeight: 1.6 }}>
            {item.citation}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {(item.url || item.methodology) && (
        <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: isDark ? "#74c69d" : "#2d6a4f",
                textDecoration: "underline",
              }}
            >
              Source link
            </a>
          )}
          {item.methodology && (
            <span style={{ fontSize: 12, color: mutedColor }}>Method: {item.methodology}</span>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: mutedColor }}>
        Submitted {new Date(item.submitted_at).toLocaleDateString()} by user #{item.user_id}
        {item.reviewer_id && ` · Reviewed by user #${item.reviewer_id}`}
        {item.reviewer_notes && ` · Note: ${item.reviewer_notes}`}
      </div>

      {item.status === "pending" && (
        <div style={{ marginTop: 14 }}>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: isDark ? "#74c69d" : "#2d6a4f",
              padding: 0,
              fontWeight: 600,
            }}
          >
            {expanded ? "Hide review form" : "Review this submission"}
          </button>

          {expanded && (
            <div style={{ marginTop: 12 }}>
              <label>
                <span style={formLabel(isDark)}>Optional reviewer notes</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for approval or rejection..."
                  maxLength={500}
                  style={inputField(isDark, { radius: 8, fullWidth: true })}
                />
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => onReview(item.id, "approved", notes)}
                  disabled={reviewing}
                  style={{
                    ...primaryButton({ loading: reviewing }),
                    padding: "9px 18px",
                    fontSize: 13,
                  }}
                >
                  {reviewing ? "Saving..." : "Approve"}
                </button>
                <button
                  onClick={() => onReview(item.id, "rejected", notes)}
                  disabled={reviewing}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "none",
                    cursor: reviewing ? "wait" : "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                    background: isDark ? "#3a1c1c" : "#fef2f2",
                    color: "#e63946",
                    transition: "all 0.15s ease",
                  }}
                >
                  {reviewing ? "Saving..." : "Reject"}
                </button>
              </div>
            </div>
          )}
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
  const [toast, setToast] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 100 }),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onMutate: ({ id }) => setReviewingId(id),
    onSettled: () => setReviewingId(null),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      setToast(`Evidence ${status} successfully.`);
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast(`Error: ${err.message}`);
      setTimeout(() => setToast(null), 4000);
    },
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

  const { evidence = [] } = data;
  const pending = evidence.filter((e) => e.status === "pending");
  const reviewed = evidence.filter((e) => e.status !== "pending");

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Community Evidence Review"
        subtitle="Approve or reject user-submitted literature citations. Approved entries surface on product pages."
      />

      <div style={pageContainer(860)}>
        {toast && (
          <div
            role="status"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: toast.startsWith("Error")
                ? isDark
                  ? "#2a1519"
                  : "#fef2f2"
                : isDark
                  ? "#1c3a25"
                  : "#ecfdf5",
              color: toast.startsWith("Error") ? "#e63946" : "#27ae60",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              border: `1px solid ${toast.startsWith("Error") ? "#fecaca" : "#bbf7d0"}`,
            }}
          >
            {toast}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {[
            { label: "Pending", value: pending.length, accent: "#f39c12" },
            {
              label: "Approved",
              value: reviewed.filter((e) => e.status === "approved").length,
              accent: "#27ae60",
            },
            {
              label: "Rejected",
              value: reviewed.filter((e) => e.status === "rejected").length,
              accent: "#e63946",
            },
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              style={{
                ...card(isDark, { radius: 12, padding: 18 }),
                flex: 1,
                minWidth: 120,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: accent,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDark ? "#b0c4b1" : "#555",
                  marginTop: 4,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Pending submissions */}
        <h3
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: 14,
            color: isDark ? "#e8f5e9" : "#1a3a2a",
          }}
        >
          Pending ({pending.length})
        </h3>

        {pending.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 12, padding: 32 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            No pending submissions. All caught up.
          </div>
        ) : (
          <div style={{ marginBottom: 28 }}>
            {pending.map((item) => (
              <EvidenceCard
                key={item.id}
                item={item}
                isDark={isDark}
                reviewing={reviewingId === item.id}
                onReview={(id, status, notes) => review.mutate({ id, status, notes })}
              />
            ))}
          </div>
        )}

        {/* Previously reviewed */}
        {reviewed.length > 0 && (
          <>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: 14,
                color: isDark ? "#e8f5e9" : "#1a3a2a",
              }}
            >
              Previously Reviewed ({reviewed.length})
            </h3>
            <div>
              {reviewed.map((item) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  reviewing={false}
                  onReview={() => {}}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
