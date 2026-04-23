import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Spinner } from "../../components/ui/Spinner";

function Floors() {
  const { mallId } = useAuth();
  const navigate = useNavigate();
  const [floors, setFloors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fRes, sRes] = await Promise.all([
        api.get(`/floors/mall/${mallId}`),
        api.get(`/slots/mall/${mallId}`),
      ]);
      setFloors(fRes.data.data || []);
      setSlots(sRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load floors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [mallId]);

  const getFloorStats = (floorId) => {
    const fs = slots.filter((s) => s.floorId === floorId);
    return {
      total: fs.length,
      available: fs.filter((s) => s.status === "AVAILABLE").length,
      occupied: fs.filter((s) => s.status === "OCCUPIED").length,
      maintenance: fs.filter((s) => s.status === "MAINTENANCE").length,
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Floor name is required."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/floors", { name: createForm.name.trim(), mallId: Number(mallId) });
      setFloors((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: "" });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create floor.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateForm({ name: "" }); setCreateError(null); };
  const closeCreate = () => { if (!createLoading) setShowCreateModal(false); };

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Floors">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Floors</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>{floors.length} floors in your mall</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ Add Floor</button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.875rem" }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner size="lg" /></div>
      ) : floors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏗️</div>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>No floors yet</div>
          <div style={{ fontSize: "0.9rem" }}>Create your first floor to get started</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {floors.map((floor) => {
            const stats = getFloorStats(floor.id);
            return (
              <div key={floor.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{floor.name}</span>
                  <span style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem" }}>{stats.total} slots</span>
                </div>
                <div style={{ display: "flex", marginBottom: "16px" }}>
                  {[
                    { label: "Available", value: stats.available, color: "#16a34a" },
                    { label: "Occupied", value: stats.occupied, color: "#dc2626" },
                    { label: "Maintenance", value: stats.maintenance, color: "#b45309" },
                  ].map((s, i) => (
                    <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid var(--border-color)" : "none" }}>
                      <div style={{ fontWeight: 700, color: s.color, fontSize: "1.1rem" }}>{s.value}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/admin/slots", { state: { floorId: floor.id, floorName: floor.name } })}
                  style={{ width: "100%", background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "8px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                  View Slots →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "440px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Add New Floor</h2>
            {createError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Floor Name</label>
                <input style={inputStyle} placeholder="e.g. Ground Floor, Level 1, Basement" value={createForm.name}
                  onChange={(e) => setCreateForm({ name: e.target.value })}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Add Floor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Floors;
