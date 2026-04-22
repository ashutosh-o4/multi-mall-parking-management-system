const STATUS_COLORS = {
  ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
  AVAILABLE: { bg: "#dcfce7", text: "#16a34a" },
  INACTIVE: { bg: "#fee2e2", text: "#dc2626" },
  OCCUPIED: { bg: "#fee2e2", text: "#dc2626" },
  MAINTENANCE: { bg: "#fef9c3", text: "#ca8a04" },
  SUPER_ADMIN: { bg: "#e0e7ff", text: "#4338ca" },
  ADMIN: { bg: "#dbeafe", text: "#1d4ed8" },
  OFFICER: { bg: "#f1f5f9", text: "#475569" },
};

const DEFAULT_COLOR = { bg: "#f3f4f6", text: "#6b7280" };

export function Badge({ status }) {
  const colors = STATUS_COLORS[status] || DEFAULT_COLOR;

  return (
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "20px",
        display: "inline-block",
        backgroundColor: colors.bg,
        color: colors.text,
        lineHeight: "1.4",
      }}
    >
      {status}
    </span>
  );
}
