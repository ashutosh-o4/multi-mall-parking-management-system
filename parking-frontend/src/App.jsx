import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Login from "./pages/login/Login";
import SADashboard from "./pages/superadmin/SADashboard";
import Malls from "./pages/superadmin/Malls";
import SAStaff from "./pages/superadmin/SAStaff";
import ADashboard from "./pages/admin/ADashboard";
import Floors from "./pages/admin/Floors";
import Slots from "./pages/admin/Slots";
import AdminStaff from "./pages/admin/AdminStaff";
import AllocationConfig from "./pages/admin/AllocationConfig";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import ActiveEntries from "./pages/officer/ActiveEntries";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* SUPER_ADMIN routes */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SADashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/malls"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <Malls />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/staff"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SAStaff />
              </ProtectedRoute>
            }
          />

          {/* ADMIN routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <ADashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/floors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Floors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Slots />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation-config"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AllocationConfig />
              </ProtectedRoute>
            }
          />

          {/* OFFICER routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/active"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <ActiveEntries />
              </ProtectedRoute>
            }
          />

          {/* Change Password — all roles */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "OFFICER"]}>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;