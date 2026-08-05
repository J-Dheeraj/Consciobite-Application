"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPendingEvidence, reviewEvidence } from "@/services/admin";
import PageHero from "@/components/PageHero";
import Spinner from "@/components/Spinner";
import { pageContainer, card, inputField, errorAlert } from "@/utils/pageStyles";

const SOURCE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

function SourceBadge({ type, isDark }) {
  const isPeer = type === "peer_reviewed_lca";
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: isPeer ? (isDark ? "#1a3a3a" : "#ecfdf5") : isDark ? "#1c2e22" : "#f3f4f6",
        color: isPeer ? "#059669" : isDark ? "#6b8a6e" : "#666",
      }}
    >
      {SOURCE_LABELS[type] || type}
    </span>
  );
}

function ReviewForm({ item, isDark }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: ({ status }) =>
      reviewEvidence(item.id, { status, notes: notes.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-evidence"] });
    },
    onError: (err) => setError(err.message),
  });

  const textColor = isDark ? "#c8d6c8" : "#555";

  return (
    <div
      style={{
        marginTop: 14,
        borderTop: `1px solid ${isDark ? "#1c2e22" : "#e5e7eb"}`,
        paddingTop: 14,
      }}
    >
      {error && (
        <div role="alert" style={{ ...errorAlert(isDark), fontSize: 13, marginBottom: 10 }}>
          {error}
        </div>
      )}
      <label style={{ display: "block", marginBottom: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: textColor,
            display: "block",
            marginBottom: 4,
          }}
        >
          Reviewer Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Reason for approval or rejection..."
          style={{
            ...inputField(isDark, { radius: 8, fullWidth: true }),
            resize: "vertical",
            fontFamily: "inherit",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => mutation.mutate({ status: "approved" })}
          disabled={mutation.isPending}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: mutation.isPending ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: mutation.isPending ? "#95d5b2" : "#2d6a4f",
            color: "#fff",
            transition: "all 0.15s ease",
          }}
        >
          {mutation.isPending ? "Saving..." : "Approve"}
        </button>
        <button
          onClick={() => mutation.mutate({ status: "rejected" })}
          disabled={mutation.isPending}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            cursor: mutation.isPending ? "wait" : "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: mutation.isPending ? "#f9b8bc" : "#e63946",
            color: "#fff",
            transition: "all 0.15s ease",
          }}
        >
          {mutation.isPending ? "Saving..." : "Reject"}
        </button>
      </div>
    </div>
  );
}

function EvidenceCard({ item, isDark }) {
  const textColor = isDark ? "#c8d6c8" : "#555";
  const mutedColor = isDark ? "#6b8a6e" : "#999";

  return (
    <div
      style={{
        ...card(isDark, { radius: 12, padding: 20 }),
        marginBottom: 14,
        animation: "fadeInUp 0.3s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <SourceBadge type={item.source_type} isDark={isDark} />
            {item.year && (
              <span style={{ fontSize: 12, color: mutedColor, fontWeight: 600 }}>{item.year}</span>
            )}
            <span style={{ fontSize: 12, color: mutedColor }}>Product #{item.product_id}</span>
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
              marginBottom: 4,
              wordBreak: "break-word",
            }}
          >
            {item.citation}
          </div>
          {item.methodology && (
            <div style={{ fontSize: 13, color: textColor, marginBottom: 2 }}>
              <span style={{ fontWeight: 600 }}>Methodology:</span> {item.methodology}
            </div>
          )}
          {item.url && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: isDark ? "#52b788" : "#2d6a4f", wordBreak: "break-all" }}
              >
                {item.url}
              </a>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: mutedColor }}>{item.submitter_email}</div>
          <div style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>
            {new Date(item.submitted_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      <ReviewForm item={item} isDark={isDark} />
    </div>
  );
}

export default function PendingEvidencePage() {
  const { theme } = useTheme();
  const { isAuthenticated, initializing } = useAuth();
  const isDark = theme === "dark";

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-evidence"],
    queryFn: () => fetchPendingEvidence(),
    enabled: isAuthenticated,
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

  const { evidence = [], total = 0 } = data;

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="📋"
        title="Pending Evidence Review"
        subtitle="Community-submitted LCA citations awaiting admin approval before appearing on product pages."
      />

      <div style={pageContainer(840)}>
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
              color: isDark ? "#b0c4b1" : "#666",
            }}
          >
            {total} pending submission{total !== 1 ? "s" : ""}
          </span>
        </div>

        {evidence.length === 0 ? (
          <div
            style={{
              ...card(isDark, { radius: 14, padding: 40 }),
              textAlign: "center",
              color: isDark ? "#6b8a6e" : "#999",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>All caught up</div>
            <div style={{ fontSize: 13 }}>
              No pending community evidence submissions at this time.
            </div>
          </div>
        ) : (
          evidence.map((item) => <EvidenceCard key={item.id} item={item} isDark={isDark} />)
        )}
      </div>
    </div>
  );
}
