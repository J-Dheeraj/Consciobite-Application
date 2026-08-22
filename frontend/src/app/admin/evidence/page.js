"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceRow({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#999";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 14,
        animation: "fadeIn 0.3s ease",
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
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                background: isDark ? "#1c2e22" : "#f0fdf4",
                color: isDark ? "#a7f3d0" : "#166534",
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
                background: isDark ? "#1c2535" : "#eff6ff",
                color: isDark ? "#93c5fd" : "#1e40af",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            {item.citation}
          </p>

          {item.methodology && (
            <p style={{ fontSize: 13, color: textColor, marginBottom: 4, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600 }}>Methodology:</span> {item.methodology}
            </p>
          )}

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 6 }}>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: isDark ? "#6ee7b7" : "#2d6a4f",
                  textDecoration: "underline",
                }}
              >
                View Source
              </a>
            )}
            {item.year && (
              <span style={{ fontSize: 12, color: mutedColor }}>Year: {item.year}</span>
            )}
            <span style={{ fontSize: 12, color: mutedColor }}>
              Submitted by: {item.submitter_email}
            </span>
            <span style={{ fontSize: 12, color: mutedColor }}>
              {new Date(item.submitted_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 120 }}>
          <button
            onClick={() => onReview(item.id, "approved", "")}
            disabled={reviewing}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: reviewing ? (isDark ? "#1c3a25" : "#d1fae5") : "#27ae60",
              color: reviewing ? "#27ae60" : "#fff",
              transition: "all 0.15s ease",
            }}
          >
            {reviewing ? "..." : "Approve"}
          </button>
          <button
            onClick={() => setShowRejectForm((v) => !v)}
            disabled={reviewing}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: `1px solid ${isDark ? "#4a1c1c" : "#fecaca"}`,
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: isDark ? "#2e1c1c" : "#fff5f5",
              color: isDark ? "#fca5a5" : "#dc2626",
              transition: "all 0.15s ease",
            }}
          >
            Reject
          </button>
        </div>
      </div>

      {showRejectForm && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 8,
            background: isDark ? "#1e1212" : "#fff5f5",
            border: `1px solid ${isDark ? "#4a1c1c" : "#fecaca"}`,
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: isDark ? "#fca5a5" : "#dc2626",
              marginBottom: 6,
            }}
          >
            Rejection reason (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Why is this submission being rejected?"
            style={{
              width: "100%",
              borderRadius: 6,
              border: `1px solid ${isDark ? "#4a1c1c" : "#fecaca"}`,
              background: isDark ? "#1a1010" : "#fff",
              color: isDark ? "#e8d5d5" : "#1a1a1a",
              padding: "8px 10px",
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={() => {
              onReview(item.id, "rejected", notes);
              setShowRejectForm(false);
            }}
            disabled={reviewing}
            style={{
              marginTop: 8,
              padding: "6px 16px",
              borderRadius: 6,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 12,
              background: "#dc2626",
              color: "#fff",
            }}
          >
            Confirm Reject
          </button>
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

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-evidence"],
    queryFn: fetchPendingEvidence,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });

  const review = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, status, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pending-evidence"] }),
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

  if (isLoading) return <Spinner message="Loading pending submissions..." />;

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
        title="Evidence Review"
        subtitle="Community-submitted evidence citations awaiting admin approval or rejection."
      />

      <div style={pageContainer(860)}>
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
              fontSize: "1.1rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              margin: 0,
            }}
          >
            Pending Submissions ({total})
          </h2>
        </div>

        {review.isError && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: isDark ? "#2e1c1c" : "#fff5f5",
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {review.error?.message || "Failed to submit review. Please try again."}
          </div>
        )}

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 48,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>No pending submissions</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              All community evidence has been reviewed. Check back later.
            </div>
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(id, status, notes) => review.mutate({ id, status, notes })}
              reviewing={review.isPending && review.variables?.id === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
