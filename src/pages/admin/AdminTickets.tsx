import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SupportTicket = Database['public']['Tables']['support_tickets']['Row'];
type TicketResponse = Database['public']['Tables']['ticket_responses']['Row'];
type TicketStatus = Database['public']['Enums']['ticket_status'];

interface TicketWithDetails extends SupportTicket {
  ticket_responses?: TicketResponse[];
  profiles?: { full_name: string | null; company_name: string | null } | null;
}

const AdminTickets = () => {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTickets = async () => {
    try {
      // Fetch tickets with responses
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          ticket_responses (*)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch profiles separately to get user info
      const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, company_name')
        .in('user_id', userIds);

      // Merge profiles with tickets
      const ticketsWithProfiles = ticketsData?.map(ticket => ({
        ...ticket,
        profiles: profilesData?.find(p => p.user_id === ticket.user_id) || null,
      })) || [];

      setTickets(ticketsWithProfiles);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, fetchTickets)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_responses' }, fetchTickets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddResponse = async (ticketId: string) => {
    if (!newResponse.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('ticket_responses').insert({
        ticket_id: ticketId,
        user_id: user.id,
        message: newResponse,
        is_admin: true,
      });

      if (error) throw error;

      toast({
        title: "Response Sent",
        description: "Your response has been added to the ticket.",
      });

      setNewResponse('');
      await fetchTickets();
    } catch (error) {
      console.error('Error adding response:', error);
      toast({
        title: "Error",
        description: "Failed to send response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${status.replace('_', ' ')}.`,
      });

      await fetchTickets();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Ticket className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const filteredTickets = statusFilter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  const activeTicket = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
            All Support Tickets
          </h1>
          <p className="text-muted-foreground">
            Manage customer support requests.
          </p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-medium text-foreground">
              Tickets ({filteredTickets.length})
            </h2>
          </div>
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    selectedTicket === ticket.id ? 'bg-muted/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.profiles?.company_name || ticket.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 overflow-hidden">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display text-xl text-foreground mb-2">
                      {activeTicket.subject}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>
                        {activeTicket.profiles?.full_name || 'Unknown'} 
                        {activeTicket.profiles?.company_name && ` (${activeTicket.profiles.company_name})`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={activeTicket.status}
                    onValueChange={(value: TicketStatus) => handleStatusChange(activeTicket.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Priority: <span className="font-medium capitalize">{activeTicket.priority}</span>
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[400px] space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Customer</p>
                  <p className="text-foreground whitespace-pre-wrap">{activeTicket.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(activeTicket.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>

                {activeTicket.ticket_responses?.map((response) => (
                  <div
                    key={response.id}
                    className={`rounded-lg p-4 ${
                      response.is_admin
                        ? 'bg-destructive/10 border border-destructive/20'
                        : 'bg-muted/50'
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      {response.is_admin ? 'Admin' : 'Customer'}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">{response.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(response.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your response..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleAddResponse(activeTicket.id)}
                    disabled={isSubmitting || !newResponse.trim()}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Ticket className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
