 import { useState, useEffect } from "react";
 import { VoipLayout } from "@/components/voip/layout/VoipLayout";
 import { useVoipApi } from "@/hooks/useVoipApi";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { Badge } from "@/components/ui/badge";
 import { Trophy, Medal, Phone, Calendar, TrendingUp, Loader2, Award, Star, Flame } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface LeaderboardEntry {
   user_id: number;
   user_name: string;
   calls_today: number;
   calls_week: number;
   calls_month: number;
   appointments_today: number;
   appointments_week: number;
   appointments_month: number;
   conversion_rate: number;
 }
 
 interface UserBadge {
   id: string;
   name: string;
   description: string;
   icon: "trophy" | "medal" | "star" | "flame" | "award";
   color: string;
 }
 
 const BADGE_CONFIG: Record<string, UserBadge> = {
   calls_100: {
     id: "calls_100",
     name: "100 Calls Club",
     description: "Made 100+ calls",
     icon: "trophy",
     color: "text-yellow-500",
   },
   calls_500: {
     id: "calls_500",
     name: "Power Dialer",
     description: "Made 500+ calls",
     icon: "flame",
     color: "text-orange-500",
   },
   top_setter: {
     id: "top_setter",
     name: "Top Setter",
     description: "Most appointments this week",
     icon: "star",
     color: "text-purple-500",
   },
   appointment_king: {
     id: "appointment_king",
     name: "Appointment King",
     description: "50+ appointments",
     icon: "medal",
     color: "text-blue-500",
   },
   high_converter: {
     id: "high_converter",
     name: "High Converter",
     description: "20%+ conversion rate",
     icon: "award",
     color: "text-green-500",
   },
 };
 
 const BadgeIcon = ({ badge }: { badge: UserBadge }) => {
   const iconClass = cn("w-5 h-5", badge.color);
   switch (badge.icon) {
     case "trophy":
       return <Trophy className={iconClass} />;
     case "medal":
       return <Medal className={iconClass} />;
     case "star":
       return <Star className={iconClass} />;
     case "flame":
       return <Flame className={iconClass} />;
     case "award":
       return <Award className={iconClass} />;
   }
 };
 
 export default function Leaderboard() {
   const { apiCall } = useVoipApi();
   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [period, setPeriod] = useState<"today" | "week" | "month">("today");
 
   useEffect(() => {
     const fetchLeaderboard = async () => {
       setIsLoading(true);
       const result = await apiCall<{ leaderboard: LeaderboardEntry[] }>("voip-analytics", {
         params: { action: "leaderboard", period },
       });
 
       if (result.data) {
         setLeaderboard(result.data.leaderboard);
       }
       setIsLoading(false);
     };
 
     fetchLeaderboard();
   }, [apiCall, period]);
 
   const getCallsForPeriod = (entry: LeaderboardEntry) => {
     switch (period) {
       case "today":
         return entry.calls_today;
       case "week":
         return entry.calls_week;
       case "month":
         return entry.calls_month;
     }
   };
 
   const getAppointmentsForPeriod = (entry: LeaderboardEntry) => {
     switch (period) {
       case "today":
         return entry.appointments_today;
       case "week":
         return entry.appointments_week;
       case "month":
         return entry.appointments_month;
     }
   };
 
   const getUserBadges = (entry: LeaderboardEntry): UserBadge[] => {
     const badges: UserBadge[] = [];
     const totalCalls = entry.calls_month;
     const totalAppointments = entry.appointments_month;
 
     if (totalCalls >= 500) badges.push(BADGE_CONFIG.calls_500);
     else if (totalCalls >= 100) badges.push(BADGE_CONFIG.calls_100);
     
     if (totalAppointments >= 50) badges.push(BADGE_CONFIG.appointment_king);
     if (entry.conversion_rate >= 20) badges.push(BADGE_CONFIG.high_converter);
 
     return badges;
   };
 
   const sortedByAppointments = [...leaderboard].sort((a, b) => {
     return getAppointmentsForPeriod(b) - getAppointmentsForPeriod(a);
   });
 
   if (isLoading) {
     return (
       <VoipLayout>
         <div className="flex items-center justify-center h-64">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       </VoipLayout>
     );
   }
 
   return (
     <VoipLayout>
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
             <Trophy className="w-8 h-8 text-yellow-500" />
             Leaderboard
           </h1>
           <p className="text-muted-foreground">
             See who's leading the pack
           </p>
         </div>
 
         <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
           <TabsList>
             <TabsTrigger value="today">Today</TabsTrigger>
             <TabsTrigger value="week">This Week</TabsTrigger>
             <TabsTrigger value="month">This Month</TabsTrigger>
           </TabsList>
 
           <TabsContent value={period} className="mt-6">
             {/* Top 3 Podium */}
             {sortedByAppointments.length >= 3 && (
               <div className="grid grid-cols-3 gap-4 mb-8">
                 {/* Second Place */}
                 <Card className="text-center pt-8">
                   <CardContent>
                     <div className="relative inline-block">
                       <Avatar className="w-16 h-16 mx-auto border-4 border-gray-400">
                         <AvatarFallback className="text-lg bg-gray-100">
                           {sortedByAppointments[1]?.user_name?.slice(0, 2).toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-400">
                         2nd
                       </Badge>
                     </div>
                     <p className="mt-4 font-semibold">{sortedByAppointments[1]?.user_name}</p>
                     <p className="text-2xl font-bold text-primary">
                       {getAppointmentsForPeriod(sortedByAppointments[1])}
                     </p>
                     <p className="text-sm text-muted-foreground">appointments</p>
                   </CardContent>
                 </Card>
 
                 {/* First Place */}
                 <Card className="text-center pt-4 border-yellow-500/50 shadow-lg scale-105">
                   <CardContent>
                     <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                     <div className="relative inline-block">
                       <Avatar className="w-20 h-20 mx-auto border-4 border-yellow-500">
                         <AvatarFallback className="text-xl bg-yellow-50">
                           {sortedByAppointments[0]?.user_name?.slice(0, 2).toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500">
                         1st
                       </Badge>
                     </div>
                     <p className="mt-4 font-semibold">{sortedByAppointments[0]?.user_name}</p>
                     <p className="text-3xl font-bold text-primary">
                       {getAppointmentsForPeriod(sortedByAppointments[0])}
                     </p>
                     <p className="text-sm text-muted-foreground">appointments</p>
                   </CardContent>
                 </Card>
 
                 {/* Third Place */}
                 <Card className="text-center pt-12">
                   <CardContent>
                     <div className="relative inline-block">
                       <Avatar className="w-14 h-14 mx-auto border-4 border-amber-700">
                         <AvatarFallback className="bg-amber-50">
                           {sortedByAppointments[2]?.user_name?.slice(0, 2).toUpperCase()}
                         </AvatarFallback>
                       </Avatar>
                       <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-700">
                         3rd
                       </Badge>
                     </div>
                     <p className="mt-4 font-semibold">{sortedByAppointments[2]?.user_name}</p>
                     <p className="text-xl font-bold text-primary">
                       {getAppointmentsForPeriod(sortedByAppointments[2])}
                     </p>
                     <p className="text-sm text-muted-foreground">appointments</p>
                   </CardContent>
                 </Card>
               </div>
             )}
 
             {/* Full Rankings */}
             <div className="grid gap-4 md:grid-cols-2">
               {/* By Calls */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Phone className="w-5 h-5 text-primary" />
                     Most Calls
                   </CardTitle>
                   <CardDescription>Ranked by call volume</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-3">
                     {[...leaderboard]
                       .sort((a, b) => getCallsForPeriod(b) - getCallsForPeriod(a))
                       .slice(0, 10)
                       .map((entry, index) => (
                         <div
                           key={entry.user_id}
                           className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                         >
                           <span className="w-6 text-center font-bold text-muted-foreground">
                             {index + 1}
                           </span>
                           <Avatar className="w-8 h-8">
                             <AvatarFallback className="text-xs">
                               {entry.user_name?.slice(0, 2).toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                           <span className="flex-1 font-medium">{entry.user_name}</span>
                           <div className="flex items-center gap-2">
                             {getUserBadges(entry).slice(0, 2).map((badge) => (
                               <BadgeIcon key={badge.id} badge={badge} />
                             ))}
                           </div>
                           <span className="font-bold text-primary">
                             {getCallsForPeriod(entry)}
                           </span>
                         </div>
                       ))}
                   </div>
                 </CardContent>
               </Card>
 
               {/* By Appointments */}
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-green-500" />
                     Most Appointments
                   </CardTitle>
                   <CardDescription>Ranked by appointments set</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-3">
                     {sortedByAppointments.slice(0, 10).map((entry, index) => (
                       <div
                         key={entry.user_id}
                         className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                       >
                         <span className="w-6 text-center font-bold text-muted-foreground">
                           {index + 1}
                         </span>
                         <Avatar className="w-8 h-8">
                           <AvatarFallback className="text-xs">
                             {entry.user_name?.slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                         </Avatar>
                         <span className="flex-1 font-medium">{entry.user_name}</span>
                         <div className="flex items-center gap-2">
                           {getUserBadges(entry).slice(0, 2).map((badge) => (
                             <BadgeIcon key={badge.id} badge={badge} />
                           ))}
                         </div>
                         <span className="font-bold text-green-500">
                           {getAppointmentsForPeriod(entry)}
                         </span>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Conversion Rate */}
             <Card className="mt-4">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-blue-500" />
                   Best Conversion Rate
                 </CardTitle>
                 <CardDescription>
                   Percentage of calls that result in appointments
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                   {[...leaderboard]
                     .filter((e) => getCallsForPeriod(e) >= 10)
                     .sort((a, b) => b.conversion_rate - a.conversion_rate)
                     .slice(0, 6)
                     .map((entry, index) => (
                       <div
                         key={entry.user_id}
                         className="flex items-center gap-3 p-3 rounded-lg border"
                       >
                         <span className="w-6 text-center font-bold text-muted-foreground">
                           #{index + 1}
                         </span>
                         <Avatar className="w-8 h-8">
                           <AvatarFallback className="text-xs">
                             {entry.user_name?.slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                         </Avatar>
                         <div className="flex-1">
                           <p className="font-medium">{entry.user_name}</p>
                           <p className="text-xs text-muted-foreground">
                             {getCallsForPeriod(entry)} calls
                           </p>
                         </div>
                         <span className="font-bold text-blue-500">
                           {entry.conversion_rate.toFixed(1)}%
                         </span>
                       </div>
                     ))}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </VoipLayout>
   );
 }