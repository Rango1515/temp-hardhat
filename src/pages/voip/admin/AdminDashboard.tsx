import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, PhoneCall, Hash, FileText, TrendingUp, Loader2, Target, CalendarCheck, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCalls: number;
  totalNumbers: number;
  assignedNumbers: number;
  pendingRequests: number;
  availableLeads: number;
}

interface ActivityLog {
  id: number;
  user_name: string;
  action: string;
  entity_type: string;
  created_at: string;
}

interface DailyStats {
  date: string;
  count: number;
}

interface AnalyticsStats {
  totalCalls: number;
  leadsRequested: number;
  leadsCompleted: number;
  completionRate: number;
  appointmentsCreated: number;
  conversionRate: number;
  outcomes: Record<string, number>;
  leaderboard: { userId: number; name: string; calls: number; appointments: number }[];
}

export default function AdminDashboard() {
  const { apiCall } = useVoipApi();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [callsByDay, setCallsByDay] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch both endpoints in parallel
      const [extResult, analyticsResult] = await Promise.all([
        apiCall<{
          stats: AdminStats;
          recentActivity: ActivityLog[];
          callsByDay: DailyStats[];
        }>("voip-admin-ext", { params: { action: "analytics" } }),
        apiCall<AnalyticsStats>("voip-analytics", { params: { action: "admin-stats" } }),
      ]);

      if (extResult.data) {
        setStats(extResult.data.stats);
        setRecentActivity(extResult.data.recentActivity || []);
        setCallsByDay(extResult.data.callsByDay || []);
      }

      if (analyticsResult.data) {
        setAnalyticsStats(analyticsResult.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [apiCall]);

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const outcomeLabels: Record<string, string> = {
    interested: "Interested",
    not_interested: "Not Interested",
    no_answer: "No Answer",
    voicemail: "Voicemail",
    wrong_number: "Wrong Number",
    dnc: "Do Not Call",
    followup: "Follow-up",
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

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        {/* System Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} subtitle={`${stats?.activeUsers || 0} active`} icon={Users} />
          <StatCard title="Total Calls" value={stats?.totalCalls || 0} icon={PhoneCall} />
          <StatCard title="Available Leads" value={stats?.availableLeads || 0} icon={FileText} variant="success" />
          <StatCard title="Leads Requested" value={analyticsStats?.leadsRequested || 0} icon={Target} />
          <StatCard title="Leads Completed" value={analyticsStats?.leadsCompleted || 0} icon={TrendingUp} />
          <StatCard title="Appointments" value={analyticsStats?.appointmentsCreated || 0} icon={CalendarCheck} variant="success" />
          <StatCard title="Completion Rate" value={`${analyticsStats?.completionRate || 0}%`} icon={BarChart3} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Call Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Call Volume (30 Days)</CardTitle>
              <CardDescription>Daily call statistics</CardDescription>
            </CardHeader>
            <CardContent>
              {callsByDay.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No call data yet
                </div>
              ) : (
                <div className="h-48 flex items-end justify-between gap-1 px-2">
                  {callsByDay.slice(-14).map((day, i) => {
                    const maxCount = Math.max(...callsByDay.map((d) => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/80 rounded-t hover:bg-primary transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.date}: ${day.count} calls`}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Outcomes Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Call Outcomes</CardTitle>
              <CardDescription>Distribution of call results</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsStats?.outcomes && Object.keys(analyticsStats.outcomes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analyticsStats.outcomes)
                    .sort((a, b) => b[1] - a[1])
                    .map(([outcome, count]) => (
                      <div key={outcome} className="flex items-center justify-between">
                        <span className="text-sm">{outcomeLabels[outcome] || outcome}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(count / (analyticsStats?.totalCalls || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No outcomes data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mini Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>By total calls</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsStats?.leaderboard && analyticsStats.leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {analyticsStats.leaderboard.slice(0, 5).map((user, i) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-muted-foreground">{i + 1}</span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {user.calls}
                        </span>
                        <span className="flex items-center gap-1 text-green-500">
                          <CalendarCheck className="w-3 h-3" /> {user.appointments}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No performance data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {recentActivity.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{formatAction(log.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user_name || "System"} · {log.entity_type || ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </VoipLayout>
  );
}
