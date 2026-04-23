import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Spinner } from "../../components/ui/Spinner";
import { SlotBox } from "../../components/ui/SlotBox";

function Slots() {
  const { mallId } = useAuth();
  const location = useLocation();
  const { floorId: initialFloorId } = location.state || {};

  const [floors, setFloors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFloorId, setSelectedFloorId] = useState(initialFloorId?.toString() || "ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ slotNumber: "", floorId: initialFloorId?.toString() || "", distanceToExit: "", distanceToElevator: "", vipReserved: false });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState({ slotId: null, currentStatus: null });
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/floors/mall/${mallId}`), api.get(`/slots/mall/${mallId}`)])
      .then(([fRes, sRes]) => { setFloors(fRes.data.data || []); setSlots(sRes.data.data || []); })
      .catch((err) => setError(err.response?.data?.message || "Failed to load data."))
      .finally(() => setLoading(false));
  }, [mallId]);

  const filteredSlots = selectedFloorId === "ALL" ? slots : slots.filter((s) => s.floorId === Number(selectedFloorId));
  const targetSlot = slots.find((s) => s.id === statusTarget.slotId);

  const handleSlotClick = (slot) => {
    if (slot.status === "OCCUPIED") return;
    setStatusTarget({ slotId: slot.id, currentStatus: slot.status });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async (newStatus) => {
    setStatusLoading(true);
    try {
      await api.patch(`/slots/${statusTarget.slotId}/status`, { status: newStatus });
      setSlots((prev) => prev.map((s) => s.id === statusTarget.slotId ? { ...s, status: newStatus } : s));
      setShowStatusModal(false);
    } catch (err) {
      setShowStatusModal(false);
      setError(err.response?.data?.message || "Failed to update slot status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.slotNumber.trim()) { setCreateError("Slot number is required."); return; }
    if (!createForm.floorId) { setCreateError("Please select a floor."); return; }
    if (createForm.distanceToExit === "") { setCreateError("Distance to exit is required."); return; }
    if (createForm.distanceToElevator === "") { setCreateError("Distance to elevator is required."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/slots", {
        slotNumber: createForm.slotNumber.trim().toUpperCase(),
        floorId: Number(createForm.floorId),
        distanceToExit: Number(createForm.distanceToExit),
        distanceToElevator: Number(createForm.distanceToElevator),
        vipReserved: createForm.vipReserved,
      });
      setSlots((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ slotNumber: "", floorId: initialFloorId?.toString() || "", distanceToExit: "", distanceToElevator: "", vipReserved: false });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create slot.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateError(null); setCreateForm({ slotNumber: "", floorId: initialFloorId?.toString() || "", distanceToExit: "", distanceToElevator: "", vipReserved: false }); };
  const closeCreate = () => { if (!createLoading) setShowCreateModal(false); };

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Parking Slots">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Parking Slots</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>{filteredSlots.length} slots shown</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ Add Slot</button>
      </div>

      {/* Floor filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button onClick={() => setSelectedFloorId("ALL")}
          style={{ padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem", background: selectedFloorId === "ALL" ? "var(--accent)" : "var(--bg-card)", color: selectedFloorId === "ALL" ? "#fff" : "var(--text-secondary)", border: selectedFloorId === "ALL" ? "none" : "1px solid var(--border-color)" }}>
          All Floors
        </button>
        {floors.map((f) => (
          <button key={f.id} onClick={() => setSelectedFloorId(f.id.toString())}
            style={{ padding: "7px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "0.875rem", background: selectedFloorId === f.id.toString() ? "var(--accent)" : "var(--bg-card)", color: selectedFloorId === f.id.toString() ? "#fff" : "var(--text-secondary)", border: selectedFloorId === f.id.toString() ? "none" : "1px solid var(--border-color)" }}>
            {f.name}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.875rem" }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner size="lg" /></div>
      ) : filteredSlots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🅿️</div>
          <div>No slots found for this floor</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "12px" }}>
          {filteredSlots.map((s) => <SlotBox key={s.id} slot={s} onClick={handleSlotClick} />)}
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && targetSlot && (
        <div style={overlayStyle} onClick={() => !statusLoading && setShowStatusModal(false)}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "360px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>Update Slot Status</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 0 20px" }}>Change slot <strong>{targetSlot.slotNumber}</strong> from current status to:</p>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <button onClick={() => handleStatusUpdate("AVAILABLE")} disabled={statusTarget.currentStatus === "AVAILABLE" || statusLoading}
                style={{ flex: 1, background: "#dcfce7", color: "#16a34a", border: "1px solid #22c55e", padding: "14px", borderRadius: "8px", fontWeight: 600, cursor: statusTarget.currentStatus === "AVAILABLE" ? "not-allowed" : "pointer", opacity: statusTarget.currentStatus === "AVAILABLE" ? 0.5 : 1, fontSize: "0.9rem" }}>
                {statusLoading ? <Spinner size="sm" /> : "✓ Available"}
              </button>
              <button onClick={() => handleStatusUpdate("MAINTENANCE")} disabled={statusTarget.currentStatus === "MAINTENANCE" || statusLoading}
                style={{ flex: 1, background: "#fffbeb", color: "#b45309", border: "1px solid #f59e0b", padding: "14px", borderRadius: "8px", fontWeight: 600, cursor: statusTarget.currentStatus === "MAINTENANCE" ? "not-allowed" : "pointer", opacity: statusTarget.currentStatus === "MAINTENANCE" ? 0.5 : 1, fontSize: "0.9rem" }}>
                {statusLoading ? <Spinner size="sm" /> : "⚠ Maintenance"}
              </button>
            </div>
            <button onClick={() => setShowStatusModal(false)} disabled={statusLoading}
              style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Slot Modal */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "480px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Add Parking Slot</h2>
            {createError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Slot Number</label>
                <input style={inputStyle} placeholder="e.g. A1, B12, G-05" value={createForm.slotNumber}
                  onChange={(e) => setCreateForm((f) => ({ ...f, slotNumber: e.target.value.toUpperCase() }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Floor</label>
                <select style={inputStyle} value={createForm.floorId} onChange={(e) => setCreateForm((f) => ({ ...f, floorId: e.target.value }))}>
                  <option value="">Select floor</option>
                  {floors.map((fl) => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Distance to Exit (m)</label>
                  <input type="number" min="0" style={inputStyle} placeholder="0" value={createForm.distanceToExit}
                    onChange={(e) => setCreateForm((f) => ({ ...f, distanceToExit: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Distance to Elevator (m)</label>
                  <input type="number" min="0" style={inputStyle} placeholder="0" value={createForm.distanceToElevator}
                    onChange={(e) => setCreateForm((f) => ({ ...f, distanceToElevator: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "12px 0" }}>
                <div>
                  <span style={{ display: "block", fontWeight: 500, color: "var(--text-primary)", fontSize: "0.9rem" }}>VIP Reserved</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Priority slot for VIP vehicles</span>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer" }}>
                  <input type="checkbox" checked={createForm.vipReserved} onChange={(e) => setCreateForm((f) => ({ ...f, vipReserved: e.target.checked }))}
                    style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  <div style={{ width: "44px", height: "24px", borderRadius: "999px", backgroundColor: createForm.vipReserved ? "#22c55e" : "var(--border-color)", transition: "background 0.2s", position: "relative" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px", left: createForm.vipReserved ? "22px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                  </div>
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Add Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Slots;
