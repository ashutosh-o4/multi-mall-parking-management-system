import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../ui/Badge";

const NAV_LINKS = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: "🏠", to: "/superadmin" },
    { label: "Malls", icon: "🏢", to: "/superadmin/malls" },
    { label: "Staff", icon: "👥", to: "/superadmin/staff" },
  ],
  ADMIN: [
    { label: "Dashboard", icon: "🏠", to: "/admin" },
    { label: "Floors", icon: "🏗️", to: "/admin/floors" },
    { label: "Slots", icon: "🅿️", to: "/admin/slots" },
    { label: "Staff", icon: "👥", to: "/admin/staff" },
    { label: "Allocation Config", icon: "⚙️", to: "/admin/allocation-config" },
  ],
  OFFICER: [
    { label: "Dashboard", icon: "🏠", to: "/officer" },
    { label: "Active Entries", icon: "📋", to: "/officer/active" },
  ],
};

export function Sidebar() {
  const { role, username, logout } = useAuth();
  const location = useLocation();
  const [logoutHover, setLogoutHover] = useState(false);

  const links = NAV_LINKS[role] || [];

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "240px",
        height: "100vh",
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Logo section */}
      <div
        style={{
          paddingBottom: "20px",
          marginBottom: "16px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          🅿️ ParkIQ
        </div>
        <Badge status={role} />
      </div>

      {/* Navigation links */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                backgroundColor: isActive ? "rgba(79, 70, 229, 0.1)" : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{link.icon}</span>
              <span style={{ fontSize: "0.875rem" }}>{link.label}</span>
            </NavLink>
          );
        })}

        {/* Change Password link */}
        {(() => {
          const isActive = location.pathname === "/change-password";
          return (
            <NavLink
              to="/change-password"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                textDecoration: "none",
                marginTop: "8px",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "16px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--accent)" : "var(--text-secondary)",
                backgroundColor: isActive ? "rgba(79, 70, 229, 0.1)" : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🔐</span>
              <span style={{ fontSize: "0.875rem" }}>Change Password</span>
            </NavLink>
          );
        })()}
      </nav>

      {/* User section */}
      <div
        style={{
          paddingTop: "20px",
          marginTop: "16px",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "2px",
            }}
          >
            {username}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            Logged in as
          </div>
        </div>
        <button
          onClick={logout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          style={{
            width: "100%",
            padding: "9px",
            borderRadius: "8px",
            background: logoutHover ? "#fee2e2" : "transparent",
            border: `1px solid ${logoutHover ? "#fca5a5" : "var(--border-color)"}`,
            color: logoutHover ? "#dc2626" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "0.8125rem",
            transition: "all 0.15s ease",
          }}
        >
          ← Logout
        </button>
      </div>
    </aside>
  );
}
