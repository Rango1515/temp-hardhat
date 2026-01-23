import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  HardHat,
  LayoutDashboard,
  Globe,
  Ticket,
  Settings,
  LogOut,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import AIChatWidget from '@/components/chat/AIChatWidget';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/websites', icon: Globe, label: 'My Websites' },
  { to: '/dashboard/tickets', icon: Ticket, label: 'Support Tickets' },
  { to: '/dashboard/settings', icon: Settings, label: 'Account Settings' },
];

const DashboardLayout = () => {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-border/10">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <HardHat className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg text-secondary-foreground tracking-wider">
              HARDHAT
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-secondary-foreground"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-secondary border-r border-border/10 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 lg:h-20 flex items-center px-6 border-b border-border/10">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <HardHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl text-secondary-foreground tracking-wider">
                  HARDHAT
                </span>
                <span className="font-display text-xl text-primary tracking-wider ml-1">
                  HOSTING
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-secondary-foreground/70 hover:bg-secondary-foreground/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-4 border border-primary/50',
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-primary hover:bg-primary/10'
                )}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Admin Panel</span>
              </Link>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border/10">
            <div className="text-sm text-secondary-foreground/70 mb-3 truncate">
              {user?.email}
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
