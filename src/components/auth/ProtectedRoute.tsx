import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    console.log("[RouteGuard] Loading... suppressing redirect.");
    return null;
  }

  if (!user) {
    console.log("[RouteGuard] No user detected. Redirecting to /login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("[RouteGuard] User authorized:", user.id);
  return <>{children}</>;
};
