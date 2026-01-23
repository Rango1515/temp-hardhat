import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useWebsites } from '@/hooks/useWebsites';
import { useTickets } from '@/hooks/useTickets';
import { 
  Globe, 
  Ticket, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HardHat,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { websites, loading: websitesLoading } = useWebsites();
  const { tickets, loading: ticketsLoading } = useTickets();

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const activeWebsites = websites.filter(w => w.status === 'active').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'maintenance':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your hosting dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Websites</p>
              <p className="text-2xl font-bold text-foreground">
                {websitesLoading ? '...' : activeWebsites}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-lg">
              <Ticket className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-2xl font-bold text-foreground">
                {ticketsLoading ? '...' : openTickets}
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
              <p className="text-sm text-muted-foreground">Avg. Uptime</p>
              <p className="text-2xl font-bold text-foreground">99.9%</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Support Response</p>
              <p className="text-2xl font-bold text-foreground">&lt; 24h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Websites Section */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-foreground">Your Websites</h2>
            <Link to="/dashboard/websites">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {websitesLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : websites.length === 0 ? (
            <div className="text-center py-8">
              <HardHat className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No websites yet</p>
              <Link to="/#contact">
                <Button variant="default">Get Your First Website</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {websites.slice(0, 3).map((website) => (
                <div
                  key={website.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{website.name}</p>
                    <p className="text-sm text-muted-foreground">{website.domain || 'No domain yet'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(website.status)}`}>
                    {website.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tickets Section */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-foreground">Recent Tickets</h2>
            <Link to="/dashboard/tickets">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {ticketsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No support tickets</p>
              <p className="text-sm text-muted-foreground/70">All systems running smoothly!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
                >
                  {ticket.status === 'open' ? (
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  ) : ticket.status === 'resolved' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    ticket.status === 'open' 
                      ? 'text-orange-500 bg-orange-500/10'
                      : ticket.status === 'resolved'
                      ? 'text-green-500 bg-green-500/10'
                      : 'text-blue-500 bg-blue-500/10'
                  }`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-6">
        <h3 className="font-display text-xl text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link to="/dashboard/tickets">
            <Button variant="default">
              <Ticket className="w-4 h-4 mr-2" />
              New Support Ticket
            </Button>
          </Link>
          <Link to="/#contact">
            <Button variant="outline">
              <Globe className="w-4 h-4 mr-2" />
              Request New Website
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
