"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, primaryButton, errorAlert, formLabel } from "@/utils/pageStyles";

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
        ...card(isDark, { padding: 20 }),
        marginBottom: 12,
        border: `1px solid ${isDark ? "#1c2e22" : "#e8f5e9"}`,
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
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: isDark ? "#7a9a7e" : "#888",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Product #{item.product_id} · {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </div>
          <div
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
            }}
          >
            {item.citation}
          </div>
          <div style={{ fontSize: "0.8rem", color: isDark ? "#7a9a7e" : "#888" }}>
            Submitted by {item.submitter_email}
            {item.year ? ` · ${item.year}` : ""}
            {" · "}
            {new Date(item.submitted_at).toLocaleDateString()}
          </div>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.8rem",
                color: isDark ? "#95d5b2" : "#2d6a4f",
                textDecoration: "none",
                display: "inline-block",
                marginTop: 4,
              }}
            >
              View source →
            </a>
          )}
          {item.methodology && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: isDark ? "#7a9a7e" : "#888",
                padding: 0,
                marginTop: 4,
                display: "block",
              }}
            >
              {expanded ? "Hide methodology ▲" : "Show methodology ▼"}
            </button>
          )}
          {expanded && item.methodology && (
            <div
              style={{
                marginTop: 8,
                padding: "10px 12px",
                background: isDark ? "#1a3327" : "#f5fbf7",
                borderRadius: 8,
                fontSize: "0.82rem",
                color: isDark ? "#b0c4b1" : "#555",
              }}
            >
              {item.methodology}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={formLabel(isDark)}>Review notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason for approval or rejection..."
          rows={2}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            borderRadius: 10,
            border: `2px solid ${isDark ? "#2d4a35" : "#e0e0e0"}`,
            background: isDark ? "#0f1f16" : "#fafafa",
            color: isDark ? "#e8f5e9" : "inherit",
            fontSize: "0.88rem",
            resize: "vertical",
            fontFamily: "inherit",
          }}
          maxLength={500}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={() => onReview(item.id, "approved", notes)}
          disabled={reviewing}
          style={{
            ...primaryButton({ loading: reviewing }),
            padding: "9px 20px",
            fontSize: "0.85rem",
            flex: 1,
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onReview(item.id, "rejected", notes)}
          disabled={reviewing}
          style={{
            padding: "9px 20px",
            background: reviewing ? "#fecaca" : "linear-gradient(135deg, #c62828, #e63946)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            cursor: reviewing ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: "0.85rem",
            flex: 1,
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function PendingEvidence() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated && user?.role === "admin",
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }) => reviewEvidence(id, { status, notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-evidence"] }),
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div style={{ ...pageContainer(), paddingTop: 40 }}>
        <div style={{ ...errorAlert(isDark), textAlign: "center" }}>Admin access required.</div>
      </div>
    );
  }

  const evidence = data?.evidence || [];

  return (
    <div>
      <PageHero
        icon="📋"
        title="Pending Evidence Reviews"
        subtitle={`${evidence.length} submission${evidence.length !== 1 ? "s" : ""} awaiting review.`}
      />
      <div style={pageContainer(720)}>
        {isLoading && <Spinner message="Loading submissions..." />}

        {error && (
          <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>
            {error.message || "Failed to load pending evidence."}
          </div>
        )}

        {mutation.error && (
          <div style={{ ...errorAlert(isDark), marginBottom: 16 }}>
            {mutation.error.message || "Review failed."}
          </div>
        )}

        {!isLoading && evidence.length === 0 && (
          <div
            style={{
              ...card(isDark, { padding: 32 }),
              textAlign: "center",
              color: isDark ? "#7a9a7e" : "#888",
            }}
          >
            No pending submissions. Check back later.
          </div>
        )}

        {evidence.map((item) => (
          <EvidenceCard
            key={item.id}
            item={item}
            isDark={isDark}
            reviewing={mutation.isPending}
            onReview={(id, status, notes) => mutation.mutate({ id, status, notes })}
          />
        ))}
      </div>
    </div>
  );
}
