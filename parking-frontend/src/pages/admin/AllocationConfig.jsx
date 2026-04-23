import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

function AllocationConfig() {
  const { mallId } = useAuth();
  const [activeConfig, setActiveConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ weightExit: "", weightElevator: "", vipBonus: "", effectiveFrom: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchConfig = async () => {
    setConfigLoading(true);
    setConfigError(null);
    try {
      const res = await api.get(`/allocation-config/mall/${mallId}/active`);
      setActiveConfig(res.data.data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setActiveConfig(null);
      } else {
        setConfigError(err.response?.data?.message || "Failed to load config.");
      }
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, [mallId]);

  const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (createForm.weightExit === "") { setCreateError("Exit weight is required."); return; }
    if (createForm.weightElevator === "") { setCreateError("Elevator weight is required."); return; }
    if (createForm.vipBonus === "") { setCreateError("VIP bonus is required."); return; }
    if (createForm.effectiveFrom === "") { setCreateError("Effective from date is required."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/allocation-config", {
        mallId: Number(mallId),
        weightExit: Number(createForm.weightExit),
        weightElevator: Number(createForm.weightElevator),
        vipBonus: Number(createForm.vipBonus),
        effectiveFrom: new Date(createForm.effectiveFrom).toISOString(),
      });
      const newConfig = res.data.data;
      if (new Date(newConfig.effectiveFrom) <= new Date()) {
        setActiveConfig(newConfig);
      }
      setShowCreateModal(false);
      setCreateForm({ weightExit: "", weightElevator: "", vipBonus: "", effectiveFrom: "" });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create config.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateForm({ weightExit: "", weightElevator: "", vipBonus: "", effectiveFrom: "" }); setCreateError(null); };
  const closeCreate = () => { if (!createLoading) setShowCreateModal(false); };

  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Allocation Config">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Slot Allocation Config</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>Controls how the system selects parking slots for incoming vehicles</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ New Config</button>
      </div>

      {/* Info banner */}
      <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "10px", padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ fontWeight: 700, color: "#4338ca", marginBottom: "8px" }}>ℹ️ How Smart Allocation Works</div>
        <p style={{ color: "#4338ca", opacity: 0.8, fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
          When a vehicle enters, the system scores each available slot using:<br />
          <strong>Score = (weightExit × distanceToExit) + (weightElevator × distanceToElevator) − (vipBonus if VIP slot)</strong><br />
          The slot with the LOWEST score is selected. If no config is set, the first available slot is used.
        </p>
      </div>

      {/* Active config */}
      {configLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner size="lg" /></div>
      ) : configError ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "40px" }}>
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "16px", borderRadius: "8px" }}>{configError}</div>
          <button onClick={fetchConfig} style={btnPrimary}>Retry</button>
        </div>
      ) : activeConfig === null ? (
        <div style={{ background: "var(--bg-card)", border: "1px dashed var(--border-color)", borderRadius: "12px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚙️</div>
          <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>No active configuration</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Create a configuration to enable smart slot allocation.</div>
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>Active Configuration</span>
            <Badge status="ACTIVE" />
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "4px 0 24px" }}>Active since {formatDate(activeConfig.effectiveFrom)}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {[
              { label: "Exit Weight", value: activeConfig.weightExit },
              { label: "Elevator Weight", value: activeConfig.weightElevator },
              { label: "VIP Bonus", value: activeConfig.vipBonus },
            ].map((w) => (
              <div key={w.label} style={{ background: "var(--bg-primary)", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--accent)" }}>{w.value}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Config Modal */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "500px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>Create Allocation Config</h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>
              The new config will become active at the effective date/time you specify. You can schedule future configs in advance.
            </p>
            {createError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                {[
                  { key: "weightExit", label: "Exit Weight", ph: "e.g. 0.6" },
                  { key: "weightElevator", label: "Elevator Weight", ph: "e.g. 0.4" },
                  { key: "vipBonus", label: "VIP Bonus", ph: "e.g. 10.0" },
                ].map((f) => (
                  <div key={f.key} style={{ flex: 1 }}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type="number" step="0.1" min="0" style={inputStyle} placeholder={f.ph}
                      value={createForm[f.key]}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Effective From</label>
                <input type="datetime-local" style={inputStyle} min={new Date().toISOString().slice(0, 16)}
                  value={createForm.effectiveFrom}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Create Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AllocationConfig;
