import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Login from "./pages/login/Login";
import SADashboard from "./pages/superadmin/SADashboard";
import Malls from "./pages/superadmin/Malls";
import SAStaff from "./pages/superadmin/SAStaff";

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
                <DashboardLayout title="Dashboard">
                  <div>Admin Dashboard</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/floors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <DashboardLayout title="Floors">
                  <div>Floors Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <DashboardLayout title="Slots">
                  <div>Slots Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <DashboardLayout title="Staff">
                  <div>Admin Staff Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation-config"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <DashboardLayout title="Allocation Config">
                  <div>Allocation Config Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* OFFICER routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <DashboardLayout title="Dashboard">
                  <div>Officer Dashboard</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/active"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <DashboardLayout title="Active Entries">
                  <div>Active Entries Page</div>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;