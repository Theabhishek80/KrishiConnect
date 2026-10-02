import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  let user = null;
  try { user = JSON.parse(localStorage.getItem("kc_user") || "null"); } catch {}
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles?.length && !roles.includes(user.role)) {
    const home = user.role === "ADMIN" ? "/admin" : user.role === "FARMER" ? "/farmer" : "/";
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}
