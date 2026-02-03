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
import MyNumbers from "./pages/voip/MyNumbers";
import RequestNumber from "./pages/voip/RequestNumber";
import ApiKeys from "./pages/voip/ApiKeys";
import Settings from "./pages/voip/Settings";
import AdminDashboard from "./pages/voip/admin/AdminDashboard";
import AdminUsers from "./pages/voip/admin/Users";
import AdminNumbers from "./pages/voip/admin/Numbers";
import AdminAnalytics from "./pages/voip/admin/Analytics";
import AdminRequests from "./pages/voip/admin/Requests";
import AdminInviteTokens from "./pages/voip/admin/InviteTokens";

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

            {/* VoIP Auth */}
            <Route path="/voip/auth" element={<VoipAuth />} />

            {/* VoIP Client Routes */}
            <Route path="/voip/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
            <Route path="/voip/dialer" element={<ProtectedRoute><Dialer /></ProtectedRoute>} />
            <Route path="/voip/calls" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
            <Route path="/voip/numbers" element={<ProtectedRoute><MyNumbers /></ProtectedRoute>} />
            <Route path="/voip/request-number" element={<ProtectedRoute><RequestNumber /></ProtectedRoute>} />
            <Route path="/voip/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
            <Route path="/voip/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* VoIP Admin Routes */}
            <Route path="/voip/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/voip/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/voip/admin/numbers" element={<AdminRoute><AdminNumbers /></AdminRoute>} />
            <Route path="/voip/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/voip/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
            <Route path="/voip/admin/invite-tokens" element={<AdminRoute><AdminInviteTokens /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VoipAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
