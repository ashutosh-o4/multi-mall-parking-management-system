import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Spinner } from "../../components/ui/Spinner";

function ActiveEntries() {
  const { mallId } = useAuth();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [exitLoadingId, setExitLoadingId] = useState(null);
  const [exitError, setExitError] = useState(null);

  // ─── Fetch active entries ───────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!mallId) return;
    try {
      const response = await api.get(`/entries/mall/${mallId}/active`);
      setEntries(response.data.data || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load active entries.");
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    fetchEntries();
    const intervalId = setInterval(fetchEntries, 60000);
    return () => clearInterval(intervalId);
  }, [fetchEntries]);

  // ─── Derived values ─────────────────────────────────
  const filteredEntries = searchQuery
    ? entries.filter((e) =>
        e.vehicleNumber.includes(searchQuery.toUpperCase())
      )
    : entries;

  // ─── Duration helper ────────────────────────────────
  const getDuration = (entryTime) => {
    const mins = Math.floor((Date.now() - new Date(entryTime)) / 60000);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const getDurationColor = (entryTime) => {
    const mins = Math.floor((Date.now() - new Date(entryTime)) / 60000);
    if (mins < 60) return "#16a34a";
    if (mins < 180) return "#f59e0b";
    return "#dc2626";
  };

  // ─── Exit Logic ─────────────────────────────────────
  const handleProcessExit = async (entryId) => {
    setExitLoadingId(entryId);
    setExitError(null);
    try {
      await api.post(`/entries/${entryId}/exit`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setLastUpdated(new Date());
    } catch (err) {
      setExitError(
        err.response?.data?.message || "Failed to process exit."
      );
    } finally {
      setExitLoadingId(null);
    }
  };

  // ─── Shared styles ─────────────────────────────────
  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    fontSize: "0.95rem",
    fontWeight: 500,
    border: "1.5px solid var(--border-color)",
    borderRadius: "8px",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "20px",
  };

  const thStyle = {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    background: "var(--bg-primary)",
    borderBottom: "1px solid var(--border-color)",
  };

  const tdStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <DashboardLayout title="Active Entries">
      {/* ── Header Row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Active Entries
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              margin: "4px 0 0",
            }}
          >
            {filteredEntries.length} vehicles currently parked
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Loading..."}
          </span>
          <button
            onClick={fetchEntries}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Exit Error Banner ── */}
      {exitError && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠ {exitError}</span>
          <button
            onClick={() => setExitError(null)}
            style={{
              background: "none",
              border: "none",
              color: "#dc2626",
              cursor: "pointer",
              fontSize: "1.1rem",
              fontWeight: 700,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Search Input ── */}
      <input
        type="text"
        style={inputStyle}
        placeholder="Search by vehicle number..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
        autoComplete="off"
      />

      {/* ── Loading State ── */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
            gap: "16px",
          }}
        >
          <Spinner size="lg" />
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Loading active entries...
          </span>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1rem",
              color: "#dc2626",
              marginBottom: "16px",
            }}
          >
            ⚠ {error}
          </div>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchEntries();
            }}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Entries Table ── */}
      {!loading && !error && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {filteredEntries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "var(--text-secondary)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🚗</div>
              <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "4px" }}>
                No vehicles currently parked
              </div>
              {searchQuery && (
                <div style={{ fontSize: "0.875rem" }}>
                  No match for &apos;{searchQuery}&apos;
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Vehicle Number</th>
                    <th style={thStyle}>Slot</th>
                    <th style={thStyle}>Floor</th>
                    <th style={thStyle}>Entry Time</th>
                    <th style={thStyle}>Duration</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          fontSize: "1rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {entry.vehicleNumber}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {entry.slotNumber}
                      </td>
                      <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>
                        {entry.floorName}
                      </td>
                      <td style={tdStyle}>
                        {new Date(entry.entryTime).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 600,
                          color: getDurationColor(entry.entryTime),
                        }}
                      >
                        {getDuration(entry.entryTime)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button
                          onClick={() => handleProcessExit(entry.id)}
                          disabled={exitLoadingId === entry.id}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            opacity: exitLoadingId === entry.id ? 0.7 : 1,
                          }}
                        >
                          {exitLoadingId === entry.id ? (
                            <Spinner size="sm" />
                          ) : (
                            "Exit →"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default ActiveEntries;
