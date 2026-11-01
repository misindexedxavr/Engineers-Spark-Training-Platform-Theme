import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  // Avoid a full-screen legacy authentication splash while session state resolves.
  if (loading) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
