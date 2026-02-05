 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { StatCard } from "@/components/voip/dashboard/StatCard";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart3, Phone, Target, TrendingUp, Clock, CalendarCheck } from "lucide-react";
 import { useEffect, useState } from "react";
 import { useVoipApi } from "@/hooks/useVoipApi";
 
 interface MyStats {
   totalCalls: number;
   outcomes: Record<string, number>;
   leadsRequested: number;
   leadsCompleted: number;
   completionRate: number;
   avgTimePerLead: number;
   totalActiveTime: number;
   appointmentsCreated: number;
   dailyActivity: { date: string; count: number }[];
 }
 
 function formatDuration(seconds: number): string {
   const hours = Math.floor(seconds / 3600);
   const mins = Math.floor((seconds % 3600) / 60);
   if (hours > 0) return `${hours}h ${mins}m`;
   return `${mins}m`;
 }
 
 export default function MyAnalytics() {
   const { apiCall } = useVoipApi();
   const [stats, setStats] = useState<MyStats | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchStats = async () => {
       const result = await apiCall<MyStats>("voip-analytics", {
         params: { action: "my-stats" },
       });
       if (result.data) setStats(result.data);
       setLoading(false);
     };
     fetchStats();
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
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <StatCard
                 title="Total Calls"
                 value={stats?.totalCalls || 0}
                 subtitle="All time"
                 icon={Phone}
               />
               <StatCard
                 title="Completion Rate"
                 value={`${stats?.completionRate || 0}%`}
                 subtitle="Leads completed"
                 icon={Target}
                 variant="success"
               />
               <StatCard
                 title="Avg Time/Lead"
                 value={formatDuration(stats?.avgTimePerLead || 0)}
                 subtitle="Session time"
                 icon={Clock}
               />
               <StatCard
                 title="Appointments"
                 value={stats?.appointmentsCreated || 0}
                 subtitle="Created"
                 icon={CalendarCheck}
                 variant="success"
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
                     Call Outcomes
                   </CardTitle>
                   <CardDescription>Breakdown of your call results</CardDescription>
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
 
             {/* Session Stats */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Clock className="w-5 h-5" />
                   Session Summary
                 </CardTitle>
                 <CardDescription>Your activity and time on platform</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid gap-4 md:grid-cols-3">
                   <div className="p-4 rounded-lg bg-muted/50 text-center">
                     <p className="text-3xl font-bold text-primary">{stats?.leadsRequested || 0}</p>
                     <p className="text-sm text-muted-foreground">Leads Requested</p>
                   </div>
                   <div className="p-4 rounded-lg bg-muted/50 text-center">
                     <p className="text-3xl font-bold text-green-600">{stats?.leadsCompleted || 0}</p>
                     <p className="text-sm text-muted-foreground">Leads Completed</p>
                   </div>
                   <div className="p-4 rounded-lg bg-muted/50 text-center">
                     <p className="text-3xl font-bold text-blue-600">{formatDuration(stats?.totalActiveTime || 0)}</p>
                     <p className="text-sm text-muted-foreground">Total Active Time</p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </>
         )}
       </div>
     </VoipLayout>
   );
 }