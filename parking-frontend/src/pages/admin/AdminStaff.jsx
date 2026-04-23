import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

function AdminStaff() {
  const { mallId } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", password: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [statusLoading, setStatusLoading] = useState({});

  useEffect(() => {
    setLoading(true);
    api.get(`/staff/mall/${mallId}`)
      .then((res) => {
        const data = res.data.data;
        setStaff(Array.isArray(data) ? data : data ? [data] : []);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load staff."))
      .finally(() => setLoading(false));
  }, []);

  const officers = staff.filter((s) => s.role === "OFFICER");
  const filteredStaff = officers.filter((s) => s.username.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await api.post("/staff", { username: createForm.username.trim(), password: createForm.password, role: "OFFICER", mallId: Number(mallId) });
      setStaff((prev) => [res.data.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ username: "", password: "" });
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create officer.");
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreate = () => { setShowCreateModal(true); setCreateForm({ username: "", password: "" }); setCreateError(null); };
  const closeCreate = () => { if (!createLoading) setShowCreateModal(false); };

  const thStyle = { padding: "12px 20px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 };
  const tdStyle = { padding: "14px 20px", color: "var(--text-primary)", fontSize: "0.95rem" };
  const inputStyle = { width: "100%", padding: "11px 14px", border: "1.5px solid var(--border-color)", borderRadius: "8px", backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
  const labelStyle = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" };
  const btnPrimary = { background: "var(--accent)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" };
  const btnCancel = { background: "var(--bg-primary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" };
  const overlayStyle = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <DashboardLayout title="Staff">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Staff</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "4px 0 0" }}>{filteredStaff.length} officers</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>＋ Create Officer</button>
      </div>

      <input type="text" placeholder="Search by username..." value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ ...inputStyle, marginBottom: "20px" }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />

      {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.875rem" }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner size="lg" /></div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-primary)" }}>
                {["Username", "Role", "Mall", "Status", "Created", "Actions"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "var(--text-secondary)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👥</div><div>No officers found</div>
                </td></tr>
              ) : filteredStaff.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: idx < filteredStaff.length - 1 ? "1px solid var(--border-color)" : "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{s.username}</td>
                  <td style={{ padding: "14px 20px" }}><Badge status={s.role} /></td>
                  <td style={tdStyle}>{s.mallName || "—"}</td>
                  <td style={{ padding: "14px 20px" }}><Badge status={s.status} /></td>
                  <td style={tdStyle}>{formatDate(s.createdAt)}</td>
                  <td style={{ padding: "14px 20px" }}>
                    {statusLoading[s.id] ? <Spinner size="sm" /> : s.status === "ACTIVE" ? (
                      <button onClick={() => handleStatusUpdate(s.id, "INACTIVE")} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Deactivate</button>
                    ) : (
                      <button onClick={() => handleStatusUpdate(s.id, "ACTIVE")} style={{ background: "#dcfce7", color: "#16a34a", border: "none", padding: "6px 14px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div style={overlayStyle} onClick={closeCreate}>
          <div style={{ backgroundColor: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "440px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Create Officer Account</h2>
            {createError && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "0.875rem", marginBottom: "16px" }}>⚠ {createError}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} placeholder="e.g. officer_01" value={createForm.username}
                  onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Password</label>
                <input type="password" style={inputStyle} placeholder="Minimum 8 characters" value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-color)"; }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={closeCreate} disabled={createLoading} style={btnCancel}>Cancel</button>
                <button type="submit" disabled={createLoading} style={{ ...btnPrimary, opacity: createLoading ? 0.6 : 1, cursor: createLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  {createLoading && <Spinner size="sm" />}
                  {createLoading ? "Creating..." : "Create Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default AdminStaff;
