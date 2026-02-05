import { Navigate, useLocation } from "react-router-dom";
import { useVoipAuth } from "@/contexts/VoipAuthContext";
import { SuspendedModal } from "@/components/voip/SuspendedModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, userStatus, suspensionReason } = useVoipAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/voip/auth" state={{ from: location }} replace />;
  }

  // Show suspended modal if user is not active
  if (userStatus && userStatus !== "active") {
    return (
      <>
        {children}
        <SuspendedModal 
          status={userStatus as "suspended" | "pending" | "disabled"} 
          reason={suspensionReason || undefined} 
        />
      </>
    );
  }

  return <>{children}</>;
}
