import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";

function SADashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [malls, setMalls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mallsRes, staffRes] = await Promise.all([
        api.get("/malls"),
        api.get("/staff"),
      ]);
      setMalls(mallsRes.data.data || []);
      setStaff(staffRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalMalls = malls.length;
  const activeMalls = malls.filter((m) => m.status === "ACTIVE").length;
  const inactiveMalls = malls.filter((m) => m.status === "INACTIVE").length;
  const totalAdmins = staff.filter((s) => s.role === "ADMIN").length;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "16px" }}>
          <Spinner size="lg" />
          <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Loading dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "16px" }}>
          <div style={{ background: "#fee2e2", color: "#dc2626", padding: "16px", borderRadius: "8px", fontSize: "0.95rem" }}>{error}</div>
          <button onClick={fetchData} style={{ background: "var(--accent)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}>Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Welcome back, {username}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px", marginBottom: 0 }}>Here&apos;s what&apos;s happening across your malls today</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
        <StatCard label="Total Malls" value={totalMalls} icon="🏢" color="indigo" />
        <StatCard label="Active Malls" value={activeMalls} icon="✅" color="green" />
        <StatCard label="Inactive Malls" value={inactiveMalls} icon="⏸️" color="red" />
        <StatCard label="Total Admins" value={totalAdmins} icon="👥" color="slate" />
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px 0" }}>All Malls</h2>

      <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-primary)" }}>
              {["Name", "Address", "Status", "Created", "Action"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {malls.map((mall, idx) => (
              <tr key={mall.id} style={{ borderBottom: idx < malls.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.95rem", fontWeight: 500 }}>{mall.name}</td>
                <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.95rem" }}>{mall.address}</td>
                <td style={{ padding: "14px 16px" }}><Badge status={mall.status} /></td>
                <td style={{ padding: "14px 16px", color: "var(--text-primary)", fontSize: "0.95rem" }}>{formatDate(mall.createdAt)}</td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => navigate("/superadmin/malls")} style={{ background: "transparent", color: "var(--accent)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", padding: 0 }}>Manage →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

export default SADashboard;
