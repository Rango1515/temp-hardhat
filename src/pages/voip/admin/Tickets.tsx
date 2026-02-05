 import { useState, useEffect, useCallback } from "react";
 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Ticket,
   Loader2,
   MessageSquare,
   Clock,
   CheckCircle,
   XCircle,
   AlertCircle,
   ArrowLeft,
   Send,
   Search,
   Filter,
   Trash2,
 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 
 interface SupportTicket {
   id: number;
   user_id: number;
   subject: string;
   category: string;
   status: "open" | "in_progress" | "resolved" | "closed";
   priority: "low" | "medium" | "high" | "urgent";
   created_at: string;
   updated_at: string;
   closed_at: string | null;
   assigned_to: number | null;
   has_new_reply: boolean;
   user?: { name: string; email: string };
   assigned_user?: { name: string; email: string } | null;
 }
 
 interface TicketMessage {
   id: number;
   ticket_id: number;
   user_id: number;
   content: string;
   attachment_url: string | null;
   is_admin_reply: boolean;
   created_at: string;
   user?: { name: string; email: string };
 }
 
 export default function AdminTickets() {
   const { apiCall } = useVoipApi();
   const { toast } = useToast();
 
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
   const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
   const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
   const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [newReply, setNewReply] = useState("");
   const [isSending, setIsSending] = useState(false);
 
   // Filters
   const [statusFilter, setStatusFilter] = useState<string>("all");
   const [categoryFilter, setCategoryFilter] = useState<string>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
 
   const fetchTickets = useCallback(async () => {
     setIsLoading(true);
     const result = await apiCall<{ tickets: SupportTicket[] }>("voip-support", {
       params: { action: "all-tickets" },
     });
 
     if (result.data) {
       setTickets(result.data.tickets);
       setFilteredTickets(result.data.tickets);
     }
     setIsLoading(false);
   }, [apiCall]);
 
   const fetchTicketMessages = useCallback(
     async (ticketId: number) => {
       const result = await apiCall<{ ticket: SupportTicket; messages: TicketMessage[] }>(
         "voip-support",
         { params: { action: "ticket-messages", ticketId: ticketId.toString() } }
       );
 
       if (result.data) {
         setSelectedTicket(result.data.ticket);
         setTicketMessages(result.data.messages);
       }
     },
     [apiCall]
   );
 
   useEffect(() => {
     fetchTickets();
   }, [fetchTickets]);
 
   // Apply filters
   useEffect(() => {
     let filtered = [...tickets];
 
     if (statusFilter !== "all") {
       filtered = filtered.filter((t) => t.status === statusFilter);
     }
     if (categoryFilter !== "all") {
       filtered = filtered.filter((t) => t.category === categoryFilter);
     }
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       filtered = filtered.filter(
         (t) =>
           t.subject.toLowerCase().includes(query) ||
           t.user?.name?.toLowerCase().includes(query) ||
           t.user?.email?.toLowerCase().includes(query)
       );
     }
 
     setFilteredTickets(filtered);
   }, [tickets, statusFilter, categoryFilter, searchQuery]);
 
   const handleReply = async () => {
     if (!selectedTicket || !newReply.trim()) return;
 
     setIsSending(true);
     const result = await apiCall("voip-support", {
       method: "POST",
       params: { action: "reply-ticket" },
       body: { ticketId: selectedTicket.id, content: newReply.trim() },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       setNewReply("");
       fetchTicketMessages(selectedTicket.id);
       fetchTickets();
     }
     setIsSending(false);
   };
 
   const handleUpdateStatus = async (status: string) => {
     if (!selectedTicket) return;
 
     const result = await apiCall("voip-support", {
       method: "POST",
       params: { action: "update-ticket" },
       body: { ticketId: selectedTicket.id, status },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       fetchTicketMessages(selectedTicket.id);
       fetchTickets();
     }
   };
 
   const handleDeleteTicket = async () => {
     if (!ticketToDelete) return;

     setIsDeleting(true);
     const result = await apiCall("voip-support", {
       method: "POST",
       params: { action: "delete-ticket" },
       body: { ticketId: ticketToDelete.id },
     });

     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Ticket Deleted", description: "The ticket has been removed." });
       if (selectedTicket?.id === ticketToDelete.id) {
         setSelectedTicket(null);
         setTicketMessages([]);
       }
       fetchTickets();
     }
     setIsDeleting(false);
     setTicketToDelete(null);
   };

   const getStatusIcon = (status: string) => {
     switch (status) {
       case "open":
         return <AlertCircle className="w-4 h-4 text-yellow-500" />;
       case "in_progress":
         return <Clock className="w-4 h-4 text-blue-500" />;
       case "resolved":
         return <CheckCircle className="w-4 h-4 text-green-500" />;
       case "closed":
         return <XCircle className="w-4 h-4 text-muted-foreground" />;
       default:
         return null;
     }
   };
 
   const getStatusColor = (status: string) => {
     switch (status) {
       case "open":
         return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
       case "in_progress":
         return "bg-blue-500/10 text-blue-500 border-blue-500/20";
       case "resolved":
         return "bg-green-500/10 text-green-500 border-green-500/20";
       case "closed":
         return "bg-muted text-muted-foreground";
       default:
         return "";
     }
   };
 
   const getPriorityColor = (priority: string) => {
     switch (priority) {
       case "urgent":
         return "bg-red-500/10 text-red-500 border-red-500/20";
       case "high":
         return "bg-orange-500/10 text-orange-500 border-orange-500/20";
       case "medium":
         return "bg-blue-500/10 text-blue-500 border-blue-500/20";
       case "low":
         return "bg-muted text-muted-foreground";
       default:
         return "";
     }
   };
 
   const getCategoryLabel = (category: string) => {
     switch (category) {
       case "billing":
         return "Billing";
       case "technical":
         return "Technical";
       case "sales":
         return "Sales";
       default:
         return "Other";
     }
   };
 
   const openTicketCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
 
   if (isLoading) {
     return (
       <VoipLayout>
         <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       </VoipLayout>
     );
   }
 
   // Ticket detail view
   if (selectedTicket) {
     return (
       <VoipLayout>
         <div className="max-w-4xl mx-auto space-y-4">
           <Button
             variant="ghost"
             onClick={() => {
               setSelectedTicket(null);
               setTicketMessages([]);
             }}
           >
             <ArrowLeft className="w-4 h-4 mr-2" />
             Back to Tickets
           </Button>
 
           <Card>
             <CardHeader>
               <div className="flex items-start justify-between gap-4">
                 <div>
                   <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                   <CardDescription>
                     Ticket #{selectedTicket.id} • Created{" "}
                     {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}
                   </CardDescription>
                 </div>
                 <div className="flex items-center gap-2 flex-wrap">
                   <Badge variant="outline">{getCategoryLabel(selectedTicket.category)}</Badge>
                   <Badge className={cn("border", getStatusColor(selectedTicket.status))}>
                     {getStatusIcon(selectedTicket.status)}
                     <span className="ml-1 capitalize">{selectedTicket.status.replace("_", " ")}</span>
                   </Badge>
                   <Badge className={cn("border", getPriorityColor(selectedTicket.priority))}>
                     {selectedTicket.priority}
                   </Badge>
                 </div>
               </div>
             </CardHeader>
 
             <CardContent className="border-t pt-4">
               <div className="flex items-center gap-4 flex-wrap">
                 <div className="flex items-center gap-2">
                   <Label>Status:</Label>
                   <Select value={selectedTicket.status} onValueChange={handleUpdateStatus}>
                     <SelectTrigger className="w-36">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="open">Open</SelectItem>
                       <SelectItem value="in_progress">In Progress</SelectItem>
                       <SelectItem value="resolved">Resolved</SelectItem>
                       <SelectItem value="closed">Closed</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 {selectedTicket.user && (
                   <div className="text-sm text-muted-foreground ml-auto">
                     From: <span className="font-medium">{selectedTicket.user.name}</span> (
                     {selectedTicket.user.email})
                   </div>
                 )}
                 <Button
                   variant="destructive"
                   size="sm"
                   onClick={() => setTicketToDelete(selectedTicket)}
                 >
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete
                 </Button>
               </div>
             </CardContent>
           </Card>
 
           <Card>
             <CardContent className="p-4 space-y-4">
               {ticketMessages.map((msg) => (
                 <div
                   key={msg.id}
                   className={cn(
                     "flex gap-3 p-3 rounded-lg",
                     msg.is_admin_reply ? "bg-primary/5 border-l-2 border-primary" : "bg-muted/50"
                   )}
                 >
                   <Avatar className="w-8 h-8">
                     <AvatarFallback>
                       {msg.user?.name?.slice(0, 2).toUpperCase() || "??"}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex-1">
                     <div className="flex items-center gap-2">
                       <span className="font-semibold text-sm">{msg.user?.name || "Unknown"}</span>
                       {msg.is_admin_reply && (
                         <Badge variant="secondary" className="text-[10px]">
                           Support
                         </Badge>
                       )}
                       <span className="text-xs text-muted-foreground">
                         {format(new Date(msg.created_at), "MMM d, h:mm a")}
                       </span>
                     </div>
                     <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content}</p>
                     {msg.attachment_url && (
                       <a
                         href={msg.attachment_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-sm text-primary underline mt-2 inline-block"
                       >
                         View Attachment
                       </a>
                     )}
                   </div>
                 </div>
               ))}
 
               {selectedTicket.status !== "closed" && (
                 <div className="pt-4 border-t">
                   <Label className="mb-2 block">Reply as Admin</Label>
                   <Textarea
                     placeholder="Type your reply..."
                     value={newReply}
                     onChange={(e) => setNewReply(e.target.value)}
                     rows={3}
                   />
                   <Button
                     className="mt-2"
                     onClick={handleReply}
                     disabled={isSending || !newReply.trim()}
                   >
                     {isSending ? (
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     ) : (
                       <Send className="w-4 h-4 mr-2" />
                     )}
                     Send Reply
                   </Button>
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
       </VoipLayout>
     );
   }
 
   return (
     <VoipLayout>
       <div className="space-y-6">
         <div className="flex items-center justify-between flex-wrap gap-4">
           <div>
             <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Support Tickets</h1>
             <p className="text-muted-foreground">
               {openTicketCount} open ticket{openTicketCount !== 1 ? "s" : ""}
             </p>
           </div>
         </div>
 
         {/* Filters */}
         <Card>
           <CardContent className="p-4">
             <div className="flex flex-wrap gap-4">
               <div className="flex-1 min-w-[200px]">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     placeholder="Search by subject, name, or email..."
                     className="pl-9"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="w-36">
                   <Filter className="w-4 h-4 mr-2" />
                   <SelectValue placeholder="Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="open">Open</SelectItem>
                   <SelectItem value="in_progress">In Progress</SelectItem>
                   <SelectItem value="resolved">Resolved</SelectItem>
                   <SelectItem value="closed">Closed</SelectItem>
                 </SelectContent>
               </Select>
               <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                 <SelectTrigger className="w-36">
                   <SelectValue placeholder="Category" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Categories</SelectItem>
                   <SelectItem value="billing">Billing</SelectItem>
                   <SelectItem value="technical">Technical</SelectItem>
                   <SelectItem value="sales">Sales</SelectItem>
                   <SelectItem value="other">Other</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </CardContent>
         </Card>
 
         {filteredTickets.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
               <p className="text-muted-foreground">No tickets found</p>
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-3">
             {filteredTickets.map((ticket) => (
               <Card
                 key={ticket.id}
                 className="cursor-pointer hover:bg-muted/50 transition-colors"
                 onClick={() => fetchTicketMessages(ticket.id)}
               >
                 <CardContent className="p-4">
                   <div className="flex items-center gap-4">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1 flex-wrap">
                         <span className="font-semibold truncate">{ticket.subject}</span>
                         <Badge variant="outline" className="shrink-0">
                           {getCategoryLabel(ticket.category)}
                         </Badge>
                         <Badge className={cn("border shrink-0", getStatusColor(ticket.status))}>
                           {getStatusIcon(ticket.status)}
                           <span className="ml-1 capitalize">
                             {ticket.status.replace("_", " ")}
                           </span>
                         </Badge>
                         <Badge className={cn("border shrink-0", getPriorityColor(ticket.priority))}>
                           {ticket.priority}
                         </Badge>
                       </div>
                       <div className="text-sm text-muted-foreground">
                         #{ticket.id} • {ticket.user?.name} ({ticket.user?.email}) •{" "}
                         {format(new Date(ticket.updated_at), "MMM d, h:mm a")}
                       </div>
                     </div>
                     <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
                     <Button
                       variant="ghost"
                       size="icon"
                       className="shrink-0 text-muted-foreground hover:text-destructive"
                       onClick={(e) => {
                         e.stopPropagation();
                         setTicketToDelete(ticket);
                       }}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </div>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
             <AlertDialogDescription>
               This will permanently delete ticket #{ticketToDelete?.id} "{ticketToDelete?.subject}" and all its messages. This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDeleteTicket}
               disabled={isDeleting}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </VoipLayout>
   );
 }