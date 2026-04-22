import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { canAccess } from "../../utils/roleGuard";

const ROLE_DASHBOARDS = {
  SUPER_ADMIN: "/superadmin",
  ADMIN: "/admin",
  OFFICER: "/officer",
};

export function ProtectedRoute({ allowedRoles, children }) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(role, allowedRoles)) {
    const dashboard = ROLE_DASHBOARDS[role] || "/login";
    return <Navigate to={dashboard} replace />;
  }

  return children;
}
