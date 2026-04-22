const ICON_BG = {
  green: "#dcfce7",
  red: "#fee2e2",
  amber: "#fef9c3",
  indigo: "#e0e7ff",
  slate: "#f1f5f9",
};

export function StatCard({ label, value, icon, color }) {
  const circleBg = ICON_BG[color] || ICON_BG.slate;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: circleBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.15rem",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-secondary)",
          marginTop: "12px",
        }}
      >
        {label}
      </span>
    </div>
  );
}
