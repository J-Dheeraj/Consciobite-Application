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
    setError(""); setResult(null); setBarcode(code);
    try { const data = await scanBarcode(code.trim()); setResult(data); }
    catch (err) { setError(err.message || "Product not found for this barcode."); }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(""); setError(""); setResult(null);
    try {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;
      await scanner.start({ facingMode: "environment" }, {
        fps: 10, qrbox: { width: 250, height: 150 },
        formatsToSupport: [0, 2, 3, 4, 5, 10, 9],
      }, (decodedText) => {
        scanner.stop().then(() => { scannerRef.current = null; setScanning(false); lookupBarcode(decodedText); });
      }, () => {});
      setScanning(true);
    } catch { setCameraError("Unable to access camera. Please check permissions or use manual entry below."); }
  }, [lookupBarcode]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) { try { await scannerRef.current.stop(); } catch {} scannerRef.current = null; }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; } };
  }, []);

  const handleManualSubmit = (e) => { e.preventDefault(); if (barcode.trim()) lookupBarcode(barcode.trim()); };

  return (
    <div style={{ animation: "fadeIn 0.4s ease" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)", padding: "36px 24px 44px", textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{"\uD83D\uDCF7"}</div>
        <h1 style={{ color: "#fff", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: 6 }}>Scan a Product</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>Point your camera at a barcode or enter it manually.</p>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 20px 40px" }}>
        {/* Scanner */}
        <div style={{ marginTop: -20, animation: "fadeInUp 0.4s ease" }}>
          {!scanning ? (
            <button onClick={startCamera} style={{ width: "100%", padding: "16px 20px", background: "#fff", color: "#2d6a4f", border: "2px dashed #95d5b2", borderRadius: 14, cursor: "pointer", fontWeight: 600, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", transition: "all 0.2s ease" }}>
              <span style={{ fontSize: "1.3rem" }}>{"\uD83D\uDCF8"}</span> Open Camera to Scan
            </button>
          ) : (
            <button onClick={stopCamera} style={{ width: "100%", padding: "12px 20px", background: "#e63946", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", marginBottom: 8 }}>
              Stop Camera
            </button>
          )}
          {cameraError && <p style={{ color: "#e63946", fontSize: "0.85rem", marginTop: 8 }}>{cameraError}</p>}
          <div id="barcode-reader" style={{ marginTop: scanning ? 12 : 0, borderRadius: 12, overflow: "hidden", display: scanning ? "block" : "none" }} />
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 20px", color: "#aaa", fontSize: "0.85rem" }}>
          <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />or enter manually<div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
        </div>

        {/* Manual entry */}
        <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input type="text" placeholder="Enter barcode (e.g. 1234567890123)" value={barcode} onChange={(e) => setBarcode(e.target.value)}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "2px solid #e0e0e0", fontSize: "0.95rem", transition: "border-color 0.2s" }} />
          <button type="submit" style={{ padding: "12px 24px", background: "linear-gradient(135deg, #2d6a4f, #40916c)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, boxShadow: "0 2px 8px rgba(45,106,79,0.3)" }}>
            Look Up
          </button>
        </form>

        {error && <p style={{ color: "#e63946", marginBottom: 12, padding: 14, background: "#fef2f2", borderRadius: 10 }}>{error}</p>}

        {result && (
          <div onClick={() => navigate(`/product/${result.id}`)} style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 12px rgba(27,67,50,0.08)", cursor: "pointer", animation: "fadeInUp 0.3s ease", transition: "all 0.2s ease", borderLeft: "3px solid #52b788" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <GradeBadge score={result.greenGrade.score} color={result.greenGrade.color} size="large" />
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }}>{result.name}</h3>
                <div style={{ color: "#666", fontSize: "0.85rem" }}>{result.brand} &middot; {result.category}</div>
                <div style={{ fontSize: "0.8rem", color: "#52b788", marginTop: 4, fontWeight: 600 }}>Tap to see full details {"\u2192"}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
