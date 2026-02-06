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

   // Block access completely if user is not active - don't render children at all
   // This prevents bypassing the modal by removing HTML via dev tools
  if (userStatus && userStatus !== "active") {
    return (
       <SuspendedModal 
         status={userStatus as "suspended" | "pending" | "disabled" | "token_expired"} 
         reason={suspensionReason || undefined} 
       />
    );
  }

  return <>{children}</>;
}
