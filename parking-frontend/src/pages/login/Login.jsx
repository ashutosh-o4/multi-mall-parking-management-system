import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";

const ROLE_DASHBOARDS = {
  SUPER_ADMIN: "/superadmin",
  ADMIN: "/admin",
  OFFICER: "/officer",
};

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && role) {
      navigate(ROLE_DASHBOARDS[role] || "/login", { replace: true });
    }
  }, [isAuthenticated, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      const payload = response.data.data;
      login(payload);

      const destination = ROLE_DASHBOARDS[payload.role] || "/login";
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Login failed.");
      } else {
        setError("Cannot connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-primary)",
          padding: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)",
            padding: "48px",
            maxWidth: "420px",
            width: "100%",
          }}
        >
          {/* Logo area */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: "block", margin: "0 auto 16px auto" }}
            >
              <rect width="56" height="56" rx="14" fill="var(--accent)" />
              <text
                x="50%"
                y="50%"
                dominantBaseline="central"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="30"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
              >
                P
              </text>
            </svg>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "var(--text-primary)",
                margin: "0 0 4px 0",
                letterSpacing: "-0.02em",
              }}
            >
              ParkIQ
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Multi-Mall Parking Management
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "errorSlideIn 0.25s ease-out",
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="login-username"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid var(--border-color)",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "28px" }}>
              <label
                htmlFor="login-password"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    paddingRight: "44px",
                    border: "1.5px solid var(--border-color)",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                backgroundColor: "var(--accent)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.opacity = "1";
              }}
            >
              {loading && (
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginTop: "24px",
          }}
        >
          Protected system — authorized personnel only
        </p>
      </div>
    </>
  );
}

export default Login;
