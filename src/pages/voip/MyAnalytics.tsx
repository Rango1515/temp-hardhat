 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { StatCard } from "@/components/voip/dashboard/StatCard";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 import { BarChart3, Phone, Target, TrendingUp, Clock, CalendarCheck, History, ChevronDown, ExternalLink } from "lucide-react";
 import { useEffect, useState } from "react";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 interface MyStats {
   totalCalls: number;
   outcomes: Record<string, number>;
   leadsRequested: number;
   leadsCompleted: number;
   completionRate: number;
   conversionRate: number;
   avgTimePerLead: number;
   totalActiveTime: number;
   appointmentsCreated: number;
   dailyActivity: { date: string; count: number }[];
 }
 
 interface CallSession {
   id: number;
   start_time: string;
   duration_seconds: number;
   outcome: string | null;
   notes: string | null;
   lead_name: string | null;
   lead_phone: string;
   appointment_created: boolean;
   appointment_id?: number;
 }
 
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}
 
 function formatOutcome(outcome: string | null): string {
   if (!outcome) return "—";
   return outcome.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
 }
 
 export default function MyAnalytics() {
   const { apiCall } = useVoipApi();
   const [stats, setStats] = useState<MyStats | null>(null);
   const [sessions, setSessions] = useState<CallSession[]>([]);
   const [loading, setLoading] = useState(true);
   const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
 
   useEffect(() => {
     const fetchData = async () => {
       const [statsResult, sessionsResult] = await Promise.all([
         apiCall<MyStats>("voip-analytics", { params: { action: "my-stats" } }),
         apiCall<{ sessions: CallSession[] }>("voip-analytics", { params: { action: "my-sessions" } }),
       ]);
       if (statsResult.data) setStats(statsResult.data);
       if (sessionsResult.data?.sessions) setSessions(sessionsResult.data.sessions);
       setLoading(false);
     };
     fetchData();
   }, [apiCall]);
 
   const outcomeLabels: Record<string, string> = {
     interested: "Interested",
     not_interested: "Not Interested",
     no_answer: "No Answer",
     voicemail: "Voicemail",
     wrong_number: "Wrong Number",
     dnc: "Do Not Call",
     followup: "Follow-up",
   };
 
   const getOutcomeBadge = (outcome: string | null) => {
     if (!outcome) return <Badge variant="outline">—</Badge>;
     switch (outcome) {
       case "interested":
         return <Badge className="bg-green-600">Interested</Badge>;
       case "not_interested":
         return <Badge variant="secondary">Not Interested</Badge>;
       case "followup":
         return <Badge className="bg-orange-500">Follow-up</Badge>;
       case "no_answer":
         return <Badge variant="outline">No Answer</Badge>;
       case "voicemail":
         return <Badge variant="outline">Voicemail</Badge>;
       case "wrong_number":
         return <Badge variant="destructive">Wrong Number</Badge>;
       case "dnc":
         return <Badge variant="destructive">DNC</Badge>;
       default:
         return <Badge variant="outline">{formatOutcome(outcome)}</Badge>;
     }
   };
 
   const toggleNotes = (id: number) => {
     setExpandedNotes((prev) => {
       const next = new Set(prev);
       if (next.has(id)) {
         next.delete(id);
       } else {
         next.add(id);
       }
       return next;
     });
   };
 
   return (
     <VoipLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Analytics</h1>
           <p className="text-muted-foreground">Your personal performance metrics</p>
         </div>
 
         {loading ? (
           <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
           </div>
         ) : (
           <>
             {/* Overview Stats */}
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
               <StatCard
                 title="Leads Requested"
                 value={stats?.leadsRequested || 0}
                 subtitle="All time"
                 icon={Phone}
               />
               <StatCard
                 title="Leads Completed"
                 value={stats?.leadsCompleted || 0}
                 subtitle="All time"
                 icon={Target}
                 variant="success"
               />
               <StatCard
                 title="Completion Rate"
                 value={`${stats?.completionRate || 0}%`}
                 subtitle="Completed / Requested"
                 icon={TrendingUp}
               />
               <StatCard
                 title="Appointments"
                 value={stats?.appointmentsCreated || 0}
                 subtitle="Created"
                 icon={CalendarCheck}
                 variant="success"
               />
               <StatCard
                 title="Conversion Rate"
                 value={`${stats?.conversionRate || 0}%`}
                 subtitle="Interested → Appt"
                 icon={TrendingUp}
                 variant="success"
               />
               <StatCard
                 title="Avg Time/Lead"
                 value={formatDuration(stats?.avgTimePerLead || 0)}
                 subtitle="Session duration"
                 icon={Clock}
               />
             </div>
 
             <div className="grid gap-6 lg:grid-cols-2">
               {/* Daily Activity */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <BarChart3 className="w-5 h-5" />
                     Daily Activity
                   </CardTitle>
                   <CardDescription>Calls made per day (last 7 days)</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {stats?.dailyActivity && stats.dailyActivity.length > 0 ? (
                     <div className="space-y-3">
                       {stats.dailyActivity.map(({ date, count }) => (
                         <div key={date} className="flex items-center gap-4">
                           <span className="text-sm text-muted-foreground w-24">
                             {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                           </span>
                           <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                             <div
                               className="h-full bg-primary rounded-full transition-all"
                               style={{ width: `${Math.min(100, (count / Math.max(...stats.dailyActivity.map(d => d.count))) * 100)}%` }}
                             />
                           </div>
                           <span className="text-sm font-medium w-8">{count}</span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="h-48 flex items-center justify-center text-muted-foreground">
                       <div className="text-center">
                         <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                         <p>No activity yet</p>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
 
               {/* Outcomes Breakdown */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <TrendingUp className="w-5 h-5" />
                     Outcomes Breakdown
                   </CardTitle>
                   <CardDescription>Distribution of call results</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {stats?.outcomes && Object.keys(stats.outcomes).length > 0 ? (
                     <div className="space-y-3">
                       {Object.entries(stats.outcomes)
                         .sort((a, b) => b[1] - a[1])
                         .map(([outcome, count]) => (
                           <div key={outcome} className="flex items-center justify-between">
                             <span className="text-sm">{outcomeLabels[outcome] || outcome}</span>
                             <div className="flex items-center gap-2">
                               <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                 <div
                                   className="h-full bg-primary rounded-full"
                                   style={{ width: `${(count / stats.totalCalls) * 100}%` }}
                                 />
                               </div>
                               <span className="text-sm font-medium w-12 text-right">{count}</span>
                             </div>
                           </div>
                         ))}
                     </div>
                   ) : (
                     <div className="h-48 flex items-center justify-center text-muted-foreground">
                       <div className="text-center">
                         <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                         <p>No outcomes recorded yet</p>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             </div>
 
             {/* Session History Table */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <History className="w-5 h-5" />
                   Session History
                 </CardTitle>
                 <CardDescription>Your completed call sessions</CardDescription>
               </CardHeader>
               <CardContent>
                 {sessions.length > 0 ? (
                   <div className="rounded-md border">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Timestamp</TableHead>
                           <TableHead>Lead</TableHead>
                           <TableHead>Outcome</TableHead>
                           <TableHead>Notes</TableHead>
                           <TableHead>Duration</TableHead>
                           <TableHead>Appointment</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {sessions.map((session) => (
                           <TableRow key={session.id}>
                             <TableCell className="text-sm">
                               {format(new Date(session.start_time), "MMM d, h:mm a")}
                             </TableCell>
                             <TableCell>
                               <div>
                                 <p className="font-medium">{session.lead_name || "—"}</p>
                                 <p className="text-sm text-muted-foreground font-mono">{session.lead_phone}</p>
                               </div>
                             </TableCell>
                             <TableCell>{getOutcomeBadge(session.outcome)}</TableCell>
                             <TableCell>
                               {session.notes ? (
                                 <Collapsible open={expandedNotes.has(session.id)}>
                                   <CollapsibleTrigger
                                     onClick={() => toggleNotes(session.id)}
                                     className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                                   >
                                     <span className="truncate max-w-[150px]">{session.notes.slice(0, 30)}...</span>
                                     <ChevronDown className={cn("w-4 h-4 transition-transform", expandedNotes.has(session.id) && "rotate-180")} />
                                   </CollapsibleTrigger>
                                   <CollapsibleContent>
                                     <p className="text-sm mt-1 p-2 bg-muted rounded">{session.notes}</p>
                                   </CollapsibleContent>
                                 </Collapsible>
                               ) : (
                                 <span className="text-muted-foreground">—</span>
                               )}
                             </TableCell>
                             <TableCell>
                               <span className="flex items-center gap-1">
                                 <Clock className="w-3 h-3" />
                                 {formatDuration(session.duration_seconds || 0)}
                               </span>
                             </TableCell>
                             <TableCell>
                               {session.appointment_created ? (
                                 <Badge className="bg-green-600 gap-1">
                                   <CalendarCheck className="w-3 h-3" />
                                   Created
                                 </Badge>
                               ) : (
                                 <span className="text-muted-foreground">—</span>
                               )}
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>
                 ) : (
                   <div className="h-48 flex items-center justify-center text-muted-foreground">
                     <div className="text-center">
                       <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                       <p>No sessions recorded yet</p>
                       <p className="text-sm">Complete a lead to see your history</p>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </>
         )}
       </div>
     </VoipLayout>
   );
 }