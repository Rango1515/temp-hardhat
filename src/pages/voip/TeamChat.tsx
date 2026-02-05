 import { useState, useEffect, useRef, useCallback } from "react";
 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { useVoipAuth } from "@/contexts/VoipAuthContext";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Switch } from "@/components/ui/switch";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import {
   Hash,
   Send,
   Loader2,
   MoreVertical,
   Pencil,
   Trash2,
   Pin,
   Lock,
   Plus,
   Settings,
   AlertCircle,
   UserCircle,
   ArrowDown,
   Megaphone,
 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 interface Channel {
   id: number;
   name: string;
   description: string | null;
   is_locked: boolean;
   admin_only: boolean;
   unread_count?: number;
 }
 
 interface ChatMessage {
   id: number;
   channel_id: number;
   user_id: number;
   content: string;
   image_url: string | null;
   is_pinned: boolean;
   edited_at: string | null;
   created_at: string;
   user_name: string;
   user_avatar: string | null;
 }
 
 interface ChatProfile {
   id: number;
   user_id: number;
   display_name: string;
   avatar_url: string | null;
   bio: string | null;
   is_muted: boolean;
   is_banned: boolean;
 }
 
 export default function TeamChat() {
   const { user, isAdmin } = useVoipAuth();
   const { apiCall } = useVoipApi();
   const { toast } = useToast();
 
   const [channels, setChannels] = useState<Channel[]>([]);
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [chatProfile, setChatProfile] = useState<ChatProfile | null>(null);
   const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
   const [newMessage, setNewMessage] = useState("");
   const [isLoading, setIsLoading] = useState(true);
   const [isSending, setIsSending] = useState(false);
   const [showProfileSetup, setShowProfileSetup] = useState(false);
   const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
   const [editContent, setEditContent] = useState("");
 
   // Channel management dialogs
   const [showChannelDialog, setShowChannelDialog] = useState(false);
   const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
   const [channelForm, setChannelForm] = useState({
     name: "",
     description: "",
     adminOnly: false,
     isLocked: false,
   });
 
   // Profile form
   const [profileForm, setProfileForm] = useState({
     displayName: "",
     bio: "",
     avatarUrl: "",
   });
   const [isSavingProfile, setIsSavingProfile] = useState(false);
 
   // Auto-scroll state
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const scrollContainerRef = useRef<HTMLDivElement>(null);
   const [isAtBottom, setIsAtBottom] = useState(true);
   const [hasNewMessages, setHasNewMessages] = useState(false);
   const [previousMessageCount, setPreviousMessageCount] = useState(0);
 
   // Check if user is at bottom of scroll
   const checkIfAtBottom = useCallback(() => {
     const container = scrollContainerRef.current;
     if (!container) return true;
     const threshold = 100;
     return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
   }, []);
 
   // Scroll to bottom
   const scrollToBottom = useCallback((smooth = true) => {
     messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
     setHasNewMessages(false);
     setIsAtBottom(true);
   }, []);
 
   // Handle scroll events
   const handleScroll = useCallback(() => {
     const atBottom = checkIfAtBottom();
     setIsAtBottom(atBottom);
     if (atBottom) setHasNewMessages(false);
   }, [checkIfAtBottom]);
 
   // Fetch initial data
   const fetchData = useCallback(async () => {
     setIsLoading(true);
 
     const result = await apiCall<{
       channels: Channel[];
       profile: ChatProfile | null;
     }>("voip-chat", { params: { action: "init" } });
 
     if (result.data) {
       setChannels(result.data.channels);
       setChatProfile(result.data.profile);
 
       if (!result.data.profile) {
         setShowProfileSetup(true);
       } else if (result.data.channels.length > 0) {
         // Select first channel with messages or just first channel
         setSelectedChannel(result.data.channels[0]);
       }
     }
 
     setIsLoading(false);
   }, [apiCall]);
 
   // Mark channel as read
   const markChannelRead = useCallback(
     async (channelId: number) => {
       await apiCall("voip-chat", {
         method: "POST",
         params: { action: "mark-read" },
         body: { channelId },
       });
       // Update local unread count
       setChannels((prev) =>
         prev.map((ch) => (ch.id === channelId ? { ...ch, unread_count: 0 } : ch))
       );
     },
     [apiCall]
   );
 
   // Fetch messages for selected channel
   const fetchMessages = useCallback(async () => {
     if (!selectedChannel) return;
 
     const result = await apiCall<{ messages: ChatMessage[] }>("voip-chat", {
       params: { action: "messages", channelId: selectedChannel.id.toString() },
     });
 
     if (result.data) {
       const newMessages = result.data.messages;
 
       // Check if we got new messages
       if (newMessages.length > previousMessageCount && previousMessageCount > 0) {
         if (isAtBottom) {
           // Auto-scroll to new message
           setTimeout(() => scrollToBottom(), 50);
         } else {
           // Show "new messages" pill
           setHasNewMessages(true);
         }
       }
 
       setMessages(newMessages);
       setPreviousMessageCount(newMessages.length);
 
       // If this is the initial load, scroll to bottom
       if (previousMessageCount === 0 && newMessages.length > 0) {
         setTimeout(() => scrollToBottom(false), 50);
       }
     }
   }, [apiCall, selectedChannel, isAtBottom, previousMessageCount, scrollToBottom]);
 
   useEffect(() => {
     fetchData();
   }, [fetchData]);
 
   // When channel changes, reset messages and scroll state
   useEffect(() => {
     if (selectedChannel) {
       setMessages([]);
       setPreviousMessageCount(0);
       setHasNewMessages(false);
       setIsAtBottom(true);
       fetchMessages();
       markChannelRead(selectedChannel.id);
     }
   }, [selectedChannel]); // eslint-disable-line react-hooks/exhaustive-deps
 
   // Real-time subscription
   useEffect(() => {
     if (!selectedChannel) return;
 
     const channel = supabase
       .channel(`chat-${selectedChannel.id}`)
       .on(
         "postgres_changes",
         {
           event: "*",
           schema: "public",
           table: "voip_chat_messages",
           filter: `channel_id=eq.${selectedChannel.id}`,
         },
         () => {
           fetchMessages();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [selectedChannel, fetchMessages]);
 
   // Attach scroll listener
   useEffect(() => {
     const container = scrollContainerRef.current;
     if (!container) return;
     container.addEventListener("scroll", handleScroll);
     return () => container.removeEventListener("scroll", handleScroll);
   }, [handleScroll]);
 
   const handleSaveProfile = async () => {
     if (!profileForm.displayName.trim()) {
       toast({
         title: "Display Name Required",
         description: "Please enter a display name",
         variant: "destructive",
       });
       return;
     }
 
     setIsSavingProfile(true);
 
     const result = await apiCall<{ profile: ChatProfile }>("voip-chat", {
       method: "POST",
       params: { action: "save-profile" },
       body: {
         displayName: profileForm.displayName.trim(),
         bio: profileForm.bio.trim() || null,
         avatarUrl: profileForm.avatarUrl.trim() || null,
       },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else if (result.data) {
       setChatProfile(result.data.profile);
       setShowProfileSetup(false);
       toast({ title: "Profile Saved", description: "You can now chat with the team!" });
       if (channels.length > 0) setSelectedChannel(channels[0]);
     }
 
     setIsSavingProfile(false);
   };
 
   const handleSendMessage = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newMessage.trim() || !selectedChannel || !chatProfile) return;
 
     if (chatProfile.is_muted || chatProfile.is_banned) {
       toast({
         title: "Cannot Send Message",
         description: chatProfile.is_banned ? "You are banned from chat" : "You are muted",
         variant: "destructive",
       });
       return;
     }
 
     if (selectedChannel.admin_only && !isAdmin) {
       toast({
         title: "Admin Only",
         description: "Only admins can post in this channel",
         variant: "destructive",
       });
       return;
     }
 
     setIsSending(true);
 
     const result = await apiCall("voip-chat", {
       method: "POST",
       params: { action: "send-message" },
       body: { channelId: selectedChannel.id, content: newMessage.trim() },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       setNewMessage("");
       // Force scroll to bottom after sending
       setTimeout(() => scrollToBottom(), 100);
     }
 
     setIsSending(false);
   };
 
   const handleEditMessage = async () => {
     if (!editingMessage || !editContent.trim()) return;
 
     const result = await apiCall("voip-chat", {
       method: "POST",
       params: { action: "edit-message" },
       body: { messageId: editingMessage.id, content: editContent.trim() },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       setEditingMessage(null);
       setEditContent("");
       fetchMessages();
     }
   };
 
   const handleDeleteMessage = async (messageId: number) => {
     const result = await apiCall("voip-chat", {
       method: "DELETE",
       params: { action: "delete-message", messageId: messageId.toString() },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       fetchMessages();
     }
   };
 
   const handlePinMessage = async (messageId: number, pin: boolean) => {
     const result = await apiCall("voip-chat", {
       method: "POST",
       params: { action: "pin-message" },
       body: { messageId, pin },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       fetchMessages();
     }
   };
 
   // Channel management
   const handleCreateChannel = async () => {
     if (!channelForm.name.trim()) return;
 
     const result = await apiCall<{ channel: Channel }>("voip-chat", {
       method: "POST",
       params: { action: "create-channel" },
       body: {
         name: channelForm.name,
         description: channelForm.description,
         adminOnly: channelForm.adminOnly,
         isLocked: channelForm.isLocked,
       },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Channel Created" });
       setShowChannelDialog(false);
       setChannelForm({ name: "", description: "", adminOnly: false, isLocked: false });
       fetchData();
     }
   };
 
   const handleUpdateChannel = async () => {
     if (!editingChannel || !channelForm.name.trim()) return;
 
     const result = await apiCall("voip-chat", {
       method: "POST",
       params: { action: "update-channel" },
       body: {
         channelId: editingChannel.id,
         name: channelForm.name,
         description: channelForm.description,
         adminOnly: channelForm.adminOnly,
         isLocked: channelForm.isLocked,
       },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Channel Updated" });
       setEditingChannel(null);
       setChannelForm({ name: "", description: "", adminOnly: false, isLocked: false });
       fetchData();
     }
   };
 
   const handleDeleteChannel = async (channelId: number) => {
     if (!confirm("Are you sure you want to delete this channel?")) return;
 
     const result = await apiCall("voip-chat", {
       method: "POST",
       params: { action: "delete-channel" },
       body: { channelId },
     });
 
     if (result.error) {
       toast({ title: "Error", description: result.error, variant: "destructive" });
     } else {
       toast({ title: "Channel Deleted" });
       if (selectedChannel?.id === channelId) {
         setSelectedChannel(channels.find((c) => c.id !== channelId) || null);
       }
       fetchData();
     }
   };
 
   const openEditChannel = (channel: Channel) => {
     setEditingChannel(channel);
     setChannelForm({
       name: channel.name,
       description: channel.description || "",
       adminOnly: channel.admin_only,
       isLocked: channel.is_locked,
     });
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
 
   // Profile Setup Modal
   if (showProfileSetup) {
     return (
       <VoipLayout>
         <div className="max-w-md mx-auto mt-12">
           <Card>
             <CardHeader className="text-center">
               <UserCircle className="w-16 h-16 mx-auto text-primary mb-4" />
               <CardTitle>Set Up Your Chat Profile</CardTitle>
               <CardDescription>
                 Before you can chat, please set up your profile
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="displayName">Display Name *</Label>
                 <Input
                   id="displayName"
                   placeholder="Your name in chat"
                   value={profileForm.displayName}
                   onChange={(e) =>
                     setProfileForm({ ...profileForm, displayName: e.target.value })
                   }
                 />
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                 <Input
                   id="avatarUrl"
                   placeholder="https://example.com/avatar.png"
                   value={profileForm.avatarUrl}
                   onChange={(e) =>
                     setProfileForm({ ...profileForm, avatarUrl: e.target.value })
                   }
                 />
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="bio">Bio (Optional)</Label>
                 <Textarea
                   id="bio"
                   placeholder="Tell us about yourself..."
                   value={profileForm.bio}
                   onChange={(e) =>
                     setProfileForm({ ...profileForm, bio: e.target.value })
                   }
                   rows={3}
                 />
               </div>
 
               <Button
                 className="w-full"
                 onClick={handleSaveProfile}
                 disabled={isSavingProfile || !profileForm.displayName.trim()}
               >
                 {isSavingProfile ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Saving...
                   </>
                 ) : (
                   "Continue to Chat"
                 )}
               </Button>
             </CardContent>
           </Card>
         </div>
       </VoipLayout>
     );
   }
 
   const isBannedOrMuted = chatProfile?.is_banned || chatProfile?.is_muted;
   const totalUnread = channels.reduce((sum, ch) => sum + (ch.unread_count || 0), 0);
 
   return (
     <VoipLayout>
       <div className="flex h-[calc(100vh-8rem)] gap-4">
         {/* Channel Sidebar */}
         <div className="w-64 shrink-0 hidden md:block">
           <Card className="h-full flex flex-col">
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center justify-between">
                 Channels
                 {isAdmin && (
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8"
                     onClick={() => {
                       setChannelForm({ name: "", description: "", adminOnly: false, isLocked: false });
                       setShowChannelDialog(true);
                     }}
                   >
                     <Plus className="w-4 h-4" />
                   </Button>
                 )}
               </CardTitle>
             </CardHeader>
             <CardContent className="flex-1 p-2 overflow-y-auto">
               <div className="space-y-1">
                 {channels.map((channel) => (
                   <button
                     key={channel.id}
                     onClick={() => setSelectedChannel(channel)}
                     className={cn(
                       "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors relative",
                       selectedChannel?.id === channel.id
                         ? "bg-primary text-primary-foreground"
                         : "hover:bg-muted"
                     )}
                   >
                     {channel.name === "announcements" ? (
                       <Megaphone className="w-4 h-4 shrink-0" />
                     ) : (
                       <Hash className="w-4 h-4 shrink-0" />
                     )}
                     <span className="truncate flex-1">{channel.name}</span>
                     {channel.is_locked && <Lock className="w-3 h-3 shrink-0" />}
                     {channel.admin_only && (
                       <Badge variant="secondary" className="text-[10px] shrink-0">
                         Admin
                       </Badge>
                     )}
                     {/* Unread badge */}
                     {(channel.unread_count || 0) > 0 && selectedChannel?.id !== channel.id && (
                       <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-destructive" />
                     )}
                   </button>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Chat Area */}
         <Card className="flex-1 flex flex-col overflow-hidden">
           {/* Channel Header */}
           <div className="border-b p-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
               {selectedChannel?.name === "announcements" ? (
                 <Megaphone className="w-5 h-5 text-muted-foreground" />
               ) : (
                 <Hash className="w-5 h-5 text-muted-foreground" />
               )}
               <span className="font-semibold">{selectedChannel?.name || "Select a channel"}</span>
               {selectedChannel?.description && (
                 <span className="text-sm text-muted-foreground hidden sm:inline">
                   — {selectedChannel.description}
                 </span>
               )}
             </div>
             {isAdmin && selectedChannel && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon">
                     <Settings className="w-4 h-4" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuItem onClick={() => openEditChannel(selectedChannel)}>
                     <Pencil className="w-4 h-4 mr-2" />
                     Edit Channel
                   </DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem
                     className="text-destructive"
                     onClick={() => handleDeleteChannel(selectedChannel.id)}
                   >
                     <Trash2 className="w-4 h-4 mr-2" />
                     Delete Channel
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}
           </div>
 
           {/* Messages */}
           <div
             ref={scrollContainerRef}
             className="flex-1 overflow-y-auto p-4 relative"
           >
             {isBannedOrMuted && (
               <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-destructive" />
                 <span className="text-sm text-destructive">
                   {chatProfile?.is_banned
                     ? "You have been banned from chat"
                     : "You have been muted by an admin"}
                 </span>
               </div>
             )}
 
             {messages.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                 <p>No messages yet</p>
                 <p className="text-sm">Be the first to say something!</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {messages.map((msg) => (
                   <div
                     key={msg.id}
                     className={cn(
                       "flex gap-3 group",
                       msg.is_pinned &&
                         "bg-primary/5 -mx-2 px-2 py-2 rounded-lg border-l-2 border-primary"
                     )}
                   >
                     <Avatar className="w-10 h-10 shrink-0">
                       <AvatarImage src={msg.user_avatar || undefined} />
                       <AvatarFallback>
                         {msg.user_name?.slice(0, 2).toUpperCase() || "??"}
                       </AvatarFallback>
                     </Avatar>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="font-semibold text-sm">{msg.user_name}</span>
                         <span className="text-xs text-muted-foreground">
                           {format(new Date(msg.created_at), "MMM d, h:mm a")}
                         </span>
                         {msg.edited_at && (
                           <span className="text-xs text-muted-foreground">(edited)</span>
                         )}
                         {msg.is_pinned && (
                           <Badge variant="secondary" className="text-[10px]">
                             <Pin className="w-3 h-3 mr-1" />
                             Pinned
                           </Badge>
                         )}
                       </div>
                       <p className="text-sm mt-0.5 break-words whitespace-pre-wrap">{msg.content}</p>
                       {msg.image_url && (
                         <img
                           src={msg.image_url}
                           alt="Attached"
                           className="mt-2 max-w-sm rounded-lg"
                         />
                       )}
                     </div>
 
                     {/* Message Actions */}
                     {(msg.user_id === user?.id || isAdmin) && (
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="ghost"
                             size="icon"
                             className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <MoreVertical className="w-4 h-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           {msg.user_id === user?.id && (
                             <DropdownMenuItem
                               onClick={() => {
                                 setEditingMessage(msg);
                                 setEditContent(msg.content);
                               }}
                             >
                               <Pencil className="w-4 h-4 mr-2" />
                               Edit
                             </DropdownMenuItem>
                           )}
                           {isAdmin && (
                             <DropdownMenuItem
                               onClick={() => handlePinMessage(msg.id, !msg.is_pinned)}
                             >
                               <Pin className="w-4 h-4 mr-2" />
                               {msg.is_pinned ? "Unpin" : "Pin"}
                             </DropdownMenuItem>
                           )}
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                             className="text-destructive"
                             onClick={() => handleDeleteMessage(msg.id)}
                           >
                             <Trash2 className="w-4 h-4 mr-2" />
                             Delete
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     )}
                   </div>
                 ))}
                 <div ref={messagesEndRef} />
               </div>
             )}
 
             {/* New Messages Pill */}
             {hasNewMessages && !isAtBottom && (
               <button
                 onClick={() => scrollToBottom()}
                 className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
               >
                 <ArrowDown className="w-4 h-4" />
                 New messages
               </button>
             )}
           </div>
 
           {/* Message Input */}
           <form onSubmit={handleSendMessage} className="border-t p-4">
             <div className="flex gap-2">
               <Input
                 placeholder={
                   isBannedOrMuted
                     ? "You cannot send messages"
                     : selectedChannel?.admin_only && !isAdmin
                     ? "Only admins can post here"
                     : `Message #${selectedChannel?.name || "channel"}...`
                 }
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 disabled={
                   isSending || isBannedOrMuted || (selectedChannel?.admin_only && !isAdmin)
                 }
                 className="flex-1"
               />
               <Button
                 type="submit"
                 disabled={
                   isSending ||
                   !newMessage.trim() ||
                   isBannedOrMuted ||
                   (selectedChannel?.admin_only && !isAdmin)
                 }
               >
                 {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
               </Button>
             </div>
           </form>
         </Card>
       </div>
 
       {/* Edit Message Dialog */}
       <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Message</DialogTitle>
           </DialogHeader>
           <Textarea
             value={editContent}
             onChange={(e) => setEditContent(e.target.value)}
             rows={4}
           />
           <DialogFooter>
             <Button variant="outline" onClick={() => setEditingMessage(null)}>
               Cancel
             </Button>
             <Button onClick={handleEditMessage} disabled={!editContent.trim()}>
               Save Changes
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Create Channel Dialog */}
       <Dialog open={showChannelDialog} onOpenChange={setShowChannelDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Create Channel</DialogTitle>
             <DialogDescription>Create a new chat channel for your team.</DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Channel Name</Label>
               <Input
                 placeholder="e.g. sales-team"
                 value={channelForm.name}
                 onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label>Description (Optional)</Label>
               <Input
                 placeholder="What's this channel about?"
                 value={channelForm.description}
                 onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
               />
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <Label>Admin Only</Label>
                 <p className="text-xs text-muted-foreground">Only admins can post</p>
               </div>
               <Switch
                 checked={channelForm.adminOnly}
                 onCheckedChange={(v) => setChannelForm({ ...channelForm, adminOnly: v })}
               />
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <Label>Locked</Label>
                 <p className="text-xs text-muted-foreground">No one can post</p>
               </div>
               <Switch
                 checked={channelForm.isLocked}
                 onCheckedChange={(v) => setChannelForm({ ...channelForm, isLocked: v })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowChannelDialog(false)}>
               Cancel
             </Button>
             <Button onClick={handleCreateChannel} disabled={!channelForm.name.trim()}>
               Create Channel
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Edit Channel Dialog */}
       <Dialog open={!!editingChannel} onOpenChange={() => setEditingChannel(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Channel</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Channel Name</Label>
               <Input
                 value={channelForm.name}
                 onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
               />
             </div>
             <div className="space-y-2">
               <Label>Description</Label>
               <Input
                 value={channelForm.description}
                 onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
               />
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <Label>Admin Only</Label>
                 <p className="text-xs text-muted-foreground">Only admins can post</p>
               </div>
               <Switch
                 checked={channelForm.adminOnly}
                 onCheckedChange={(v) => setChannelForm({ ...channelForm, adminOnly: v })}
               />
             </div>
             <div className="flex items-center justify-between">
               <div>
                 <Label>Locked</Label>
                 <p className="text-xs text-muted-foreground">No one can post</p>
               </div>
               <Switch
                 checked={channelForm.isLocked}
                 onCheckedChange={(v) => setChannelForm({ ...channelForm, isLocked: v })}
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setEditingChannel(null)}>
               Cancel
             </Button>
             <Button onClick={handleUpdateChannel} disabled={!channelForm.name.trim()}>
               Save Changes
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </VoipLayout>
   );
 }