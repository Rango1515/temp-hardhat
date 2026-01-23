import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Building, 
  Mail, 
  Phone,
  Calendar,
  Globe,
  Ticket,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface CustomerWithStats extends Profile {
  websiteCount: number;
  ticketCount: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch website counts per user
        const { data: websites } = await supabase
          .from('websites')
          .select('user_id');

        // Fetch ticket counts per user
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('user_id');

        // Merge counts with profiles
        const customersWithStats = profiles?.map(profile => ({
          ...profile,
          websiteCount: websites?.filter(w => w.user_id === profile.user_id).length || 0,
          ticketCount: tickets?.filter(t => t.user_id === profile.user_id).length || 0,
        })) || [];

        setCustomers(customersWithStats);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
          Customers
        </h1>
        <p className="text-muted-foreground">
          View and manage customer accounts.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border/50">
          <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No Customers Yet</h3>
          <p className="text-muted-foreground">
            Customers will appear here once they sign up.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-card rounded-xl border border-border/50 p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-foreground truncate">
                    {customer.full_name || 'No Name'}
                  </h3>
                  {customer.company_name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span className="truncate">{customer.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm mb-4">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{customer.websiteCount}</span>
                    <span className="text-muted-foreground"> sites</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">
                    <span className="font-medium text-foreground">{customer.ticketCount}</span>
                    <span className="text-muted-foreground"> tickets</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
