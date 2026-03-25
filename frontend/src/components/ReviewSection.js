import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { fetchReviews, submitReview, deleteReview } from "../services/api";
import { Link } from "react-router-dom";

const STARS = [1, 2, 3, 4, 5];

export default function ReviewSection({ productId }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ count: 0, average: 0 });
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      const data = await fetchReviews(productId);
      setReviews(data.reviews);
      setStats(data.stats);
    } catch {
      /* ignore */
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitReview(productId, rating, comment);
      setRating(0);
      setComment("");
      loadReviews();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      loadReviews();
    } catch {
      /* ignore */
    }
  };

  const hasReviewed = reviews.some((r) => r.user_id === user?.id);

  return (
    <div
      style={{
        background: isDark ? "#162419" : "#fff",
        borderRadius: 14,
        padding: 24,
        marginTop: 16,
        boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
        animation: "fadeInUp 0.4s ease 0.25s both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, margin: 0 }}>
          {"💬"} Reviews
        </h3>
        {stats.count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#e9c46a", fontSize: "1rem" }}>{"★"}</span>
            <span
              style={{ fontWeight: 700, fontSize: "0.95rem", color: isDark ? "#e8f5e9" : "#333" }}
            >
              {stats.average}
            </span>
            <span style={{ fontSize: "0.82rem", color: isDark ? "#7a9a7e" : "#888" }}>
              ({stats.count})
            </span>
          </div>
        )}
      </div>

      {/* Write review form */}
      {isAuthenticated && !hasReviewed ? (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
            marginBottom: 16,
            borderRadius: 12,
            background: isDark ? "#1c2e22" : "#f9fafb",
            border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <span
              style={{ fontSize: "0.85rem", fontWeight: 600, color: isDark ? "#b0c4b1" : "#555" }}
            >
              Your Rating:{" "}
            </span>
            {STARS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  padding: "0 2px",
                  color: s <= (hoverRating || rating) ? "#e9c46a" : isDark ? "#2d4a35" : "#ddd",
                  transition: "color 0.15s",
                }}
              >
                {"★"}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={3}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: "0.88rem",
              border: "1px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
              resize: "vertical",
              background: isDark ? "#162419" : "#fff",
              color: isDark ? "#e8f5e9" : "#333",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              style={{ color: "#e63946", fontSize: "0.82rem", margin: "6px 0" }}
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 10,
              padding: "10px 20px",
              background: submitting ? "#95d5b2" : "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: submitting ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : !isAuthenticated ? (
        <div
          style={{
            padding: 16,
            marginBottom: 16,
            borderRadius: 12,
            textAlign: "center",
            background: isDark ? "#1c2e22" : "#f9fafb",
            border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
          }}
        >
          <p
            style={{ fontSize: "0.88rem", color: isDark ? "#7a9a7e" : "#888", margin: "0 0 10px" }}
          >
            <Link to="/login" style={{ color: "#52b788", fontWeight: 600 }}>
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        </div>
      ) : null}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p
          style={{
            color: isDark ? "#7a9a7e" : "#888",
            fontSize: "0.88rem",
            textAlign: "center",
            padding: 12,
          }}
        >
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: isDark ? "#1c2e22" : "#f9fafb",
                border: "1px solid " + (isDark ? "#2d4a35" : "#eee"),
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      color: isDark ? "#e8f5e9" : "#333",
                    }}
                  >
                    {review.user_name}
                  </span>
                  <span style={{ color: "#e9c46a", fontSize: "0.85rem" }}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.75rem", color: isDark ? "#7a9a7e" : "#aaa" }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  {user?.id === review.user_id && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e63946",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        padding: "2px 6px",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: isDark ? "#b0c4b1" : "#555",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
