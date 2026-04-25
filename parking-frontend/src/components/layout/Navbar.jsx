import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export function Navbar({ title }) {
  const { username } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: "240px",
        height: "60px",
        width: "calc(100% - 240px)",
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        zIndex: 10,
        boxSizing: "border-box",
      }}
    >
      {/* Left — page title */}
      <span
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>

      {/* Right — controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            lineHeight: 1,
            padding: 0,
          }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Username */}
        <span
          onClick={() => navigate("/change-password")}
          title="Change password"
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          Hello, {username}
        </span>
      </div>
    </header>
  );
}
