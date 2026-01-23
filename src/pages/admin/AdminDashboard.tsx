import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Ticket, 
  Users, 
  Globe, 
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  totalCustomers: number;
  totalWebsites: number;
  openTickets: number;
  resolvedTickets: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalWebsites: 0,
    openTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, websitesRes, ticketsRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('websites').select('id', { count: 'exact', head: true }),
          supabase.from('support_tickets').select('status'),
        ]);

        const openTickets = ticketsRes.data?.filter(t => t.status === 'open').length || 0;
        const resolvedTickets = ticketsRes.data?.filter(t => t.status === 'resolved').length || 0;

        setStats({
          totalCustomers: profilesRes.count || 0,
          totalWebsites: websitesRes.count || 0,
          openTickets,
          resolvedTickets,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of your hosting platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.totalCustomers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Websites</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.totalWebsites}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.openTickets}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved Tickets</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? '...' : stats.resolvedTickets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-xl border border-destructive/20 p-6">
        <h3 className="font-display text-xl text-foreground mb-4">Admin Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <a
            href="/admin/tickets"
            className="bg-card p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Ticket className="w-8 h-8 text-primary mb-2" />
            <h4 className="font-medium text-foreground">View Tickets</h4>
            <p className="text-sm text-muted-foreground">Manage support requests</p>
          </a>
          <a
            href="/admin/customers"
            className="bg-card p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="font-medium text-foreground">View Customers</h4>
            <p className="text-sm text-muted-foreground">Manage customer accounts</p>
          </a>
          <a
            href="/dashboard"
            className="bg-card p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Globe className="w-8 h-8 text-green-500 mb-2" />
            <h4 className="font-medium text-foreground">Customer View</h4>
            <p className="text-sm text-muted-foreground">Switch to customer dashboard</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
