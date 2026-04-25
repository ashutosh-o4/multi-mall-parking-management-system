import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function NotFound() {
  const navigate = useNavigate();

  let role = null;
  try {
    const auth = useAuth();
    role = auth?.role || null;
  } catch {
    role = null;
  }

  const handleGoToDashboard = () => {
    if (!role) {
      navigate("/login");
      return;
    }
    if (role === "SUPER_ADMIN") navigate("/superadmin");
    else if (role === "ADMIN") navigate("/admin");
    else if (role === "OFFICER") navigate("/officer");
    else navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "var(--bg-primary)",
        minHeight: "100vh",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        {/* 404 number */}
        <div
          style={{
            fontSize: "6rem",
            fontWeight: 800,
            color: "var(--accent)",
            lineHeight: 1,
            marginBottom: 0,
          }}
        >
          404
        </div>

        {/* Parking illustration */}
        <svg
          width="150"
          height="80"
          viewBox="0 0 150 80"
          fill="none"
          style={{ marginTop: "8px" }}
        >
          {/* Car body */}
          <rect
            x="25"
            y="35"
            width="100"
            height="28"
            rx="6"
            fill="var(--accent)"
            fillOpacity="0.2"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          {/* Car roof */}
          <rect
            x="45"
            y="20"
            width="55"
            height="18"
            rx="5"
            fill="var(--accent)"
            fillOpacity="0.15"
            stroke="var(--accent)"
            strokeWidth="2"
          />
          {/* Left wheel */}
          <circle cx="50" cy="63" r="8" fill="var(--border-color)" stroke="var(--text-secondary)" strokeWidth="2" />
          <circle cx="50" cy="63" r="3" fill="var(--bg-primary)" />
          {/* Right wheel */}
          <circle cx="100" cy="63" r="8" fill="var(--border-color)" stroke="var(--text-secondary)" strokeWidth="2" />
          <circle cx="100" cy="63" r="3" fill="var(--bg-primary)" />
          {/* P letter above */}
          <text
            x="75"
            y="16"
            textAnchor="middle"
            fill="var(--accent)"
            fontSize="16"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            P
          </text>
        </svg>

        {/* Heading */}
        <div
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginTop: "24px",
          }}
        >
          Page Not Found
        </div>

        {/* Description */}
        <div
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            marginTop: "8px",
            lineHeight: 1.6,
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "28px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              padding: "11px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ← Go Back
          </button>
          <button
            onClick={handleGoToDashboard}
            style={{
              background: "var(--accent)",
              color: "white",
              border: "none",
              padding: "11px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
