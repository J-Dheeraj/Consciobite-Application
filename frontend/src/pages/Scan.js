import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { scanBarcode } from "../services/api";
import GradeBadge from "../components/GradeBadge";
import { useTheme } from "../context/ThemeContext";
import PageHero from "../components/PageHero";

export default function Scan() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  const lookupBarcode = useCallback(async (code) => {
    setError("");
    setResult(null);
    setBarcode(code);
    try {
      const data = await scanBarcode(code.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || "Product not found for this barcode.");
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setError("");
    setResult(null);
    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          formatsToSupport: [0, 2, 3, 4, 5, 10, 9],
        },
        (decodedText) => {
          scanner.stop().then(() => {
            scannerRef.current = null;
            setScanning(false);
            lookupBarcode(decodedText);
          });
        },
        () => {}
      );
      setScanning(true);
    } catch {
      setCameraError(
        "Unable to access camera. Please check permissions or use manual entry below."
      );
    }
  }, [lookupBarcode]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (_) {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) lookupBarcode(barcode.trim());
  };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      <PageHero
        icon={"\uD83D\uDCF7"}
        title="Scan a Product"
        subtitle="Point your camera at a barcode or enter it manually."
      />

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Scanner */}
        <div style={{ marginTop: -20, animation: "fadeInUp 0.4s ease" }}>
          {!scanning ? (
            <button
              onClick={startCamera}
              style={{
                width: "100%",
                padding: "16px 20px",
                background: isDark ? "#162419" : "#fff",
                color: "#2d6a4f",
                border: "2px dashed #95d5b2",
                borderRadius: 14,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>{"\uD83D\uDCF8"}</span> Open Camera to Scan
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "#e63946",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: 8,
              }}
            >
              Stop Camera
            </button>
          )}
          {cameraError && (
            <p style={{ color: "#e63946", fontSize: "0.85rem", marginTop: 8 }}>{cameraError}</p>
          )}
          <div
            id="barcode-reader"
            style={{
              marginTop: scanning ? 12 : 0,
              borderRadius: 12,
              overflow: "hidden",
              display: scanning ? "block" : "none",
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "24px 0 20px",
            color: isDark ? "#7a9a7e" : "#aaa",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ flex: 1, height: 1, background: isDark ? "#2d4a35" : "#e0e0e0" }} />
          or enter manually
          <div style={{ flex: 1, height: 1, background: isDark ? "#2d4a35" : "#e0e0e0" }} />
        </div>

        {/* Manual entry */}
        <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Enter barcode (e.g. 1234567890123)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            aria-label="Enter barcode"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: "2px solid " + (isDark ? "#2d4a35" : "#e0e0e0"),
              fontSize: "0.95rem",
              transition: "border-color 0.2s",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #2d6a4f, #40916c)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(45,106,79,0.3)",
            }}
          >
            Look Up
          </button>
        </form>

        {error && (
          <p
            style={{
              color: "#e63946",
              marginBottom: 12,
              padding: 14,
              background: isDark ? "#2a1519" : "#fef2f2",
              borderRadius: 10,
            }}
          >
            {error}
          </p>
        )}

        {result && (
          <div
            onClick={() => navigate(`/product/${result.id}`)}
            style={{
              background: isDark ? "#162419" : "#fff",
              borderRadius: 14,
              padding: 20,
              boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(27,67,50,0.08)",
              cursor: "pointer",
              animation: "fadeInUp 0.3s ease",
              transition: "all 0.2s ease",
              borderLeft: "3px solid #52b788",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <GradeBadge
                score={result.greenGrade.score}
                color={result.greenGrade.color}
                size="large"
              />
              <div>
                <h3
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    color: isDark ? "#e8f5e9" : "inherit",
                  }}
                >
                  {result.name}
                </h3>
                <div style={{ color: isDark ? "#7a9a7e" : "#666", fontSize: "0.85rem" }}>
                  {result.brand} {"\u00B7"} {result.category}
                </div>
                <div
                  style={{ fontSize: "0.8rem", color: "#52b788", marginTop: 4, fontWeight: 600 }}
                >
                  Tap to see full details {"\u2192"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
