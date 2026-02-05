 import { useState, useEffect, useCallback } from "react";
 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { useVoipAuth } from "@/contexts/VoipAuthContext";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Ticket,
   Plus,
   Loader2,
   MessageSquare,
   Clock,
   CheckCircle,
   XCircle,
   AlertCircle,
   ArrowLeft,
   Send,
 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 interface SupportTicket {
   id: number;
   user_id: number;
   subject: string;
   status: "open" | "in_progress" | "resolved" | "closed";
   priority: "low" | "medium" | "high" | "urgent";
   created_at: string;
   updated_at: string;
   closed_at: string | null;
   assigned_to: number | null;
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
 
 export default function Support() {
   const { user, isAdmin } = useVoipAuth();
   const { apiCall } = useVoipApi();
   const { toast } = useToast();
 
   const [tickets, setTickets] = useState<SupportTicket[]>([]);
   const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
   const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [newReply, setNewReply] = useState("");
   const [isSending, setIsSending] = useState(false);
 
   const [ticketForm, setTicketForm] = useState({
     subject: "",
     content: "",
     priority: "medium" as "low" | "medium" | "high" | "urgent",
   });
 
   const fetchTickets = useCallback(async () => {
     setIsLoading(true);
     const action = isAdmin ? "all-tickets" : "my-tickets";
     const result = await apiCall<{ tickets: SupportTicket[] }>("voip-support", {
       params: { action },
     });
 
     if (result.data) {
       setTickets(result.data.tickets);
     }
     setIsLoading(false);
   }, [apiCall, isAdmin]);
 
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
 
   const handleCreateTicket = async () => {
     if (!ticketForm.subject.trim() || !ticketForm.content.trim()) {
       toast({
         title: "Required Fields",
         description: "Please fill in subject and message",
         variant: "destructive",
       });
       return;
     }
 
     setIsSending(true);
     const result = await apiCall<{ ticket: SupportTicket }>("voip-support", {
       method: "POST",
       params: { action: "create-ticket" },
       body: {
         subject: ticketForm.subject.trim(),
         content: ticketForm.content.trim(),
         priority: ticketForm.priority,
       },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Ticket Created", description: "We'll get back to you soon!" });
       setShowCreateDialog(false);
       setTicketForm({ subject: "", content: "", priority: "medium" });
       fetchTickets();
     }
     setIsSending(false);
   };
 
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
                 <div className="flex items-center gap-2">
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
 
             {isAdmin && (
               <CardContent className="border-t pt-4">
                 <div className="flex items-center gap-4">
                   <Label>Update Status:</Label>
                   <Select value={selectedTicket.status} onValueChange={handleUpdateStatus}>
                     <SelectTrigger className="w-40">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="open">Open</SelectItem>
                       <SelectItem value="in_progress">In Progress</SelectItem>
                       <SelectItem value="resolved">Resolved</SelectItem>
                       <SelectItem value="closed">Closed</SelectItem>
                     </SelectContent>
                   </Select>
                   {selectedTicket.user && (
                     <div className="text-sm text-muted-foreground ml-auto">
                       From: <span className="font-medium">{selectedTicket.user.name}</span> (
                       {selectedTicket.user.email})
                     </div>
                   )}
                 </div>
               </CardContent>
             )}
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
                   <Label className="mb-2 block">Reply</Label>
                   <div className="flex gap-2">
                     <Textarea
                       placeholder="Type your reply..."
                       value={newReply}
                       onChange={(e) => setNewReply(e.target.value)}
                       rows={3}
                       className="flex-1"
                     />
                   </div>
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
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
               {isAdmin ? "Support Tickets" : "My Support Tickets"}
             </h1>
             <p className="text-muted-foreground">
               {isAdmin
                 ? "Manage all support tickets"
                 : "Create and track your support requests"}
             </p>
           </div>
           {!isAdmin && (
             <Button onClick={() => setShowCreateDialog(true)}>
               <Plus className="w-4 h-4 mr-2" />
               New Ticket
             </Button>
           )}
         </div>
 
         {tickets.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
               <p className="text-muted-foreground">No tickets yet</p>
               {!isAdmin && (
                 <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                   Create Your First Ticket
                 </Button>
               )}
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-3">
             {tickets.map((ticket) => (
               <Card
                 key={ticket.id}
                 className="cursor-pointer hover:bg-muted/50 transition-colors"
                 onClick={() => fetchTicketMessages(ticket.id)}
               >
                 <CardContent className="p-4">
                   <div className="flex items-center gap-4">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-semibold truncate">{ticket.subject}</span>
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
                         #{ticket.id} •{" "}
                         {isAdmin && ticket.user && <>{ticket.user.name} • </>}
                         {format(new Date(ticket.updated_at), "MMM d, h:mm a")}
                       </div>
                     </div>
                     <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
       </div>
 
       {/* Create Ticket Dialog */}
       <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
         <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle>Create Support Ticket</DialogTitle>
             <DialogDescription>
               Describe your issue and we'll get back to you as soon as possible.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Subject *</Label>
               <Input
                 placeholder="Brief description of your issue"
                 value={ticketForm.subject}
                 onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label>Priority</Label>
               <Select
                 value={ticketForm.priority}
                 onValueChange={(v) =>
                   setTicketForm({ ...ticketForm, priority: v as typeof ticketForm.priority })
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="low">Low</SelectItem>
                   <SelectItem value="medium">Medium</SelectItem>
                   <SelectItem value="high">High</SelectItem>
                   <SelectItem value="urgent">Urgent</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Message *</Label>
               <Textarea
                 placeholder="Describe your issue in detail..."
                 value={ticketForm.content}
                 onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                 rows={5}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
               Cancel
             </Button>
             <Button
               onClick={handleCreateTicket}
               disabled={isSending || !ticketForm.subject.trim() || !ticketForm.content.trim()}
             >
               {isSending ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Creating...
                 </>
               ) : (
                 "Submit Ticket"
               )}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </VoipLayout>
   );
 }