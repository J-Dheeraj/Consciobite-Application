import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { scanBarcode } from "../services/api";
import GradeBadge from "../components/GradeBadge";

export default function Scan() {
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
          formatsToSupport: [
            0,  // QR_CODE
            2,  // EAN_13
            3,  // EAN_8
            4,  // UPC_A
            5,  // UPC_E
            10, // CODE_128
            9,  // CODE_39
          ],
        },
        (decodedText) => {
          // Barcode detected — stop camera and look up product
          scanner.stop().then(() => {
            scannerRef.current = null;
            setScanning(false);
            lookupBarcode(decodedText);
          });
        },
        () => {
          // Ignore scan failures (frames without a barcode)
        }
      );

      setScanning(true);
    } catch (err) {
      setCameraError(
        "Unable to access camera. Please check permissions or use manual entry below."
      );
    }
  }, [lookupBarcode]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  // Cleanup on unmount
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
    if (barcode.trim()) {
      lookupBarcode(barcode.trim());
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Scan a Product</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: "0.9rem" }}>
        Point your camera at a barcode to instantly get the GreenGrade, or enter it manually.
      </p>

      {/* Camera scanner section */}
      <div style={{ marginBottom: 20 }}>
        {!scanning ? (
          <button
            onClick={startCamera}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: "#2d6a4f",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>&#128247;</span> Open Camera to Scan
          </button>
        ) : (
          <button
            onClick={stopCamera}
            style={{
              width: "100%",
              padding: "10px 20px",
              background: "#e63946",
              color: "#fff",
              border: "none",
              borderRadius: 8,
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
            borderRadius: 8,
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
          marginBottom: 16,
          color: "#aaa",
          fontSize: "0.85rem",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "#ddd" }} />
        or enter manually
        <div style={{ flex: 1, height: 1, background: "#ddd" }} />
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter barcode (e.g. 1234567890123)"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#2d6a4f",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Look Up
        </button>
      </form>

      {error && <p style={{ color: "#e63946", marginBottom: 12 }}>{error}</p>}

      {result && (
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            cursor: "pointer",
          }}
          onClick={() => navigate(`/product/${result.id}`)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <GradeBadge
              score={result.greenGrade.score}
              color={result.greenGrade.color}
              size="large"
            />
            <div>
              <h3>{result.name}</h3>
              <div style={{ color: "#666", fontSize: "0.85rem" }}>
                {result.brand} &middot; {result.category}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 4 }}>
                Tap to see full details
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
