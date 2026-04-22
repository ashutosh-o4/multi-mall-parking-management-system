import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Login from "./pages/login/Login";

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
                <div>SA Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/malls"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <div>Malls Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/staff"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <div>SA Staff Page</div>
              </ProtectedRoute>
            }
          />

          {/* ADMIN routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/floors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div>Floors Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div>Slots Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div>Admin Staff Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation-config"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <div>Allocation Config Page</div>
              </ProtectedRoute>
            }
          />

          {/* OFFICER routes */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <div>Officer Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/active"
            element={
              <ProtectedRoute allowedRoles={["OFFICER"]}>
                <div>Active Entries Page</div>
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