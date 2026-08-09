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
        marginBottom: 16,
        borderLeft: `4px solid ${isDark ? "#2d6a4f" : "#40916c"}`,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              background: isDark ? "#1c2e22" : "#f0fdf4",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              marginBottom: 6,
            }}
          >
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </span>
          <div
            style={{
              fontSize: 12,
              color: mutedColor,
            }}
          >
            Product ID: <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>{item.product_id}</strong>
            {" · "}
            Submitted by{" "}
            <strong style={{ color: isDark ? "#e8f5e9" : "#1a3a2a" }}>{item.submitter_email}</strong>
            {" · "}
            {new Date(item.submitted_at).toLocaleDateString()}
            {item.year ? ` · ${item.year}` : ""}
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: mutedColor,
            fontSize: 13,
            padding: "2px 6px",
          }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>

      <p
        style={{
          color: textColor,
          fontSize: 14,
          lineHeight: 1.6,
          margin: "0 0 12px",
          fontStyle: "italic",
        }}
      >
        &ldquo;{item.citation}&rdquo;
      </p>

      {expanded && (
        <div style={{ marginBottom: 12 }}>
          {item.methodology && (
            <div style={{ fontSize: 13, color: textColor, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                Methodology:
              </span>{" "}
              {item.methodology}
            </div>
          )}
          {item.url && (
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: isDark ? "#e8f5e9" : "#1a3a2a" }}>
                URL:
              </span>{" "}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#40916c", wordBreak: "break-all" }}
              >
                {item.url}
              </a>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reviewer notes (optional)"
            style={inputField(isDark, { radius: 8, fullWidth: true })}
            disabled={reviewing}
          />
        </div>
        <button
          onClick={() => onReview({ id: item.id, status: "approved", notes: notes.trim() || undefined })}
          disabled={reviewing}
          style={{
            ...primaryButton({ loading: reviewing }),
            fontSize: 13,
            padding: "10px 18px",
            background: reviewing ? "#95d5b2" : "linear-gradient(135deg, #2d6a4f, #40916c)",
          }}
        >
          {reviewing ? "..." : "Approve"}
        </button>
        <button
          onClick={() => onReview({ id: item.id, status: "rejected", notes: notes.trim() || undefined })}
          disabled={reviewing}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: `2px solid ${isDark ? "#4a1c22" : "#fecaca"}`,
            background: reviewing ? "#f9e5e5" : isDark ? "#2a1519" : "#fff5f5",
            color: reviewing ? "#999" : "#e63946",
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {reviewing ? "..." : "Reject"}
        </button>
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
  const [globalError, setGlobalError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: fetchPendingEvidence,
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: reviewEvidence,
    onMutate: ({ id }) => setReviewingId(id),
    onSuccess: () => {
      setReviewingId(null);
      setGlobalError("");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
    },
    onError: (err) => {
      setReviewingId(null);
      setGlobalError(err.message);
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

  const items = data?.evidence || [];

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle="Approve or reject community-submitted evidence citations before they appear on product pages."
      />

      <div style={pageContainer(820)}>
        {globalError && (
          <div role="alert" style={{ ...errorAlert(isDark), marginBottom: 20 }}>
            {globalError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            <span
              style={{
                marginLeft: 8,
                padding: "2px 8px",
                borderRadius: 6,
                background: items.length > 0 ? "#fef3c7" : isDark ? "#1c2e22" : "#f3f4f6",
                color: items.length > 0 ? "#92400e" : isDark ? "#6b8a6e" : "#999",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {items.length}
            </span>
          </h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] })}
            style={{
              background: "none",
              border: `1px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
              borderRadius: 8,
              padding: "6px 14px",
              cursor: "pointer",
              color: isDark ? "#95d5b2" : "#2d6a4f",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 40 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: 6 }}>All caught up</div>
            <div style={{ fontSize: 14 }}>No pending evidence submissions to review.</div>
          </div>
        ) : (
          items.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(payload) => review.mutate(payload)}
              reviewing={reviewingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
