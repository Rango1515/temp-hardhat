import { Navigate } from "react-router-dom";
import { useVoipAuth } from "@/contexts/VoipAuthContext";

interface PartnerRouteProps {
  children: React.ReactNode;
}

export function PartnerRoute({ children }: PartnerRouteProps) {
  const { isAuthenticated, isPartner, isAdmin, isLoading } = useVoipAuth();

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

  // Admins can also access partner routes
  if (!isPartner && !isAdmin) {
    return <Navigate to="/voip/dashboard" replace />;
  }

  return <>{children}</>;
}
