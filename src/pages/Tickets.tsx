import { useState } from 'react';
import { useTickets } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Ticket,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type TicketPriority = Database['public']['Enums']['ticket_priority'];

const Tickets = () => {
  const { tickets, loading, createTicket, addResponse } = useTickets();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'medium' as TicketPriority,
  });
  const [newResponse, setNewResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;
    
    setIsSubmitting(true);
    await createTicket(newTicket.subject, newTicket.message, newTicket.priority);
    setNewTicket({ subject: '', message: '', priority: 'medium' });
    setIsCreateOpen(false);
    setIsSubmitting(false);
  };

  const handleAddResponse = async (ticketId: string) => {
    if (!newResponse.trim()) return;
    
    setIsSubmitting(true);
    await addResponse(ticketId, newResponse);
    setNewResponse('');
    setIsSubmitting(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const activeTicket = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-foreground mb-2">
            Support Tickets
          </h1>
          <p className="text-muted-foreground">
            Get help from our support team.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and our team will respond within 24 hours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTicket.priority}
                  onValueChange={(value: TicketPriority) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General question</SelectItem>
                    <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                    <SelectItem value="high">High - Critical issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateTicket}
                disabled={isSubmitting || !newTicket.subject.trim() || !newTicket.message.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-medium text-foreground">All Tickets</h2>
          </div>
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No tickets yet</p>
              </div>
            ) : (
              tickets.map((ticket) => (
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-foreground mb-2">
                      {activeTicket.subject}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(activeTicket.priority)}`}>
                        {activeTicket.priority}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(activeTicket.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(activeTicket.status)}
                    <span className="text-sm font-medium text-foreground capitalize">
                      {activeTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[400px] space-y-4">
                {/* Original message */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">You</p>
                  <p className="text-foreground whitespace-pre-wrap">{activeTicket.message}</p>
                </div>

                {/* Responses */}
                {activeTicket.ticket_responses?.map((response) => (
                  <div
                    key={response.id}
                    className={`rounded-lg p-4 ${
                      response.is_admin
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/50'
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">
                      {response.is_admin ? 'Support Team' : 'You'}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">{response.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(response.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reply */}
              {activeTicket.status !== 'resolved' && (
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
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
              )}
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

export default Tickets;
