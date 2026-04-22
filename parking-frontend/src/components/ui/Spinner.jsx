const SIZES = {
  sm: 16,
  md: 24,
  lg: 40,
};

export function Spinner({ size = "md" }) {
  const px = SIZES[size] || SIZES.md;

  return (
    <>
      <style>{`
        @keyframes spinnerRotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: `${px}px`,
          height: `${px}px`,
          border: `${Math.max(2, px / 8)}px solid var(--border-color)`,
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spinnerRotate 0.7s linear infinite",
          boxSizing: "border-box",
        }}
      />
    </>
  );
}
