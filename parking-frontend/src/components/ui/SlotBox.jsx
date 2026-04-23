import { useState } from "react";

const STATUS_STYLES = {
  AVAILABLE: { background: "#f0fff4", border: "2px solid #22c55e", color: "#15803d", cursor: "pointer" },
  OCCUPIED: { background: "#fff5f5", border: "2px solid #ef4444", color: "#dc2626", cursor: "not-allowed" },
  MAINTENANCE: { background: "#fffbeb", border: "2px solid #f59e0b", color: "#b45309", cursor: "pointer" },
};

export function SlotBox({ slot, onClick }) {
  const [hovered, setHovered] = useState(false);
  const colors = STATUS_STYLES[slot.status] || STATUS_STYLES.AVAILABLE;
  const displayFloor = slot.floorName && slot.floorName.length > 8
    ? slot.floorName.slice(0, 8) + "…"
    : slot.floorName;

  return (
    <div
      onClick={() => onClick(slot)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "90px",
        height: "90px",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        transition: "transform 0.15s, box-shadow 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
        ...colors,
      }}
    >
      {slot.vipReserved ? (
        <span style={{ fontSize: "0.65rem", color: "#f59e0b", lineHeight: 1 }}>★</span>
      ) : null}
      <span style={{ fontSize: "0.85rem", fontWeight: 700, lineHeight: 1 }}>{slot.slotNumber}</span>
      <span style={{ fontSize: "0.6rem", fontWeight: 500, opacity: 0.8, textTransform: "uppercase", lineHeight: 1 }}>{slot.status}</span>
      <span style={{ fontSize: "0.6rem", opacity: 0.65, lineHeight: 1 }}>{displayFloor}</span>
    </div>
  );
}
