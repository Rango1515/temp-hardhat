 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route } from "react-router-dom";
 
 // Pages
 import Index from "./pages/Index";
 import NotFound from "./pages/NotFound";
 import DemoSite from "./pages/DemoSite";
 
 // VoIP Pages
 import { VoipAuthProvider } from "./contexts/VoipAuthContext";
 import { ProtectedRoute } from "./components/voip/auth/ProtectedRoute";
 import { AdminRoute } from "./components/voip/auth/AdminRoute";
 import VoipAuth from "./pages/voip/Auth";
 import ClientDashboard from "./pages/voip/ClientDashboard";
 import Dialer from "./pages/voip/Dialer";
 import CallHistory from "./pages/voip/CallHistory";
 import Settings from "./pages/voip/Settings";
 import MyAnalytics from "./pages/voip/MyAnalytics";
 import AdminDashboard from "./pages/voip/admin/AdminDashboard";
 import AdminUsers from "./pages/voip/admin/Users";
 
 import AdminInviteTokens from "./pages/voip/admin/InviteTokens";
 import LeadUpload from "./pages/voip/admin/LeadUpload";
 import LeadInfo from "./pages/voip/admin/LeadInfo";
 import DuplicateReview from "./pages/voip/admin/DuplicateReview";
 import Appointments from "./pages/voip/admin/Appointments";
 import ClientAnalytics from "./pages/voip/admin/ClientAnalytics";
 import AuditLog from "./pages/voip/admin/AuditLog";
 import AdminTickets from "./pages/voip/admin/Tickets";
 import Terms from "./pages/Terms";
 import Privacy from "./pages/Privacy";
import Leaderboard from "./pages/voip/Leaderboard";
import Support from "./pages/voip/Support";
import HowTo from "./pages/voip/HowTo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <VoipAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/demo/:trade" element={<DemoSite />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* VoIP Auth */}
            <Route path="/voip/auth" element={<VoipAuth />} />

            {/* VoIP Client Routes */}
            <Route path="/voip/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
            <Route path="/voip/dialer" element={<ProtectedRoute><Dialer /></ProtectedRoute>} />
            <Route path="/voip/my-analytics" element={<ProtectedRoute><MyAnalytics /></ProtectedRoute>} />
            <Route path="/voip/calls" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
            <Route path="/voip/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
             <Route path="/voip/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
             <Route path="/voip/how-to" element={<ProtectedRoute><HowTo /></ProtectedRoute>} />
             <Route path="/voip/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />

            {/* VoIP Admin Routes */}
            <Route path="/voip/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/voip/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/voip/admin/leads" element={<AdminRoute><LeadUpload /></AdminRoute>} />
            <Route path="/voip/admin/lead-info" element={<AdminRoute><LeadInfo /></AdminRoute>} />
            <Route path="/voip/admin/appointments" element={<AdminRoute><Appointments /></AdminRoute>} />
            <Route path="/voip/admin/duplicates" element={<AdminRoute><DuplicateReview /></AdminRoute>} />
            
            <Route path="/voip/admin/client-analytics" element={<AdminRoute><ClientAnalytics /></AdminRoute>} />
            <Route path="/voip/admin/audit-log" element={<AdminRoute><AuditLog /></AdminRoute>} />
            <Route path="/voip/admin/invite-tokens" element={<AdminRoute><AdminInviteTokens /></AdminRoute>} />
             <Route path="/voip/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VoipAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
