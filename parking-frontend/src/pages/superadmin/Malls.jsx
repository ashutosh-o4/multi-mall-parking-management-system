import { useState, useEffect } from "react";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

function Malls() {
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", address: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, mallId: null, mallName: "", newStatus: null });
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchMalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/malls");
      setMalls(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load malls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMalls(); }, []);

  const filteredMalls = malls.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Mall name is required."); return; }
    if (!createForm.address.trim()) { setCreateError("Address is required."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/malls", { name: createForm.name.trim(), address: createForm.address.trim() });
      setMalls((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: "", address: "" });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create mall.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    setStatusLoading(true);
    try {
      await api.patch(`/malls/${confirmModal.mallId}/status`, { status: confirmModal.newStatus });
      setMalls((prev) => prev.map((m) => m.id === confirmModal.mallId ? { ...m, status: confirmModal.newStatus } : m));
      setConfirmModal({ open: false, mallId: null, mallName: "", newStatus: null });
    } catch (err) {
      setConfirmModal({ open: false, mallId: null, mallName: "", newStatus: null });
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateForm({ name: "", address: "" }); setCreateError(null); };
  const closeCreate = () => { if (!createLoading) { setShowCreateModal(false); setCreateForm({ name: "", address: "" }); setCreateError(null); } };

  const thStyle = { padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
  const tdStyle = { padding: "14px 20px", color: "var(--text-primary)", fontSize: "0.95rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };
  const modalCardBase = { backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" };

  return (
    <DashboardLayout title="Malls">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Malls</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>{malls.length} total malls</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ Create Mall</button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search malls by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ ...inputStyle, marginBottom: "20px" }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }}
      />

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "30vh", gap: "16px" }}>
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "32px" }}>
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "16px", borderRadius: "8px" }}>{error}</div>
          <button onClick={fetchMalls} style={btnPrimary}>Retry</button>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-primary)" }}>
                {["Name", "Address", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMalls.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏢</div>
                    <div>No malls found</div>
                    {searchQuery && <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>Try a different search term</div>}
                  </td>
                </tr>
              ) : (
                filteredMalls.map((mall, idx) => (
                  <tr key={mall.id} style={{ borderBottom: idx < filteredMalls.length - 1 ? "1px solid var(--border-color)" : "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{mall.name}</td>
                    <td style={tdStyle}>{mall.address}</td>
                    <td style={{ padding: "14px 20px" }}><Badge status={mall.status} /></td>
                    <td style={tdStyle}>{formatDate(mall.createdAt)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {mall.status === "ACTIVE" ? (
                          <button onClick={() => setConfirmModal({ open: true, mallId: mall.id, mallName: mall.name, newStatus: "INACTIVE" })}
                            style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => setConfirmModal({ open: true, mallId: mall.id, mallName: mall.name, newStatus: "ACTIVE" })}
                            style={{ background: "#dcfce7", color: "#16a34a", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Mall Modal */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ ...modalCardBase, width: "440px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Create New Mall</h2>
            {createError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>
            )}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Mall Name</label>
                <input style={inputStyle} placeholder="e.g. Grand Central Mall" value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Address</label>
                <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder="Full address of the mall" value={createForm.address}
                  onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Create Mall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Status Modal */}
      {confirmModal.open && (
        <div style={overlayStyle} onClick={() => !statusLoading && setConfirmModal({ open: false, mallId: null, mallName: "", newStatus: null })}>
          <div style={{ ...modalCardBase, width: "380px", maxWidth: "90vw", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px" }}>Confirm Status Change</h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: "0.95rem" }}>
              Are you sure you want to {confirmModal.newStatus === "INACTIVE" ? "deactivate" : "activate"} {confirmModal.mallName}?
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={() => setConfirmModal({ open: false, mallId: null, mallName: "", newStatus: null })} disabled={statusLoading} style={btnCancel}>Cancel</button>
              <button onClick={handleStatusUpdate} disabled={statusLoading}
                style={{ ...btnPrimary, background: confirmModal.newStatus === "INACTIVE" ? "#dc2626" : "#16a34a", opacity: statusLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
                {statusLoading && <Spinner size="sm" />}
                {statusLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Malls;
