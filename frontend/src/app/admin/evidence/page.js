"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card } from "@/utils/pageStyles";

const SOURCE_LABELS = {
  peer_reviewed: "Peer-Reviewed",
  industry_report: "Industry Report",
  government: "Government",
  ngo: "NGO / Nonprofit",
  news: "News",
  other: "Other",
};

function EvidenceCard({ item, isDark, onReview, reviewing }) {
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(false);

  const textColor = isDark ? "#c8d6c8" : "#444";
  const mutedColor = isDark ? "#6b8a6e" : "#888";

  const handleAction = (status) => {
    onReview(item.id, { status, notes: notes.trim() || undefined });
  };

  return (
    <div
      style={{
        ...card(isDark, { padding: 20, radius: 14 }),
        marginBottom: 16,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            Product #{item.product_id}
          </div>
          <div style={{ fontSize: 12, color: mutedColor }}>
            Submitted by user #{item.user_id} ·{" "}
            {new Date(item.submitted_at).toLocaleDateString()}
            {item.year ? ` · ${item.year}` : ""}
          </div>
        </div>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: isDark ? "#1c2e22" : "#f3f4f6",
            color: isDark ? "#6b8a6e" : "#888",
            flexShrink: 0,
          }}
        >
          {SOURCE_LABELS[item.source_type] || item.source_type || "—"}
        </span>
      </div>

      {/* Citation */}
      <div
        style={{
          fontSize: 14,
          color: textColor,
          lineHeight: 1.6,
          marginBottom: 8,
          fontStyle: "italic",
        }}
      >
        &ldquo;{item.citation}&rdquo;
      </div>

      {/* URL + methodology toggle */}
      {(item.url || item.methodology) && (
        <div style={{ marginBottom: 12 }}>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "#2d9e6a",
                textDecoration: "none",
                display: "block",
                marginBottom: 4,
                wordBreak: "break-all",
              }}
            >
              {item.url}
            </a>
          )}
          {item.methodology && (
            <div>
              <button
                onClick={() => setExpanded((v) => !v)}
                style={{
                  fontSize: 12,
                  color: mutedColor,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                {expanded ? "Hide" : "Show"} methodology notes
              </button>
              {expanded && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: isDark ? "#0f1f14" : "#f9fafb",
                    fontSize: 12,
                    color: textColor,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.methodology}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Review notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional reviewer notes (shown to user on rejection)…"
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${isDark ? "#2d4a35" : "#d1d5db"}`,
          background: isDark ? "#0f1f14" : "#fff",
          color: textColor,
          fontSize: 13,
          resize: "vertical",
          marginBottom: 12,
          fontFamily: "inherit",
        }}
      />

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => handleAction("approved")}
          disabled={reviewing}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 700,
            fontSize: 13,
            background: reviewing ? "#ccc" : "#27ae60",
            color: "#fff",
            transition: "opacity 0.15s",
          }}
        >
          Approve
        </button>
        <button
          onClick={() => handleAction("rejected")}
          disabled={reviewing}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 700,
            fontSize: 13,
            background: reviewing ? "#ccc" : isDark ? "#3a1c1c" : "#fef2f2",
            color: reviewing ? "#fff" : "#e74c3c",
            transition: "opacity 0.15s",
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
        subtitle="Community-submitted citations awaiting moderation. Approved entries appear on product pages."
      />

      <div style={pageContainer(760)}>
        {items.length === 0 ? (
          <div
            style={{
              ...card(isDark, { padding: 40, radius: 14 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
              fontSize: 15,
            }}
          >
            No pending submissions — all caught up!
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 13,
                color: isDark ? "#6b8a6e" : "#888",
                marginBottom: 20,
                fontWeight: 600,
              }}
            >
              {items.length} submission{items.length !== 1 ? "s" : ""} awaiting review
            </div>
            {items.map((item) => (
              <EvidenceCard
                key={item.id}
                item={item}
                isDark={isDark}
                onReview={(id, decision) => review.mutate({ id, decision })}
                reviewing={review.isPending && review.variables?.id === item.id}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
