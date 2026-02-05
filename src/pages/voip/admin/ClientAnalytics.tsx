 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Users, Clock, Activity } from "lucide-react";
 import { useEffect, useState } from "react";
 import { useVoipApi } from "@/hooks/useVoipApi";
 
 interface OnlineUser {
   userId: number;
   name: string;
   isIdle: boolean;
   lastHeartbeat: string;
   sessionTime: number;
 }
 
 interface UserSession {
   id: number;
   user_id: number;
   session_start: string;
   session_end: string | null;
   total_active_seconds: number;
   is_idle: boolean;
 }
 
 interface SessionSummary {
   today: number;
   week: number;
   month: number;
 }
 
 function formatDuration(seconds: number): string {
   const hours = Math.floor(seconds / 3600);
   const mins = Math.floor((seconds % 3600) / 60);
   if (hours > 0) return `${hours}h ${mins}m`;
   return `${mins}m`;
 }
 
 export default function ClientAnalytics() {
   const { apiCall } = useVoipApi();
   const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
   const [selectedUser, setSelectedUser] = useState<number | null>(null);
   const [userSessions, setUserSessions] = useState<UserSession[]>([]);
   const [summary, setSummary] = useState<SessionSummary | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchOnlineUsers = async () => {
       const result = await apiCall<{ onlineUsers: OnlineUser[] }>("voip-analytics", {
         params: { action: "online-users" },
       });
       if (result.data) setOnlineUsers(result.data.onlineUsers);
       setLoading(false);
     };
 
     fetchOnlineUsers();
     const interval = setInterval(fetchOnlineUsers, 15000);
     return () => clearInterval(interval);
   }, [apiCall]);
 
   const fetchUserSessions = async (userId: number) => {
     setSelectedUser(userId);
     const result = await apiCall<{ sessions: UserSession[]; summary: SessionSummary }>("voip-analytics", {
       params: { action: "user-sessions", userId: userId.toString() },
     });
     if (result.data) {
       setUserSessions(result.data.sessions);
       setSummary(result.data.summary);
     }
   };
 
   return (
     <VoipLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Client Analytics</h1>
           <p className="text-muted-foreground">Monitor user sessions and activity</p>
         </div>
 
         {/* Online Users */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Activity className="w-5 h-5 text-green-500" />
               Online Now
               <Badge variant="secondary" className="ml-2">{onlineUsers.length}</Badge>
             </CardTitle>
             <CardDescription>Users with activity in the last 30 seconds</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center h-24">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
               </div>
             ) : onlineUsers.length > 0 ? (
               <div className="flex flex-wrap gap-3">
                 {onlineUsers.map((user) => (
                   <button
                     key={user.userId}
                     onClick={() => fetchUserSessions(user.userId)}
                     className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                       selectedUser === user.userId
                         ? "border-primary bg-primary/10"
                         : "border-border hover:border-primary/50"
                     }`}
                   >
                     <div className={`w-2 h-2 rounded-full ${user.isIdle ? "bg-yellow-500" : "bg-green-500"}`} />
                     <span className="font-medium">{user.name}</span>
                     <span className="text-xs text-muted-foreground">
                       {formatDuration(user.sessionTime)}
                     </span>
                   </button>
                 ))}
               </div>
             ) : (
               <p className="text-muted-foreground text-center py-4">No users online</p>
             )}
           </CardContent>
         </Card>
 
         {/* User Session Details */}
         {selectedUser && (
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Clock className="w-5 h-5" />
                 Session History
               </CardTitle>
               <CardDescription>
                 Time on site: Today: {formatDuration(summary?.today || 0)} | 
                 7 Days: {formatDuration(summary?.week || 0)} | 
                 30 Days: {formatDuration(summary?.month || 0)}
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Started</TableHead>
                     <TableHead>Ended</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {userSessions.map((session) => (
                     <TableRow key={session.id}>
                       <TableCell>
                         {new Date(session.session_start).toLocaleString()}
                       </TableCell>
                       <TableCell>
                         {session.session_end
                           ? new Date(session.session_end).toLocaleString()
                           : "—"}
                       </TableCell>
                       <TableCell>{formatDuration(session.total_active_seconds)}</TableCell>
                       <TableCell>
                         {!session.session_end ? (
                           <Badge variant={session.is_idle ? "secondary" : "default"}>
                             {session.is_idle ? "Idle" : "Active"}
                           </Badge>
                         ) : (
                           <Badge variant="outline">Ended</Badge>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                   {userSessions.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">
                         No sessions recorded
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
         )}
       </div>
     </VoipLayout>
   );
 }