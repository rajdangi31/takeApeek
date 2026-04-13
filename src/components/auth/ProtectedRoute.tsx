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

  // Check if we are currently in the middle of a Supabase OAuth redirect
  const isProcessingAuth = window.location.hash.includes("access_token=") ||
    window.location.search.includes("code=");

  useEffect(() => {
    // Only redirect if we are NOT loading and NOT currently processing a hash
    if (!loading && !user && !isProcessingAuth) {
      console.log("[RouteGuard] No user detected. Redirecting to /login");
      navigate("/login", { state: { from: location }, replace: true });
    }
  }, [user, loading, navigate, location, isProcessingAuth]);

  // Stay in loading state if processing a token
  if (loading || isProcessingAuth) {
    return null; // Or your <PageLoader />
  }

  if (!user) return null;

  return <>{children}</>;
};
