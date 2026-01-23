import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DemoSite from "./pages/DemoSite";

// Dashboard
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Websites from "./pages/Websites";
import Tickets from "./pages/Tickets";
import AccountSettings from "./pages/AccountSettings";

// Admin
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminCustomers from "./pages/admin/AdminCustomers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/demo/:trade" element={<DemoSite />} />

            {/* Customer Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="websites" element={<Websites />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="settings" element={<AccountSettings />} />
            </Route>

            {/* Admin Panel */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="customers" element={<AdminCustomers />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
