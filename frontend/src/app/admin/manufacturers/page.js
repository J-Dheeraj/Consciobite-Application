"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import {
  fetchManufacturers,
  createManufacturer,
  acknowledgeFee,
  linkProductManufacturer,
} from "@/services/admin";
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

function ManufacturerRow({ mfr, isDark, onAcknowledge, acknowledging }) {
  return (
    <tr
      style={{
        borderBottom: `1px solid ${isDark ? "#1c2e22" : "#f3f4f6"}`,
      }}
    >
      <td
        style={{
          padding: "10px",
          fontWeight: 600,
          color: isDark ? "#e8f5e9" : "#1a3a2a",
        }}
      >
        {mfr.name}
      </td>
      <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 13 }}>
        {mfr.email}
      </td>
      <td style={{ padding: "10px" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: mfr.is_paying ? "#fef3c7" : isDark ? "#1c2e22" : "#f3f4f6",
            color: mfr.is_paying ? "#92400e" : isDark ? "#6b8a6e" : "#999",
          }}
        >
          {mfr.is_paying ? "PAYING" : "FREE"}
        </span>
      </td>
      <td style={{ padding: "10px" }}>
        {mfr.listing_fee_ack ? (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              background: "#ecfdf5",
              color: "#27ae60",
            }}
          >
            ACKNOWLEDGED
          </span>
        ) : (
          <button
            onClick={() => onAcknowledge(mfr.id)}
            disabled={acknowledging}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: "none",
              cursor: acknowledging ? "wait" : "pointer",
              fontSize: 11,
              fontWeight: 700,
              background: isDark ? "#3a2e1c" : "#fef3c7",
              color: "#92400e",
              transition: "all 0.15s ease",
            }}
          >
            {acknowledging ? "..." : "Acknowledge Fee"}
          </button>
        )}
      </td>
      <td style={{ padding: "10px", color: isDark ? "#6b8a6e" : "#999", fontSize: 12 }}>
        {new Date(mfr.onboarded_at).toLocaleDateString()}
      </td>
    </tr>
  );
}

function LinkProductForm({ manufacturers, isDark }) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [manufacturerId, setManufacturerId] = useState("");
  const [error, setError] = useState("");

  const link = useMutation({
    mutationFn: linkProductManufacturer,
    onSuccess: () => {
      setProductId("");
      setManufacturerId("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId.trim() || !manufacturerId) return;
    setError("");
    link.mutate({ productId: productId.trim(), manufacturerId });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div role="alert" style={{ ...errorAlert(isDark), fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {link.isSuccess && (
        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: isDark ? "#1c3a25" : "#ecfdf5",
            color: "#27ae60",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Product linked successfully.
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ flex: 1, minWidth: 120 }}>
          <span style={formLabel(isDark)}>Product ID</span>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="e.g. 42"
            required
            style={inputField(isDark, { radius: 8, fullWidth: true })}
          />
        </label>
        <label style={{ flex: 1, minWidth: 160 }}>
          <span style={formLabel(isDark)}>Manufacturer</span>
          <select
            value={manufacturerId}
            onChange={(e) => setManufacturerId(e.target.value)}
            required
            style={{
              ...inputField(isDark, { radius: 8, fullWidth: true }),
              appearance: "auto",
            }}
          >
            <option value="">Select...</option>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={link.isPending}
          style={{ ...primaryButton({ loading: link.isPending }), fontSize: 13 }}
        >
          {link.isPending ? "Linking..." : "Link"}
        </button>
      </div>
    </form>
  );
}

export default function ManufacturersPage() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [feeAck, setFeeAck] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: manufacturers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: fetchManufacturers,
    enabled: isAuthenticated,
  });

  const create = useMutation({
    mutationFn: createManufacturer,
    onSuccess: () => {
      setName("");
      setEmail("");
      setIsPaying(false);
      setFeeAck(false);
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
    },
    onError: (err) => setFormError(err.message),
  });

  const ack = useMutation({
    mutationFn: acknowledgeFee,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manufacturers"] }),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (isPaying && !feeAck) {
      setFormError(
        "Paying manufacturers must acknowledge that listing fees are non-contingent on GreenGrade score outcome."
      );
      return;
    }
    setFormError("");
    create.mutate({ name: name.trim(), email: email.trim(), isPaying });
  };

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

  if (isLoading) return <Spinner message="Loading manufacturers..." />;

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

  const textColor = isDark ? "#c8d6c8" : "#444";

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon="🏭"
        title="Manufacturer Onboarding"
        subtitle="Register manufacturers, link products, and manage listing fee acknowledgements."
      />

      <div style={pageContainer(900)}>
        {/* Onboard New Manufacturer */}
        <div
          style={{
            ...card(isDark, { radius: 14 }),
            padding: 24,
            marginBottom: 24,
            animation: "fadeInUp 0.4s ease both",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              marginBottom: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Onboard New Manufacturer
          </h3>

          <form onSubmit={handleCreate}>
            {formError && (
              <div role="alert" style={{ ...errorAlert(isDark), fontSize: 13, marginBottom: 14 }}>
                {formError}
              </div>
            )}
            {create.isSuccess && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: isDark ? "#1c3a25" : "#ecfdf5",
                  color: "#27ae60",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Manufacturer created successfully.
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <label style={{ flex: 1, minWidth: 180 }}>
                <span style={formLabel(isDark)}>Company Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Acme Foods Ltd"
                  style={inputField(isDark, { radius: 10, fullWidth: true })}
                />
              </label>
              <label style={{ flex: 1, minWidth: 180 }}>
                <span style={formLabel(isDark)}>Contact Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contact@acmefoods.com"
                  style={inputField(isDark, { radius: 10, fullWidth: true })}
                />
              </label>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: isPaying ? 12 : 16,
                cursor: "pointer",
                color: textColor,
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={isPaying}
                onChange={(e) => {
                  setIsPaying(e.target.checked);
                  if (!e.target.checked) setFeeAck(false);
                }}
                style={{ width: 16, height: 16, accentColor: "#2d6a4f" }}
              />
              Paying client (listing fee applies)
            </label>

            {isPaying && (
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 16,
                  cursor: "pointer",
                  padding: 12,
                  borderRadius: 8,
                  background: isDark ? "#1c2e22" : "#fef3c7",
                  border: `1px solid ${isDark ? "#2d4a35" : "#fcd34d"}`,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: isDark ? "#c8d6c8" : "#78350f",
                }}
              >
                <input
                  type="checkbox"
                  checked={feeAck}
                  onChange={(e) => setFeeAck(e.target.checked)}
                  required={isPaying}
                  style={{ width: 16, height: 16, accentColor: "#2d6a4f", marginTop: 3 }}
                />
                <span>
                  I confirm that the listing fee is <strong>non-contingent</strong> on the
                  GreenGrade score outcome. The manufacturer understands that paying for a listing
                  does not influence, guarantee, or imply any particular score.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={create.isPending}
              style={{ ...primaryButton({ loading: create.isPending }), fontSize: 14 }}
            >
              {create.isPending ? "Creating..." : "Register Manufacturer"}
            </button>
          </form>
        </div>

        {/* Link Product to Manufacturer */}
        <div
          style={{
            ...card(isDark, { radius: 14 }),
            padding: 24,
            marginBottom: 24,
            animation: "fadeInUp 0.4s ease 0.1s both",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              marginBottom: 14,
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Link Product to Manufacturer
          </h3>
          <p style={{ color: textColor, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            Associate a product (by ID) with a registered manufacturer. This enables paying-client
            attribution in the score audit trail.
          </p>
          <LinkProductForm manufacturers={manufacturers || []} isDark={isDark} />
        </div>

        {/* Manufacturers Table */}
        <div
          style={{
            ...card(isDark, { radius: 14 }),
            overflow: "auto",
            animation: "fadeInUp 0.4s ease 0.2s both",
          }}
        >
          <h3
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              padding: "20px 20px 0",
              color: isDark ? "#e8f5e9" : "#1a3a2a",
            }}
          >
            Registered Manufacturers ({manufacturers?.length || 0})
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 600,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: `2px solid ${isDark ? "#2d4a35" : "#e5e7eb"}`,
                  textAlign: "left",
                }}
              >
                {["Name", "Email", "Status", "Fee Ack", "Onboarded"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 10px",
                      fontWeight: 700,
                      color: isDark ? "#b0c4b1" : "#555",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!manufacturers || manufacturers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: isDark ? "#6b8a6e" : "#999",
                    }}
                  >
                    No manufacturers registered yet. Use the form above to onboard one.
                  </td>
                </tr>
              ) : (
                manufacturers.map((mfr) => (
                  <ManufacturerRow
                    key={mfr.id}
                    mfr={mfr}
                    isDark={isDark}
                    onAcknowledge={(id) => ack.mutate(id)}
                    acknowledging={ack.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
