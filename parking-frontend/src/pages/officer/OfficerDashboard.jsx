import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSlotPolling } from "../../hooks/useSlotPolling";
import api from "../../api/axios";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Spinner } from "../../components/ui/Spinner";

function OfficerDashboard() {
  const { mallId } = useAuth();
  const { slots } = useSlotPolling(Number(mallId), 30000);

  // Entry state
  const [entryVehicleNumber, setEntryVehicleNumber] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState(null);
  const [entrySuccess, setEntrySuccess] = useState(null);

  // Exit state
  const [exitSearch, setExitSearch] = useState("");
  const [exitSearchLoading, setExitSearchLoading] = useState(false);
  const [exitSearchError, setExitSearchError] = useState(null);
  const [foundEntry, setFoundEntry] = useState(null);

  const [exitLoading, setExitLoading] = useState(false);
  const [exitError, setExitError] = useState(null);
  const [exitSuccess, setExitSuccess] = useState(null);

  // Derived slot values
  const availableCount = slots.filter((s) => s.status === "AVAILABLE").length;
  const occupiedCount = slots.filter((s) => s.status === "OCCUPIED").length;
  const totalCount = slots.length;

  // ─── Entry Logic ────────────────────────────────────
  const handleRegisterEntry = async () => {
    if (!entryVehicleNumber.trim()) {
      setEntryError("Please enter a vehicle number.");
      return;
    }
    setEntryLoading(true);
    setEntryError(null);
    try {
      const response = await api.post("/entries", {
        vehicleNumber: entryVehicleNumber.trim(),
        mallId: Number(mallId),
      });
      const d = response.data.data;
      setEntrySuccess({
        slotNumber: d.slotNumber,
        floorName: d.floorName,
        vehicleNumber: d.vehicleNumber,
      });
      setEntryVehicleNumber("");
    } catch (error) {
      setEntryError(
        error.response?.data?.message || "Failed to register entry. Please try again."
      );
    } finally {
      setEntryLoading(false);
    }
  };

  // ─── Search Logic ───────────────────────────────────
  const handleSearchVehicle = async () => {
    if (!exitSearch.trim()) {
      setExitSearchError("Enter a vehicle number to search.");
      return;
    }
    setExitSearchLoading(true);
    setExitSearchError(null);
    setFoundEntry(null);
    setExitSuccess(null);
    try {
      const response = await api.get(`/entries/mall/${mallId}/active`);
      const entries = response.data.data;
      const match = entries.find(
        (entry) => entry.vehicleNumber === exitSearch.trim()
      );
      if (match) {
        setFoundEntry(match);
      } else {
        setExitSearchError(
          "No active parking found for vehicle " + exitSearch.trim()
        );
      }
    } catch (error) {
      setExitSearchError(
        error.response?.data?.message || "Search failed."
      );
    } finally {
      setExitSearchLoading(false);
    }
  };

  // ─── Exit Logic ─────────────────────────────────────
  const handleProcessExit = async () => {
    if (!foundEntry) return;
    setExitLoading(true);
    setExitError(null);
    try {
      const response = await api.post(`/entries/${foundEntry.id}/exit`);
      const d = response.data.data;
      setExitSuccess({
        vehicleNumber: d.vehicleNumber,
        slotNumber: d.slotNumber,
        entryTime: d.entryTime,
      });
      setFoundEntry(null);
    } catch (error) {
      setExitError(
        error.response?.data?.message || "Failed to process exit."
      );
    } finally {
      setExitLoading(false);
    }
  };

  // ─── Duration helper ────────────────────────────────
  const getDuration = (entryTime) => {
    const mins = Math.floor((Date.now() - new Date(entryTime)) / 60000);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // ─── Shared styles ─────────────────────────────────
  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "28px",
    height: "fit-content",
  };

  const cardHeaderStyle = {
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "16px",
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    fontSize: "1.1rem",
    fontWeight: 600,
    border: "1.5px solid var(--border-color)",
    borderRadius: "8px",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
  };

  const errorStyle = {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "0.875rem",
    marginTop: "10px",
  };

  const primaryBtnStyle = {
    width: "100%",
    marginTop: "14px",
    background: "var(--accent)",
    color: "white",
    border: "none",
    padding: "13px",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  return (
    <DashboardLayout title="Officer Dashboard">
      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>

        {/* ═══ LEFT COLUMN — VEHICLE ENTRY ═══ */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              🚗 Vehicle Entry
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Register an incoming vehicle
            </div>
          </div>

          {entrySuccess ? (
            /* ── Success Panel ── */
            <div>
              <div
                style={{
                  background: "#f0fff4",
                  border: "1px solid #22c55e",
                  borderRadius: "10px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#15803d",
                    marginBottom: "12px",
                  }}
                >
                  ✅ Slot Assigned!
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Vehicle: </span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                    {entrySuccess.vehicleNumber}
                  </span>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Assigned Slot: </span>
                  <span style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--accent)" }}>
                    {entrySuccess.slotNumber}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Floor: </span>
                  <span style={{ color: "var(--text-primary)" }}>{entrySuccess.floorName}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setEntrySuccess(null);
                  setEntryVehicleNumber("");
                }}
                style={{
                  width: "100%",
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "11px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginTop: "16px",
                }}
              >
                Register Another Vehicle
              </button>
            </div>
          ) : (
            /* ── Default Form ── */
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Vehicle Number
              </label>
              <input
                type="text"
                style={inputStyle}
                placeholder="e.g. MH12AB1234"
                value={entryVehicleNumber}
                onChange={(e) => setEntryVehicleNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !entryLoading) handleRegisterEntry();
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                autoComplete="off"
              />

              {entryError && <div style={errorStyle}>⚠ {entryError}</div>}

              <button
                onClick={handleRegisterEntry}
                disabled={entryLoading || !entryVehicleNumber.trim()}
                style={{
                  ...primaryBtnStyle,
                  opacity: entryLoading || !entryVehicleNumber.trim() ? 0.6 : 1,
                }}
              >
                {entryLoading ? (
                  <>
                    <Spinner size="sm" /> Processing...
                  </>
                ) : (
                  "Register Entry →"
                )}
              </button>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN — VEHICLE EXIT ═══ */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              🚙 Vehicle Exit
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Search vehicle and process exit
            </div>
          </div>

          {/* ── Section 1: Search ── */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Search by Vehicle Number
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                style={{ ...inputStyle, flex: 1, fontSize: "0.95rem" }}
                placeholder="Enter vehicle number"
                value={exitSearch}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setExitSearch(val);
                  if (!val) {
                    setFoundEntry(null);
                    setExitSearchError(null);
                    setExitSuccess(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchVehicle();
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                autoComplete="off"
              />
              <button
                onClick={handleSearchVehicle}
                style={{
                  padding: "13px 18px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "80px",
                }}
              >
                {exitSearchLoading ? <Spinner size="sm" /> : "Search"}
              </button>
            </div>

            {exitSearchError && <div style={errorStyle}>⚠ {exitSearchError}</div>}
          </div>

          {/* ── Section 2: Found Entry Panel ── */}
          {foundEntry && !exitSuccess && (
            <div
              style={{
                background: "var(--bg-primary)",
                borderRadius: "10px",
                padding: "18px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#16a34a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "12px",
                }}
              >
                Vehicle Found
              </div>

              {[
                ["Vehicle Number", foundEntry.vehicleNumber, { fontWeight: 700 }],
                ["Slot", foundEntry.slotNumber, { fontWeight: 700, color: "var(--accent)" }],
                ["Floor", foundEntry.floorName, {}],
                [
                  "Entry Time",
                  new Date(foundEntry.entryTime).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  {},
                ],
                ["Duration", getDuration(foundEntry.entryTime), {}],
              ].map(([label, value, extraStyle]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.875rem",
                      ...extraStyle,
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}

              {exitError && <div style={{ ...errorStyle, marginTop: "10px" }}>⚠ {exitError}</div>}

              <button
                onClick={handleProcessExit}
                disabled={exitLoading}
                style={{
                  width: "100%",
                  marginTop: "14px",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "13px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: exitLoading ? 0.7 : 1,
                }}
              >
                {exitLoading ? (
                  <>
                    <Spinner size="sm" /> Processing...
                  </>
                ) : (
                  "Process Exit →"
                )}
              </button>
            </div>
          )}

          {/* ── Section 3: Exit Success Panel ── */}
          {exitSuccess && (
            <div
              style={{
                background: "#f0fff4",
                border: "1px solid #22c55e",
                borderRadius: "10px",
                padding: "20px",
                marginTop: "16px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#15803d", marginBottom: "10px" }}>
                ✅ Exit Processed!
              </div>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Vehicle: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {exitSuccess.vehicleNumber}
                </span>
              </div>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Slot: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {exitSuccess.slotNumber}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  {" "}is now available
                </span>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Duration: </span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {getDuration(exitSuccess.entryTime)}
                </span>
              </div>
              <button
                onClick={() => {
                  setExitSearch("");
                  setFoundEntry(null);
                  setExitSuccess(null);
                  setExitError(null);
                  setExitSearchError(null);
                }}
                style={{
                  width: "100%",
                  marginTop: "14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Process Another Exit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM — LIVE SLOT SUMMARY BAR ═══ */}
      <div style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Available */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              borderRight: "1px solid var(--border-color)",
              background: "#f0fff4",
            }}
          >
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "#16a34a" }}>
              {availableCount}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Available Slots
            </span>
          </div>

          {/* Occupied */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              borderRight: "1px solid var(--border-color)",
              background: "#fff5f5",
            }}
          >
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "#dc2626" }}>
              {occupiedCount}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Occupied Slots
            </span>
          </div>

          {/* Total */}
          <div
            style={{
              flex: 1,
              padding: "20px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "var(--bg-card)",
            }}
          >
            <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {totalCount}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Total Slots
            </span>
          </div>
        </div>

        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px" }}>
          Auto-refreshes every 30s
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OfficerDashboard;
