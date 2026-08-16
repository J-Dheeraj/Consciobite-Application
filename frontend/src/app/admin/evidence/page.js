"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton } from "@/utils/pageStyles";

const SOURCE_TYPE_LABELS = {
  lca_study: "LCA Study",
  government: "Government",
  ngo: "NGO",
  industry: "Industry",
  peer_reviewed: "Peer-Reviewed",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [reviewing, setReviewing] = useState(null);

  const handleReview = async (status) => {
    setReviewing(status);
    try {
      await onReview(item.id, { status, notes: notes.trim() || undefined });
    } finally {
      setReviewing(null);
    }
  };

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#999";
  const borderColor = isDark ? "#2d4a35" : "#e5e7eb";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12 }),
        padding: 20,
        marginBottom: 14,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 4,
            }}
          >
            Product #{item.product_id}
          </div>
          <div style={{ fontSize: 13, color: mutedColor }}>
            Submitted {new Date(item.submitted_at).toLocaleDateString()} by user #{item.user_id}
          </div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            background: isDark ? "#1c2e22" : "#f3f4f6",
            color: isDark ? "#74c69d" : "#2d6a4f",
            alignSelf: "flex-start",
          }}
        >
          {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${borderColor}`,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 20px",
          fontSize: 13,
        }}
      >
        <div>
          <span style={{ color: mutedColor, fontWeight: 600 }}>Citation: </span>
          <span style={{ color: textColor }}>{item.citation}</span>
        </div>
        {item.year && (
          <div>
            <span style={{ color: mutedColor, fontWeight: 600 }}>Year: </span>
            <span style={{ color: textColor }}>{item.year}</span>
          </div>
        )}
        {item.methodology && (
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: mutedColor, fontWeight: 600 }}>Methodology: </span>
            <span style={{ color: textColor }}>{item.methodology}</span>
          </div>
        )}
        {item.url && (
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={{ color: mutedColor, fontWeight: 600 }}>URL: </span>
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

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={() => setExpanded((x) => !x)}
          style={{
            alignSelf: "flex-start",
            padding: "5px 12px",
            borderRadius: 8,
            border: `1px solid ${borderColor}`,
            background: "none",
            color: mutedColor,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {expanded ? "Hide notes" : "Add review notes (optional)"}
        </button>

        {expanded && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reviewer notes (optional)..."
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: 8,
              border: `2px solid ${borderColor}`,
              background: isDark ? "#0d1a10" : "#f9fafb",
              color: textColor,
              fontSize: 13,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => handleReview("approved")}
            disabled={!!reviewing}
            style={{
              ...primaryButton({ loading: reviewing === "approved" }),
              fontSize: 13,
              padding: "9px 20px",
            }}
          >
            {reviewing === "approved" ? "Approving..." : "Approve"}
          </button>
          <button
            onClick={() => handleReview("rejected")}
            disabled={!!reviewing}
            style={{
              padding: "9px 20px",
              borderRadius: 12,
              border: "none",
              cursor: reviewing ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: reviewing === "rejected" ? "#fca5a5" : "#fee2e2",
              color: "#c5303c",
              opacity: reviewing ? 0.7 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {reviewing === "rejected" ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
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
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
  });

  const review = useMutation({
    mutationFn: ({ id, decision }) => reviewEvidence(id, decision),
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
        title="Evidence Review Queue"
        subtitle="Community-submitted citations awaiting admin review. Approved entries become publicly visible on the product page."
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
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isDark ? "#b0c4b1" : "#555",
            }}
          >
            {evidence.length === 0
              ? "No pending submissions"
              : `${evidence.length} pending submission${evidence.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {review.isError && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: isDark ? "#2a1519" : "#fef2f2",
              color: "#e63946",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #fecaca",
              marginBottom: 16,
            }}
          >
            {review.error?.message || "Review failed. Please try again."}
          </div>
        )}

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14 }),
              padding: 40,
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: "1rem" }}>Queue is clear</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              All community evidence submissions have been reviewed.
            </div>
          </div>
        ) : (
          evidence.map((item) => (
            <EvidenceCard
              key={item.id}
              item={item}
              isDark={isDark}
              onReview={(id, decision) => review.mutateAsync({ id, decision })}
            />
          ))
        )}
      </div>
    </div>
  );
}
