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
  peer_reviewed_lca: "Peer-reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function EvidenceRow({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const handleApprove = () => onReview(item.id, { status: "approved", notes: "" });
  const handleReject = () => {
    if (!showNotes) {
      setShowNotes(true);
      return;
    }
    onReview(item.id, { status: "rejected", notes });
  };

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 18 }),
        marginBottom: 12,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                background: isDark ? "#1c2e22" : "#f0faf4",
                color: isDark ? "#74c69d" : "#2d6a4f",
              }}
            >
              Product #{item.product_id}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 6,
                background: isDark ? "#1e2a3a" : "#f0f4ff",
                color: isDark ? "#90b4e8" : "#3a5db0",
              }}
            >
              {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
            </span>
            {item.year && (
              <span style={{ fontSize: 11, color: isDark ? "#6b8a6e" : "#999" }}>
                {item.year}
              </span>
            )}
          </div>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: isDark ? "#c8d6c8" : "#333",
              lineHeight: 1.5,
              marginBottom: 4,
            }}
          >
            {item.citation}
          </p>

          {item.methodology && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: isDark ? "#6b8a6e" : "#888",
                lineHeight: 1.5,
              }}
            >
              Methodology: {item.methodology}
            </p>
          )}

          {item.url && (
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#52b788" : "#2d6a4f", wordBreak: "break-all" }}
              >
                {item.url}
              </a>
            </p>
          )}

          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              color: isDark ? "#4a6b4e" : "#bbb",
            }}
          >
            Submitted by {item.submitter_email} ·{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleApprove}
            disabled={reviewing}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 12,
              background: isDark ? "#1c3a25" : "#ecfdf5",
              color: "#27ae60",
              transition: "all 0.15s ease",
            }}
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            disabled={reviewing}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 700,
              fontSize: 12,
              background: isDark ? "#3a1c1c" : "#fef2f2",
              color: "#e74c3c",
              transition: "all 0.15s ease",
            }}
          >
            {showNotes ? "Confirm Reject" : "Reject"}
          </button>
        </div>
      </div>

      {showNotes && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional rejection notes (visible to admin log, not the submitter)..."
            rows={2}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `2px solid ${isDark ? "#4a2828" : "#fecaca"}`,
              background: isDark ? "#1e1210" : "#fff",
              color: isDark ? "#c8d6c8" : "#333",
              fontSize: 13,
              resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function EvidenceReviewPage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, decision }) => reviewEvidence(id, decision),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-evidence"] }),
  });

  if (initializing) return null;

  if (!isAuthenticated) {
    return (
      <div>
        <PageHero
          icon="🔒"
          title="Admin Access Required"
          subtitle="Sign in with an admin account to review evidence."
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
          subtitle={isAdminError ? "Admin role required to review evidence." : error.message}
        />
      </div>
    );
  }

  const { evidence = [] } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🔬"
        title="Evidence Review"
        subtitle={`${evidence.length} pending submission${evidence.length !== 1 ? "s" : ""} awaiting review.`}
      />

      <div style={pageContainer(800)}>
        {review.isError && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: isDark ? "#2a1519" : "#fef2f2",
              color: "#e74c3c",
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
              border: "1px solid #fecaca",
            }}
          >
            {review.error?.message || "Review action failed. Please try again."}
          </div>
        )}

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 40 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>All caught up</p>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              No pending evidence submissions. New submissions will appear here.
            </p>
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceRow
              key={item.id}
              item={item}
              isDark={isDark}
              reviewing={review.isPending}
              onReview={(id, decision) => review.mutate({ id, decision })}
            />
          ))
        )}
      </div>
    </div>
  );
}
