import { useState, useEffect } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, Medal, Phone, Calendar, TrendingUp, Loader2, Award, Star, Flame, Target, ShieldBan, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface LeaderboardEntry {
  user_id: number;
  user_name: string;
  calls: number;
  appointments: number;
  interested: number;
  dnc: number;
  followup: number;
  avg_session_duration: number;
  score: number;
  conversion_rate: number;
}

interface MyRank {
  position: number;
  calls: number;
  appointments: number;
  interested: number;
  score: number;
  conversion_rate: number;
  nextUser: { name: string; callsAhead: number } | null;
}

interface RecentActivity {
  id: number;
  user_name: string;
  outcome: string;
  lead_name: string;
  created_at: string;
  appointment_created: boolean;
}

type Period = "today" | "week" | "month" | "all";

const outcomeLabels: Record<string, string> = {
  interested: "marked Interested",
  not_interested: "marked Not Interested",
  no_answer: "logged No Answer",
  voicemail: "left Voicemail",
  wrong_number: "logged Wrong Number",
  dnc: "marked DNC",
  followup: "set Follow-up",
};

export default function Leaderboard() {
  const { apiCall } = useVoipApi();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [lbResult, actResult] = await Promise.all([
        apiCall<{ leaderboard: LeaderboardEntry[]; myRank: MyRank | null }>("voip-analytics", {
          params: { action: "leaderboard", period },
        }),
        apiCall<{ activities: RecentActivity[] }>("voip-analytics", {
          params: { action: "recent-activity" },
        }),
      ]);
      if (lbResult.data) {
        setLeaderboard(lbResult.data.leaderboard);
        setMyRank(lbResult.data.myRank);
      }
      if (actResult.data) {
        setActivities(actResult.data.activities);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [apiCall, period]);

  const maxCalls = Math.max(...leaderboard.map(e => e.calls), 1);

  const minCallsForConversion = period === "today" ? 3 : period === "week" ? 5 : 10;

  if (isLoading) {
    return (
      <VoipLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </VoipLayout>
    );
  }

  const UserTooltip = ({ entry, children }: { entry: LeaderboardEntry; children: React.ReactNode }) => (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="p-3 space-y-1">
        <p className="font-semibold">{entry.user_name}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">Calls:</span><span>{entry.calls}</span>
          <span className="text-muted-foreground">Interested:</span><span>{entry.interested}</span>
          <span className="text-muted-foreground">Appointments:</span><span>{entry.appointments}</span>
          <span className="text-muted-foreground">Conversion:</span><span>{entry.conversion_rate}%</span>
          <span className="text-muted-foreground">DNC:</span><span>{entry.dnc}</span>
          <span className="text-muted-foreground">Score:</span><span className="font-bold">{entry.score}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <VoipLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">See who's leading the pack</p>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>

            <TabsContent value={period} className="mt-6 space-y-6">
              {/* My Rank Panel */}
              {myRank && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                          #{myRank.position}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-primary">Your Rank</p>
                          <p className="text-xs text-muted-foreground">Score: {myRank.score}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-bold">{myRank.calls}</p>
                          <p className="text-xs text-muted-foreground">Calls</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{myRank.appointments}</p>
                          <p className="text-xs text-muted-foreground">Appts</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{myRank.conversion_rate}%</p>
                          <p className="text-xs text-muted-foreground">Conv.</p>
                        </div>
                      </div>
                      {myRank.nextUser && myRank.nextUser.callsAhead > 0 && (
                        <p className="text-xs text-muted-foreground ml-auto">
                          🔥 {myRank.nextUser.callsAhead} calls away from passing <strong>{myRank.nextUser.name}</strong>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Podium - Top 3 by Score */}
              {leaderboard.filter(e => e.calls > 0).length >= 3 && (
                <div className="grid grid-cols-3 gap-4">
                  {[1, 0, 2].map((idx) => {
                    const entry = leaderboard[idx];
                    if (!entry) return null;
                    const isFirst = idx === 0;
                    const borderColor = idx === 0 ? "border-yellow-500/50" : idx === 1 ? "border-gray-400/50" : "border-amber-700/50";
                    const badgeColor = idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-amber-700";
                    const avatarBorder = idx === 0 ? "border-yellow-500" : idx === 1 ? "border-gray-400" : "border-amber-700";
                    const position = idx === 0 ? "1st" : idx === 1 ? "2nd" : "3rd";
                    return (
                      <UserTooltip key={entry.user_id} entry={entry}>
                        <Card className={cn("text-center cursor-pointer", isFirst && "shadow-lg scale-105", borderColor, idx === 1 && "pt-8", idx === 2 && "pt-12", isFirst && "pt-4")}>
                          <CardContent>
                            {isFirst && <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />}
                            <div className="relative inline-block">
                              <Avatar className={cn("mx-auto border-4", avatarBorder, isFirst ? "w-20 h-20" : idx === 1 ? "w-16 h-16" : "w-14 h-14")}>
                                <AvatarFallback className={cn(isFirst ? "text-xl" : "text-lg")}>
                                  {entry.user_name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <Badge className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2", badgeColor)}>
                                {position}
                              </Badge>
                            </div>
                            <p className="mt-4 font-semibold">{entry.user_name}</p>
                            <p className={cn("font-bold text-primary", isFirst ? "text-3xl" : idx === 1 ? "text-2xl" : "text-xl")}>
                              {entry.score}
                            </p>
                            <p className="text-sm text-muted-foreground">score</p>
                          </CardContent>
                        </Card>
                      </UserTooltip>
                    );
                  })}
                </div>
              )}

              {/* Ranking Sections */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Most Calls */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Phone className="w-5 h-5 text-primary" /> Most Calls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...leaderboard].sort((a, b) => b.calls - a.calls).slice(0, 5).map((entry, i) => (
                      <UserTooltip key={entry.user_id} entry={entry}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <span className="w-5 text-center font-bold text-muted-foreground text-sm">{i + 1}</span>
                          <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{entry.user_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className="flex-1 font-medium text-sm truncate">{entry.user_name}</span>
                          <div className="w-20"><Progress value={(entry.calls / maxCalls) * 100} className="h-2" /></div>
                          <span className="font-bold text-primary w-8 text-right">{entry.calls}</span>
                        </div>
                      </UserTooltip>
                    ))}
                  </CardContent>
                </Card>

                {/* Most Appointments */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="w-5 h-5 text-green-500" /> Most Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...leaderboard].sort((a, b) => b.appointments - a.appointments).slice(0, 5).map((entry, i) => (
                      <UserTooltip key={entry.user_id} entry={entry}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <span className="w-5 text-center font-bold text-muted-foreground text-sm">{i + 1}</span>
                          <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{entry.user_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className="flex-1 font-medium text-sm truncate">{entry.user_name}</span>
                          <span className="font-bold text-green-500">{entry.appointments}</span>
                        </div>
                      </UserTooltip>
                    ))}
                  </CardContent>
                </Card>

                {/* Best Conversion Rate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="w-5 h-5 text-blue-500" /> Best Conversion Rate
                    </CardTitle>
                    <CardDescription className="text-xs">Min {minCallsForConversion} calls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...leaderboard]
                      .filter(e => e.calls >= minCallsForConversion)
                      .sort((a, b) => b.conversion_rate - a.conversion_rate)
                      .slice(0, 5)
                      .map((entry, i) => (
                        <UserTooltip key={entry.user_id} entry={entry}>
                          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                            <span className="w-5 text-center font-bold text-muted-foreground text-sm">{i + 1}</span>
                            <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{entry.user_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <span className="flex-1 font-medium text-sm truncate">{entry.user_name}</span>
                            <span className="font-bold text-blue-500">{entry.conversion_rate}%</span>
                          </div>
                        </UserTooltip>
                      ))}
                  </CardContent>
                </Card>

                {/* Most Interested */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="w-5 h-5 text-purple-500" /> Most Interested Leads
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...leaderboard].sort((a, b) => b.interested - a.interested).slice(0, 5).map((entry, i) => (
                      <UserTooltip key={entry.user_id} entry={entry}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                          <span className="w-5 text-center font-bold text-muted-foreground text-sm">{i + 1}</span>
                          <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{entry.user_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span className="flex-1 font-medium text-sm truncate">{entry.user_name}</span>
                          <span className="font-bold text-purple-500">{entry.interested}</span>
                        </div>
                      </UserTooltip>
                    ))}
                  </CardContent>
                </Card>

                {/* Lowest DNC Rate */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShieldBan className="w-5 h-5 text-orange-500" /> Lowest DNC Rate
                    </CardTitle>
                    <CardDescription className="text-xs">Min 10 calls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-3">
                      {[...leaderboard]
                        .filter(e => e.calls >= 10)
                        .map(e => ({ ...e, dncRate: e.calls > 0 ? (e.dnc / e.calls) * 100 : 100 }))
                        .sort((a, b) => a.dncRate - b.dncRate)
                        .slice(0, 6)
                        .map((entry, i) => (
                          <UserTooltip key={entry.user_id} entry={entry}>
                            <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
                              <span className="w-5 text-center font-bold text-muted-foreground">#{i + 1}</span>
                              <Avatar className="w-7 h-7"><AvatarFallback className="text-xs">{entry.user_name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{entry.user_name}</p>
                                <p className="text-xs text-muted-foreground">{entry.calls} calls</p>
                              </div>
                              <span className="font-bold text-orange-500">{entry.dncRate.toFixed(1)}%</span>
                            </div>
                          </UserTooltip>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Feed */}
              {activities.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-emerald-500" /> Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {activities.map((act) => (
                        <div key={act.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                          <div className="flex items-center gap-2">
                            {act.appointment_created && <CalendarPlus className="w-4 h-4 text-green-500" />}
                            <span>
                              <strong>{act.user_name}</strong>{" "}
                              {act.appointment_created
                                ? "booked an appointment"
                                : outcomeLabels[act.outcome] || `completed a call`}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true }) : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </VoipLayout>
    </TooltipProvider>
  );
}

// Small icon for activity — not imported at top to avoid circular
function CalendarPlus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <line x1="19" x2="19" y1="16" y2="22" />
      <line x1="16" x2="22" y1="19" y2="19" />
    </svg>
  );
}