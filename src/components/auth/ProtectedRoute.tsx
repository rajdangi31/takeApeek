import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      console.log("[RouteGuard] No user detected. Guarded imperative redirect to /login from:", location.pathname);
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    console.log("[RouteGuard] Loading... suppressing redirect.");
    return null;
  }

  if (!user) {
    // Return null while navigating to avoid rendering protected components
    return null;
  }

  console.log("[RouteGuard] User authorized:", user.id);
  return <>{children}</>;
};
