import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Spinner } from "../components/ui/Spinner";

function ChangePassword() {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ─── Dashboard path by role ─────────────────────────
  const getDashboardPath = () => {
    if (role === "SUPER_ADMIN") return "/superadmin";
    if (role === "ADMIN") return "/admin";
    return "/officer";
  };

  // ─── Password strength ─────────────────────────────
  const getStrength = () => {
    const p = form.newPassword;
    if (!p) return null;
    if (p.length < 8) return { label: "Too short", color: "#dc2626", width: "25%" };
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    if (hasUpper && hasNumber && hasSpecial && p.length >= 12)
      return { label: "Strong", color: "#16a34a", width: "100%" };
    if (hasUpper && hasNumber && p.length >= 8)
      return { label: "Good", color: "#f59e0b", width: "60%" };
    return { label: "Weak", color: "#dc2626", width: "25%" };
  };

  // ─── Requirement checks ────────────────────────────
  const requirements = [
    { text: "At least 8 characters", met: form.newPassword.length >= 8 },
    { text: "At least one uppercase letter", met: /[A-Z]/.test(form.newPassword) },
    { text: "At least one number", met: /[0-9]/.test(form.newPassword) },
  ];

  // ─── Submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from current password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.put("/staff/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading ||
    form.newPassword.length < 8 ||
    form.newPassword !== form.confirmPassword;

  const strength = getStrength();

  // ─── Shared styles ─────────────────────────────────
  const inputWrapperStyle = { position: "relative" };

  const inputStyle = {
    width: "100%",
    padding: "11px 44px 11px 14px",
    border: "1.5px solid var(--border-color)",
    borderRadius: "8px",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    outline: "none",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  };

  const toggleBtnStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-secondary)",
    padding: "2px",
    display: "flex",
    alignItems: "center",
  };

  const eyeOpen = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const eyeClosed = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );

  return (
    <DashboardLayout title="Change Password">
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "16px",
            padding: "36px",
          }}
        >
          {/* Card header */}
          <div
            style={{
              borderBottom: "1px solid var(--border-color)",
              paddingBottom: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              🔐 Change Password
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Choose a strong password you haven&apos;t used before
            </div>
          </div>

          {success ? (
            /* ── Success State ── */
            <div
              style={{
                background: "#f0fff4",
                border: "1px solid #22c55e",
                borderRadius: "10px",
                padding: "28px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#15803d" }}>
                Password Changed Successfully
              </div>
              <div style={{ color: "#16a34a", fontSize: "0.9rem", marginTop: "8px" }}>
                Your new password is active. Use it on your next login.
              </div>
              <button
                onClick={() => navigate(getDashboardPath())}
                style={{
                  marginTop: "20px",
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "11px 24px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            /* ── Default Form ── */
            <div>
              {/* Error */}
              {error && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    color: "#dc2626",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "0.875rem",
                    marginBottom: "20px",
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {/* Field 1: Current Password */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Current Password
                </label>
                <div style={inputWrapperStyle}>
                  <input
                    type={showCurrent ? "text" : "password"}
                    style={inputStyle}
                    value={form.currentPassword}
                    onChange={(e) => updateField("currentPassword", e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={toggleBtnStyle}
                  >
                    {showCurrent ? eyeClosed : eyeOpen}
                  </button>
                </div>
              </div>

              {/* Field 2: New Password */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  New Password
                </label>
                <div style={inputWrapperStyle}>
                  <input
                    type={showNew ? "text" : "password"}
                    style={inputStyle}
                    value={form.newPassword}
                    onChange={(e) => updateField("newPassword", e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={toggleBtnStyle}
                  >
                    {showNew ? eyeClosed : eyeOpen}
                  </button>
                </div>
                {/* Strength indicator */}
                {strength && (
                  <div style={{ marginTop: "8px" }}>
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "2px",
                        width: "100%",
                        background: "var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: strength.width,
                          background: strength.color,
                          borderRadius: "2px",
                          transition: "width 0.3s ease, background 0.3s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: strength.color,
                        marginTop: "4px",
                      }}
                    >
                      {strength.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 3: Confirm New Password */}
              <div style={{ marginBottom: "28px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Confirm New Password
                </label>
                <div style={inputWrapperStyle}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    style={inputStyle}
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={toggleBtnStyle}
                  >
                    {showConfirm ? eyeClosed : eyeOpen}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "4px" }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              {/* Requirements hint */}
              <div
                style={{
                  background: "var(--bg-primary)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  Password requirements
                </div>
                {requirements.map((req) => (
                  <div
                    key={req.text}
                    style={{
                      fontSize: "0.8rem",
                      color: req.met ? "#16a34a" : "var(--text-secondary)",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{req.met ? "✓" : "•"}</span>
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isDisabled}
                style={{
                  width: "100%",
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  padding: "13px",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" /> Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ChangePassword;
