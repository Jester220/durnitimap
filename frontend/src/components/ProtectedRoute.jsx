import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}