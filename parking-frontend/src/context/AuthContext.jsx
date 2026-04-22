import { createContext, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(() => localStorage.getItem("role") || "");
  const [username, setUsername] = useState(() => localStorage.getItem("username") || "");
  const [mallId, setMallId] = useState(() => {
    const stored = localStorage.getItem("mallId");
    return stored ? Number(stored) : null;
  });

  const isAuthenticated = !!token;

  const login = (data) => {
    setToken(data.token);
    setRole(data.role);
    setUsername(data.username);
    setMallId(data.mallId ?? null);

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);
    if (data.mallId != null) {
      localStorage.setItem("mallId", String(data.mallId));
    } else {
      localStorage.removeItem("mallId");
    }
  };

  const logout = () => {
    setToken("");
    setRole("");
    setUsername("");
    setMallId(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ token, role, username, mallId, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
