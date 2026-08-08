"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidenceSubmission } from "@/services/admin";
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

function sourceTypeBadge(type, isDark) {
  const colors = {
    peer_reviewed_lca: { bg: "#ecfdf5", color: "#27ae60" },
    lca_database: { bg: "#eff6ff", color: "#2563eb" },
    manufacturer_study: { bg: "#fef3c7", color: "#92400e" },
    industry_report: { bg: "#f5f3ff", color: "#6d28d9" },
    other: { bg: isDark ? "#1c2e22" : "#f3f4f6", color: isDark ? "#6b8a6e" : "#888" },
  };
  const style = colors[type] || colors.other;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: isDark && type !== "other" ? "rgba(0,0,0,0.3)" : style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {SOURCE_TYPE_LABELS[type] || type}
    </span>
  );
}

function ReviewPanel({ item, isDark, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const reviewMutation = useMutation({
    mutationFn: ({ status }) => reviewEvidenceSubmission(item.id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
      onClose();
    },
    onError: (err) => setError(err.message),
  });

  return (
    <div
      style={{
        marginTop: 8,
        padding: 16,
        borderRadius: 10,
        background: isDark ? "#0e1f16" : "#f8fffe",
        border: `1px solid ${isDark ? "#2d4a35" : "#c8e6c9"}`,
      }}
    >
      {error && (
        <div role="alert" style={{ ...errorAlert(isDark), fontSize: 13, marginBottom: 10 }}>
          {error}
        </div>
      )}
      <label style={formLabel(isDark)}>
        Review notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Explain your decision..."
          maxLength={500}
          rows={3}
          style={{
            ...inputField(isDark, { radius: 8 }),
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            marginTop: 6,
            fontFamily: "inherit",
            fontSize: "0.9rem",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          onClick={() => reviewMutation.mutate({ status: "approved" })}
          disabled={reviewMutation.isPending}
          style={{
            ...primaryButton({ loading: reviewMutation.isPending }),
            padding: "8px 16px",
            fontSize: 13,
          }}
        >
          Approve
        </button>
        <button
          onClick={() => reviewMutation.mutate({ status: "rejected" })}
          disabled={reviewMutation.isPending}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            cursor: reviewMutation.isPending ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: isDark ? "#3a1c1c" : "#fef2f2",
            color: "#e63946",
            transition: "all 0.15s ease",
          }}
        >
          Reject
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 13,
            background: isDark ? "#1c2e22" : "#f3f4f6",
            color: isDark ? "#6b8a6e" : "#777",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EvidenceRow({ item, isDark }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <Link
              href={`/product/${item.product_id}`}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? "#a7f3d0" : "#2d6a4f",
                textDecoration: "none",
              }}
            >
              Product #{item.product_id}
            </Link>
            {sourceTypeBadge(item.source_type, isDark)}
            {item.year && (
              <span style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#aaa" }}>
                {item.year}
              </span>
            )}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: isDark ? "#b0c4b1" : "#444",
              lineHeight: 1.5,
            }}
          >
            {item.citation}
          </p>
          {item.methodology && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: isDark ? "#6b8a6e" : "#888" }}>
              Method: {item.methodology}
            </p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: isDark ? "#74c69d" : "#40916c", display: "block", marginTop: 4 }}
            >
              {item.url.length > 60 ? item.url.slice(0, 57) + "…" : item.url}
            </a>
          )}
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#aaa", marginBottom: 6 }}>
            {new Date(item.submitted_at).toLocaleDateString()}
          </div>
          <div style={{ fontSize: 12, color: isDark ? "#6b8a6e" : "#888", marginBottom: 8 }}>
            {item.submitter_email}
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 12,
              background: expanded
                ? isDark
                  ? "#1c3a25"
                  : "#ecfdf5"
                : isDark
                  ? "#1c2e22"
                  : "#f3f4f6",
              color: expanded ? (isDark ? "#a7f3d0" : "#2d6a4f") : isDark ? "#6b8a6e" : "#777",
              transition: "all 0.15s ease",
            }}
          >
            {expanded ? "Cancel" : "Review"}
          </button>
        </div>
      </div>
      {expanded && (
        <ReviewPanel item={item} isDark={isDark} onClose={() => setExpanded(false)} />
      )}
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: fetchPendingEvidence,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
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

  const { evidence } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle="Community-submitted evidence citations awaiting admin review. Approved entries appear on product pages."
      />

      <div style={pageContainer(900)}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                background:
                  evidence.length > 0
                    ? isDark
                      ? "#3a2e1c"
                      : "#fef3c7"
                    : isDark
                      ? "#1c2e22"
                      : "#f3f4f6",
                color: evidence.length > 0 ? "#92400e" : isDark ? "#6b8a6e" : "#888",
              }}
            >
              {evidence.length} pending
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: isDark ? "#6b8a6e" : "#aaa" }}>
            Auto-refreshes every 60s
          </p>
        </div>

        <div
          style={{
            ...card(isDark),
            overflow: "hidden",
          }}
        >
          {evidence.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: isDark ? "#6b8a6e" : "#999",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                All caught up
              </div>
              <div style={{ fontSize: 13 }}>
                No pending evidence submissions. New submissions will appear here automatically.
              </div>
            </div>
          ) : (
            evidence.map((item) => (
              <EvidenceRow key={item.id} item={item} isDark={isDark} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
