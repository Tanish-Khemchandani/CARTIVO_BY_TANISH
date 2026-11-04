import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "../../context/AdminAuthContext";

// applies the dark admin palette to everything under /admin without
// touching the light storefront theme used everywhere else
export default function AdminThemeWrapper() {
  return (
    <AdminAuthProvider>
      <div className="admin-theme"><Outlet /></div>
    </AdminAuthProvider>
  );
}
