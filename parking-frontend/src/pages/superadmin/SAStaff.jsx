import { useState, useEffect } from "react";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

function SAStaff() {
  const [staff, setStaff] = useState([]);
  const [malls, setMalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMallId, setFilterMallId] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "", mallId: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, mallsRes] = await Promise.all([api.get("/staff"), api.get("/malls")]);
      setStaff(staffRes.data.data || []);
      setMalls(mallsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const admins = staff.filter((s) => s.role === "ADMIN");
  const filteredStaff = admins
    .filter((s) => s.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => filterMallId === "ALL" || s.mallId === Number(filterMallId));

  const activeMalls = malls.filter((m) => m.status === "ACTIVE");

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleStatusUpdate = async (staffId, newStatus) => {
    setStatusLoading((prev) => ({ ...prev, [staffId]: true }));
    try {
      await api.patch(`/staff/${staffId}/status`, { status: newStatus });
      setStaff((prev) => prev.map((s) => s.id === staffId ? { ...s, status: newStatus } : s));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status.");
    } finally {
      setStatusLoading((prev) => ({ ...prev, [staffId]: false }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.username.trim()) { setCreateError("Username is required."); return; }
    if (createForm.password.length < 8) { setCreateError("Password must be at least 8 characters."); return; }
    if (!createForm.mallId) { setCreateError("Please select a mall."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/staff", {
        username: createForm.username.trim(),
        password: createForm.password,
        role: "ADMIN",
        mallId: Number(createForm.mallId),
      });
      setStaff((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ username: "", password: "", mallId: "" });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create admin.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateForm({ username: "", password: "", mallId: "" }); setCreateError(null); };
  const closeCreate = () => { if (!createLoading) { setShowCreateModal(false); } };

  const thStyle = { padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
  const tdStyle = { padding: "14px 20px", color: "var(--text-primary)", fontSize: "0.95rem" };
  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Staff Management">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Staff Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>{filteredStaff.length} admin accounts</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ Create Admin</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <input type="text" placeholder="Search by username..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
        <select value={filterMallId} onChange={(e) => setFilterMallId(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: "180px" }}>
          <option value="ALL">All Malls</option>
          {malls.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.875rem" }}>⚠ {error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "30vh", gap: "16px" }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-primary)" }}>
                {["Username", "Role", "Mall", "Status", "Created", "Actions"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div>
                    <div>No admin accounts found</div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: idx < filteredStaff.length - 1 ? "1px solid var(--border-color)" : "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{s.username}</td>
                    <td style={{ padding: "14px 20px" }}><Badge status={s.role} /></td>
                    <td style={tdStyle}>{s.mallName || "—"}</td>
                    <td style={{ padding: "14px 20px" }}><Badge status={s.status} /></td>
                    <td style={tdStyle}>{formatDate(s.createdAt)}</td>
                    <td style={{ padding: "14px 20px" }}>
                      {statusLoading[s.id] ? (
                        <Spinner size="sm" />
                      ) : s.status === "ACTIVE" ? (
                        <button onClick={() => handleStatusUpdate(s.id, "INACTIVE")}
                          style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleStatusUpdate(s.id, "ACTIVE")}
                          style={{ background: "#dcfce7", color: "#16a34a", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "440px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Create Admin Account</h2>
            {createError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>
            )}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} placeholder="e.g. mall_admin_01" value={createForm.username}
                  onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Password</label>
                <input type="password" style={inputStyle} placeholder="Minimum 8 characters" value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Assign to Mall</label>
                <select style={{ ...inputStyle }} value={createForm.mallId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, mallId: e.target.value }))}>
                  <option value="">Select a mall</option>
                  {activeMalls.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading}
                  style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default SAStaff;
