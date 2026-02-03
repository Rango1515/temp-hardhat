import { Navigate } from "react-router-dom";
import { useVoipAuth } from "@/contexts/VoipAuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useVoipAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/voip/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/voip/dashboard" replace />;
  }

  return <>{children}</>;
}
