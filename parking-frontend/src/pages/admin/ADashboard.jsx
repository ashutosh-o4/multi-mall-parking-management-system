import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSlotPolling } from "../../hooks/useSlotPolling";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { SlotBox } from "../../components/ui/SlotBox";

function ADashboard() {
  const { username, mallId } = useAuth();
  const { slots, loading: slotsLoading, lastUpdated, refetch } = useSlotPolling(Number(mallId), 30000);

  const [activeEntries, setActiveEntries] = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeFloor, setActiveFloor] = useState("All");

  useEffect(() => {
    if (!mallId) return;
    api.get(`/entries/mall/${mallId}/active`)
      .then((res) => setActiveEntries(res.data.data || []))
      .catch(() => setActiveEntries([]))
      .finally(() => setEntriesLoading(false));
  }, [mallId]);

  const availableCount = slots.filter((s) => s.status === "AVAILABLE").length;
  const occupiedCount = slots.filter((s) => s.status === "OCCUPIED").length;
  const maintenanceCount = slots.filter((s) => s.status === "MAINTENANCE").length;
  const totalCount = slots.length;
  const occupancyPercent = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const floors = ["All", ...new Set(slots.map((s) => s.floorName))];
  const displayedSlots = activeFloor === "All" ? slots : slots.filter((s) => s.floorName === activeFloor);

  const barColor = occupancyPercent < 50 ? "#22c55e" : occupancyPercent < 80 ? "#f59e0b" : "#ef4444";
  const formatTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "35% 65%", gap: "28px" }}>
        {/* LEFT COLUMN */}
        <div>
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Good {timeOfDay}, {username}!</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "4px 0 0" }}>Mall overview — live data</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <StatCard label="Available" value={availableCount} icon="🟢" color="green" />
            <StatCard label="Occupied" value={occupiedCount} icon="🔴" color="red" />
            <StatCard label="Maintenance" value={maintenanceCount} icon="🟡" color="amber" />
            <StatCard label="Total Slots" value={totalCount} icon="🅿️" color="indigo" />
          </div>

          {/* Occupancy meter */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>Occupancy</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.9rem" }}>{occupancyPercent}%</span>
            </div>
            <div style={{ height: "10px", background: "var(--bg-primary)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${occupancyPercent}%`, borderRadius: "999px", backgroundColor: barColor, transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* Currently Parked */}
          <div>
            <h3 style={{ fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px", fontSize: "0.95rem" }}>Currently Parked</h3>
            {entriesLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}><Spinner size="sm" /></div>
            ) : activeEntries.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", fontSize: "0.9rem", padding: "20px 0" }}>No vehicles currently parked</p>
            ) : (
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                {activeEntries.map((e) => (
                  <div key={e.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "10px 14px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>{e.vehicleNumber}</span>
                      <span style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 500 }}>{e.slotNumber}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{e.floorName}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>{formatTime(e.entryTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Live Slot Map</span>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Loading..."}
              </span>
              <button onClick={refetch} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", color: "var(--text-primary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                {slotsLoading ? <Spinner size="sm" /> : "↻ Refresh"}
              </button>
            </div>
          </div>

          {/* Floor tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {floors.map((f) => (
              <button key={f} onClick={() => setActiveFloor(f)}
                style={{
                  padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem",
                  background: activeFloor === f ? "var(--accent)" : "var(--bg-card)",
                  color: activeFloor === f ? "#fff" : "var(--text-secondary)",
                  border: activeFloor === f ? "none" : "1px solid var(--border-color)",
                }}>
                {f}
              </button>
            ))}
          </div>

          {/* Slot grid */}
          {displayedSlots.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>No slots on this floor</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "12px" }}>
              {displayedSlots.map((s) => (
                <SlotBox key={s.id} slot={s} onClick={(slot) => { setSelectedSlot(slot); setShowSlotModal(true); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slot Detail Modal */}
      {showSlotModal && selectedSlot && (
        <div style={overlayStyle} onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "360px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>{selectedSlot.slotNumber}</h2>
              <Badge status={selectedSlot.status} />
            </div>
            {[
              ["Floor", selectedSlot.floorName],
              ["Distance to Exit", `${selectedSlot.distanceToExit}m`],
              ["Distance to Elevator", `${selectedSlot.distanceToElevator}m`],
              ["VIP Reserved", selectedSlot.vipReserved ? "Yes ★" : "No"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.9rem" }}>{val}</span>
              </div>
            ))}
            <button onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }}
              style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", cursor: "pointer", marginTop: "20px", fontSize: "0.9rem" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ADashboard;
