import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth guards (small, needed immediately)
import { VoipAuthProvider } from "./contexts/VoipAuthContext";
import { ProtectedRoute } from "./components/voip/auth/ProtectedRoute";
import { AdminRoute } from "./components/voip/auth/AdminRoute";
import { PartnerRoute } from "./components/voip/auth/PartnerRoute";

// ALL pages lazy-loaded for smaller initial bundle
const Index = lazy(() => import("./pages/Index"));
const DemoSite = lazy(() => import("./pages/DemoSite"));
const ServicePage = lazy(() => import("./pages/seo/ServicePage"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const VoipAuth = lazy(() => import("./pages/voip/Auth"));
const PartnerSignup = lazy(() => import("./pages/voip/PartnerSignup"));
const ClientDashboard = lazy(() => import("./pages/voip/ClientDashboard"));
const Dialer = lazy(() => import("./pages/voip/Dialer"));
const Settings = lazy(() => import("./pages/voip/Settings"));
const Support = lazy(() => import("./pages/voip/Support"));
const HowTo = lazy(() => import("./pages/voip/HowTo"));
const CallHistory = lazy(() => import("./pages/voip/CallHistory"));
const MyAnalytics = lazy(() => import("./pages/voip/MyAnalytics"));
const Leaderboard = lazy(() => import("./pages/voip/Leaderboard"));
const AdminDashboard = lazy(() => import("./pages/voip/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/voip/admin/Users"));
const AdminInviteTokens = lazy(() => import("./pages/voip/admin/InviteTokens"));
const LeadUpload = lazy(() => import("./pages/voip/admin/LeadUpload"));
const LeadInfo = lazy(() => import("./pages/voip/admin/LeadInfo"));
const DuplicateReview = lazy(() => import("./pages/voip/admin/DuplicateReview"));
const Appointments = lazy(() => import("./pages/voip/admin/Appointments"));
const ClientAnalytics = lazy(() => import("./pages/voip/admin/ClientAnalytics"));
const AuditLog = lazy(() => import("./pages/voip/admin/AuditLog"));
const AdminTickets = lazy(() => import("./pages/voip/admin/Tickets"));
const Partners = lazy(() => import("./pages/voip/admin/Partners"));
const PartnerTokens = lazy(() => import("./pages/voip/admin/PartnerTokens"));
const PartnerPayouts = lazy(() => import("./pages/voip/admin/PartnerPayouts"));
const MailInbox = lazy(() => import("./pages/voip/admin/MailInbox"));
const PartnerDashboard = lazy(() => import("./pages/voip/partner/PartnerDashboard"));
const PartnerClients = lazy(() => import("./pages/voip/partner/PartnerClients"));
const PartnerEarnings = lazy(() => import("./pages/voip/partner/PartnerEarnings"));

const LazyFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,       // Data stays fresh for 60s — prevents refetch on every mount
      gcTime: 5 * 60_000,      // Keep unused cache for 5 min
      retry: 1,                // Only retry once on failure
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VoipAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/demo/:trade" element={<DemoSite />} />
                <Route path="/services/:slug" element={<ServicePage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                {/* Error Pages */}
                <Route path="/error/400" element={<ErrorPage code={400} />} />
                <Route path="/error/401" element={<ErrorPage code={401} />} />
                <Route path="/error/403" element={<ErrorPage code={403} />} />
                <Route path="/error/404" element={<ErrorPage code={404} />} />
                <Route path="/error/408" element={<ErrorPage code={408} />} />
                <Route path="/error/500" element={<ErrorPage code={500} />} />
                <Route path="/error/502" element={<ErrorPage code={502} />} />
                <Route path="/error/503" element={<ErrorPage code={503} />} />

                {/* VoIP Auth */}
                <Route path="/voip/auth" element={<VoipAuth />} />
                <Route path="/voip/partner-signup" element={<PartnerSignup />} />

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
                <Route path="/voip/admin/partners" element={<AdminRoute><Partners /></AdminRoute>} />
                <Route path="/voip/admin/partner-tokens" element={<AdminRoute><PartnerTokens /></AdminRoute>} />
                <Route path="/voip/admin/partner-payouts" element={<AdminRoute><PartnerPayouts /></AdminRoute>} />
                <Route path="/voip/admin/mail" element={<AdminRoute><MailInbox /></AdminRoute>} />

                {/* Partner Routes */}
                <Route path="/voip/partner/dashboard" element={<PartnerRoute><PartnerDashboard /></PartnerRoute>} />
                <Route path="/voip/partner/clients" element={<PartnerRoute><PartnerClients /></PartnerRoute>} />
                <Route path="/voip/partner/earnings" element={<PartnerRoute><PartnerEarnings /></PartnerRoute>} />

                {/* Catch-all → 404 */}
                <Route path="*" element={<ErrorPage code={404} />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </VoipAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
