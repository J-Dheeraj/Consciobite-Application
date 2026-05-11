export default function ScanLoading() {
  return (
    <div style={{ padding: "32px 24px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
      <div
        style={{
          width: "100%",
          height: 300,
          borderRadius: 12,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}
