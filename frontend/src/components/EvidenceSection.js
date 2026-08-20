"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchProductEvidence, submitProductEvidence } from "@/services/api";
import Link from "next/link";

const SOURCE_TYPE_LABELS = {
  peer_reviewed_lca: "Peer-Reviewed LCA",
  lca_database: "LCA Database",
  manufacturer_study: "Manufacturer Study",
  industry_report: "Industry Report",
  other: "Other",
};

const SOURCE_TYPES = Object.keys(SOURCE_TYPE_LABELS);

function formatDate(isoString) {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}

export default function EvidenceSection({ productId }) {
  const { isAuthenticated } = useAuth();
  const [evidence, setEvidence] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    citation: "",
    source_type: "other",
    methodology: "",
    url: "",
    year: "",
  });

  const loadEvidence = useCallback(async () => {
    setLoadError("");
    try {
      const data = await fetchProductEvidence(productId);
      setEvidence(data.evidence || []);
    } catch {
      setLoadError("Unable to load community evidence.");
    }
  }, [productId]);

  useEffect(() => {
    loadEvidence();
  }, [loadEvidence]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (form.citation.trim().length < 20) {
      setSubmitError("Citation must be at least 20 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitProductEvidence(productId, {
        citation: form.citation.trim(),
        source_type: form.source_type,
        methodology: form.methodology.trim() || undefined,
        url: form.url.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
      });
      setSubmitted(true);
      setShowForm(false);
      setForm({ citation: "", source_type: "other", methodology: "", url: "", year: "" });
    } catch (err) {
      setSubmitError(err.message || "Failed to submit evidence.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "#14352a",
        borderRadius: 18,
        padding: "18px 20px",
        marginBottom: 16,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{ color: "#b8d4c0", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em" }}
        >
          COMMUNITY EVIDENCE
        </div>
        {isAuthenticated && !showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              border: "1px solid rgba(82,183,136,0.3)",
              borderRadius: 8,
              padding: "4px 12px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Submit Evidence
          </button>
        )}
        {!isAuthenticated && (
          <Link
            href="/login/"
            style={{
              color: "#52b788",
              fontSize: "0.75rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in to submit
          </Link>
        )}
      </div>

      {submitted && (
        <div
          style={{
            background: "rgba(39,174,96,0.12)",
            border: "1px solid rgba(39,174,96,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "#52b788",
            fontSize: "0.82rem",
            marginBottom: 12,
          }}
        >
          Evidence submitted for review. Thank you for your contribution.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label
              style={{ display: "block", color: "#b8d4c0", fontSize: "0.75rem", marginBottom: 4 }}
            >
              Citation *
            </label>
            <textarea
              value={form.citation}
              onChange={handleChange("citation")}
              placeholder="Author(s), Year. Title. Journal/Source. (min 20 chars)"
              rows={3}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                padding: "8px 10px",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "#b8d4c0",
                  fontSize: "0.75rem",
                  marginBottom: 4,
                }}
              >
                Source Type
              </label>
              <select
                value={form.source_type}
                onChange={handleChange("source_type")}
                style={{
                  width: "100%",
                  background: "#1a3a2a",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#fff",
                  padding: "7px 10px",
                  fontSize: "0.8rem",
                }}
              >
                {SOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SOURCE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  color: "#b8d4c0",
                  fontSize: "0.75rem",
                  marginBottom: 4,
                }}
              >
                Year
              </label>
              <input
                type="number"
                value={form.year}
                onChange={handleChange("year")}
                placeholder="e.g. 2023"
                min={1990}
                max={2030}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#fff",
                  padding: "7px 10px",
                  fontSize: "0.8rem",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label
              style={{ display: "block", color: "#b8d4c0", fontSize: "0.75rem", marginBottom: 4 }}
            >
              URL (optional)
            </label>
            <input
              type="url"
              value={form.url}
              onChange={handleChange("url")}
              placeholder="https://doi.org/..."
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                padding: "7px 10px",
                fontSize: "0.8rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: "block", color: "#b8d4c0", fontSize: "0.75rem", marginBottom: 4 }}
            >
              Methodology notes (optional)
            </label>
            <textarea
              value={form.methodology}
              onChange={handleChange("methodology")}
              placeholder="Brief description of the study methodology..."
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                padding: "8px 10px",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
          {submitError && (
            <div
              style={{
                color: "#e74c3c",
                fontSize: "0.78rem",
                marginBottom: 10,
                background: "rgba(231,76,60,0.1)",
                padding: "8px 10px",
                borderRadius: 8,
              }}
            >
              {submitError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#27ae60",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSubmitError("");
              }}
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "#b8d4c0",
                border: "none",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loadError && (
        <div style={{ color: "#e74c3c", fontSize: "0.8rem", marginBottom: 8 }}>{loadError}</div>
      )}

      {evidence.length === 0 && !showForm && (
        <div style={{ color: "#4a6a4e", fontSize: "0.8rem", fontStyle: "italic" }}>
          No community evidence yet.{" "}
          {isAuthenticated
            ? "Be the first to submit a supporting citation."
            : "Sign in to submit a supporting citation."}
        </div>
      )}

      {evidence.map((item) => (
        <div
          key={item.id}
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(82,183,136,0.15)",
              color: "#52b788",
              fontSize: "0.68rem",
              padding: "2px 8px",
              borderRadius: 6,
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            {SOURCE_TYPE_LABELS[item.source_type] || item.source_type}
          </div>
          <div style={{ color: "#d4e8da", fontSize: "0.8rem", lineHeight: 1.55, marginBottom: 4 }}>
            {item.citation}
          </div>
          {item.methodology && (
            <div
              style={{
                color: "#7a9a7e",
                fontSize: "0.72rem",
                fontStyle: "italic",
                marginBottom: 4,
              }}
            >
              {item.methodology}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#52b788", fontSize: "0.72rem", textDecoration: "underline" }}
              >
                View source
              </a>
            )}
            {item.year && (
              <span style={{ color: "#4a6a4e", fontSize: "0.72rem" }}>{item.year}</span>
            )}
            <span style={{ color: "#4a6a4e", fontSize: "0.72rem" }}>
              Added {formatDate(item.submitted_at)}
            </span>
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: evidence.length > 0 ? 10 : 4,
          color: "#3a5a3e",
          fontSize: "0.7rem",
          fontStyle: "italic",
        }}
      >
        Community submissions are reviewed before appearing here.
      </div>
    </div>
  );
}
