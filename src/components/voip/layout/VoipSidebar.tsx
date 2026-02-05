 import { Link, useLocation } from "react-router-dom";
 import { useState, useEffect, useCallback } from "react";
 import { cn } from "@/lib/utils";
 import { useVoipAuth } from "@/contexts/VoipAuthContext";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import {
   LayoutDashboard,
   Phone,
   History,
   Settings,
   Users,
   BarChart3,
   FileText,
   Ticket,
   Upload,
   CalendarDays,
   TrendingUp,
   Activity,
   ScrollText,
   Trophy,
   HelpCircle,
 } from "lucide-react";
 
 const clientNavItems = [
   { href: "/voip/dashboard", label: "Dashboard", icon: LayoutDashboard },
   { href: "/voip/dialer", label: "Dialer", icon: Phone },
   { href: "/voip/my-analytics", label: "My Analytics", icon: TrendingUp },
   { href: "/voip/calls", label: "Call History", icon: History },
   { href: "/voip/support", label: "Support", icon: HelpCircle },
   { href: "/voip/leaderboard", label: "Leaderboard", icon: Trophy },
   { href: "/voip/settings", label: "Settings", icon: Settings },
 ];
 
 const adminNavItems = [
   { href: "/voip/admin", label: "Admin Dashboard", icon: LayoutDashboard },
   { href: "/voip/admin/users", label: "Users", icon: Users },
   { href: "/voip/admin/leads", label: "Lead Upload", icon: Upload },
   { href: "/voip/admin/lead-info", label: "Lead Info", icon: FileText },
   { href: "/voip/admin/appointments", label: "Appointments", icon: CalendarDays },
   { href: "/voip/admin/duplicates", label: "Duplicate Review", icon: Users },
   { href: "/voip/admin/analytics", label: "Analytics", icon: BarChart3 },
   { href: "/voip/admin/client-analytics", label: "Client Analytics", icon: Activity },
   { href: "/voip/admin/tickets", label: "Tickets", icon: Ticket },
   { href: "/voip/admin/audit-log", label: "Audit Log", icon: ScrollText },
   { href: "/voip/admin/invite-tokens", label: "Invite Tokens", icon: FileText },
 ];
 
 export function VoipSidebar() {
   const location = useLocation();
   const { isAdmin } = useVoipAuth();
   const { apiCall } = useVoipApi();
   const [ticketCount, setTicketCount] = useState(0);
 
   // Check for open tickets (for badge)
   const checkTickets = useCallback(async () => {
     const result = await apiCall<{ count: number }>("voip-support", {
       params: { action: "ticket-count" },
     });
 
     if (result.data) {
       setTicketCount(result.data.count);
     }
   }, [apiCall]);
 
   useEffect(() => {
     checkTickets();
     // Poll every 60 seconds
     const interval = setInterval(checkTickets, 60000);
     return () => clearInterval(interval);
   }, [checkTickets]);
 
   const navItems = isAdmin ? [...adminNavItems, ...clientNavItems.slice(1)] : clientNavItems;
 
   return (
     <aside className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border">
       <div className="p-4 border-b border-border">
         <Link to="/voip/dashboard" className="flex items-center gap-2">
           <div className="bg-primary p-2 rounded-lg">
             <Phone className="w-5 h-5 text-primary-foreground" />
           </div>
           <span className="font-display text-lg text-foreground">HardhatHosting</span>
         </Link>
       </div>
 
       <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
         {isAdmin && (
           <div className="mb-4">
             <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
               Admin
             </span>
           </div>
         )}
 
         {navItems.map((item) => {
           const Icon = item.icon;
           const isActive = location.pathname === item.href;
 
           // Add separator before client items when admin
           const isFirstClientItem = isAdmin && item.href === "/voip/dialer";
 
             // Check for badge indicator
             const showBadge =
               ((item.href === "/voip/support" && !isAdmin) ||
                 (item.href === "/voip/admin/tickets" && isAdmin)) &&
               ticketCount > 0 &&
               !isActive;
 
           return (
             <div key={item.href}>
               {isFirstClientItem && (
                 <div className="my-4 pt-4 border-t border-border">
                   <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                     Client
                   </span>
                 </div>
               )}
               <Link
                 to={item.href}
                 className={cn(
                   "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                   isActive
                     ? "bg-primary text-primary-foreground"
                     : "text-muted-foreground hover:bg-muted hover:text-foreground"
                 )}
               >
                 <Icon className="w-5 h-5" />
                 {item.label}
                   {/* Badge indicator */}
                   {showBadge && (
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 min-w-5 h-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5">
                       {ticketCount > 99 ? "99+" : ticketCount}
                     </span>
                 )}
               </Link>
             </div>
           );
         })}
       </nav>
 
       <div className="p-4 border-t border-border">
         <Link
           to="/"
           className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
         >
           ← Back to Main Site
         </Link>
       </div>
     </aside>
   );
 }
