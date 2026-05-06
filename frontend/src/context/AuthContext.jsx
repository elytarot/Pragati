// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/index.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem("pragati_user");
    const token  = localStorage.getItem("pragati_token");
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { clearSession(); }
    }
    setLoading(false);

    // Listen for logout events (triggered by axios interceptor on refresh failure)
    window.addEventListener("pragati:logout", clearSession);
    return () => window.removeEventListener("pragati:logout", clearSession);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem("pragati_token",   data.accessToken);
    localStorage.setItem("pragati_refresh", data.refreshToken);
    localStorage.setItem("pragati_user",    JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    clearSession();
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("pragati_token");
    localStorage.removeItem("pragati_refresh");
    localStorage.removeItem("pragati_user");
    setUser(null);
  }, []);

  const can = useCallback((action) => {
    if (!user) return false;
    const perms = {
      SUPER_ADMIN:          ["all"],
      DISTRICT_COORDINATOR: ["read","write","reports","iep_approve"],
      BLOCK_COORDINATOR:    ["read","write","iep_edit"],
      FIELD_WORKER:         ["read","write_own","iep_draft"],
      VIEWER:               ["read","reports"],
    };
    const userPerms = perms[user.role] || [];
    return userPerms.includes("all") || userPerms.includes(action);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
