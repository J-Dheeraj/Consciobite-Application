"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, inputField } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceRow({ item, isDark }) {
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState(null);
  const queryClient = useQueryClient();

  const review = useMutation({
    mutationFn: ({ status }) => reviewEvidence(item.id, status, notes),
    onSuccess: (_, { status }) => {
      setFeedback({ type: "success", message: `Submission ${status}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence-count"] });
    },
    onError: (err) => setFeedback({ type: "error", message: err.message }),
  });

  const textMuted = isDark ? "#7a9a7e" : "#777";
  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        marginBottom: 16,
        borderLeft: `4px solid ${isDark ? "#40916c" : "#2d6a4f"}`,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: isDark ? "#6ee7b7" : "#2d6a4f",
              padding: "2px 8px",
              borderRadius: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginRight: 8,
            }}
          >
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </span>
          <span style={{ fontSize: 12, color: textMuted }}>
            Product #{item.product_id} — submitted by{" "}
            <strong style={{ color: isDark ? "#b0c4b1" : "#444" }}>{item.submitter_email}</strong>
          </span>
        </div>
        <span style={{ fontSize: 12, color: textMuted }}>
          {new Date(item.submitted_at).toLocaleDateString()}
          {item.year && ` · ${item.year}`}
        </span>
      </div>

      <p
        style={{
          fontSize: 14,
          color: isDark ? "#d1e8d2" : "#1a3a2a",
          lineHeight: 1.6,
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {item.citation}
      </p>

      {item.methodology && (
        <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.5, marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Methodology: </span>
          {item.methodology}
        </p>
      )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            fontSize: 12,
            color: isDark ? "#6ee7b7" : "#2d6a4f",
            textDecoration: "underline",
            marginBottom: 14,
            wordBreak: "break-all",
          }}
        >
          {item.url}
        </a>
      )}

      {feedback ? (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background:
              feedback.type === "success"
                ? isDark
                  ? "#1c3a25"
                  : "#ecfdf5"
                : isDark
                  ? "#2a1519"
                  : "#fef2f2",
            color: feedback.type === "success" ? "#27ae60" : "#e63946",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.message}
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 14, marginTop: 6 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: textMuted,
              marginBottom: 6,
            }}
          >
            Notes (optional — required for rejections)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Methodology not clearly described; please provide a DOI."
            rows={2}
            style={{
              ...inputField(isDark, { radius: 8, fullWidth: true }),
              resize: "vertical",
              marginBottom: 12,
              fontSize: 13,
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => review.mutate({ status: "approved" })}
              disabled={review.isPending}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: review.isPending ? "wait" : "pointer",
                fontWeight: 700,
                fontSize: 13,
                background: review.isPending
                  ? "#95d5b2"
                  : "linear-gradient(135deg, #27ae60, #2ecc71)",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(39,174,96,0.3)",
              }}
            >
              {review.isPending ? "Saving..." : "Approve"}
            </button>
            <button
              onClick={() => review.mutate({ status: "rejected" })}
              disabled={review.isPending}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: review.isPending ? "wait" : "pointer",
                fontWeight: 700,
                fontSize: 13,
                background: "transparent",
                color: "#e74c3c",
                outline: "2px solid #e74c3c",
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

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: () => fetchPendingEvidence({ limit: 100 }),
    enabled: isAuthenticated,
  });

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
        icon="🔬"
        title="Evidence Review"
        subtitle="Approve or reject community-submitted LCA citations. Approved entries appear on product detail pages."
      />

      <div style={pageContainer(800)}>
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              color: isDark ? "#7a9a7e" : "#999",
              background: isDark ? "#162419" : "#f9fafb",
              borderRadius: 14,
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <strong style={{ display: "block", marginBottom: 6 }}>All caught up</strong>
            No pending evidence submissions.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDark ? "#b0c4b1" : "#555",
                }}
              >
                {items.length} pending submission{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {items.map((item) => (
              <EvidenceRow key={item.id} item={item} isDark={isDark} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
