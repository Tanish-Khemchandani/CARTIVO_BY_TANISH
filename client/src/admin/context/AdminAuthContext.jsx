import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "../../api/client";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/admin/auth/me")
      .then((response) => { if (active) setAdmin(response.data); })
      .catch(() => { if (active) setAdmin(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function login(credentials) {
    const response = await api.post("/admin/auth/login", credentials);
    setAdmin(response.data);
    return response.data;
  }

  async function logout() {
    try {
      await api.post("/admin/auth/logout", {});
    } finally {
      setAdmin(null);
    }
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}

export function RequireAdmin() {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--color-muted)]">Checking admin session...</div>;
  }
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <Outlet />;
}
