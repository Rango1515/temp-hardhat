import { useWebsites } from '@/hooks/useWebsites';
import { Globe, ExternalLink, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Websites = () => {
  const { websites, loading } = useWebsites();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'maintenance':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'suspended':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
            My Websites
          </h1>
          <p className="text-muted-foreground">
            Manage and monitor your hosted websites.
          </p>
        </div>
        <Link to="/#contact">
          <Button variant="default">
            <Globe className="w-4 h-4 mr-2" />
            Request New Site
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading websites...</div>
      ) : websites.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Globe className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No Websites Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Ready to get your construction company online? Contact us to get started with your first website.
          </p>
          <Link to="/#contact">
            <Button variant="default" size="lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <div
              key={website.id}
              className="bg-card rounded-xl border border-border/50 overflow-hidden"
            >
              {/* Status Header */}
              <div className={`px-4 py-2 border-b ${getStatusColor(website.status)}`}>
                <span className="text-sm font-medium capitalize">{website.status}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-xl text-foreground mb-2">{website.name}</h3>
                
                {website.domain && (
                  <a 
                    href={`https://${website.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {website.domain}
                  </a>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Plan: {website.plan || 'Starter'}</span>
                  </div>
                  {website.monthly_cost && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>${website.monthly_cost}/month</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Uptime: {website.uptime_percentage || 99.9}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6">
                <Link to="/dashboard/tickets">
                  <Button variant="outline" className="w-full">
                    Get Support
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Websites;
