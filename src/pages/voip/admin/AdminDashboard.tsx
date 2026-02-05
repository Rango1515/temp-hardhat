import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Phone, PhoneCall, Hash, FileText, TrendingUp, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCalls: number;
  totalNumbers: number;
  assignedNumbers: number;
  pendingRequests: number;
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

export default function AdminDashboard() {
  const { apiCall } = useVoipApi();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [callsByDay, setCallsByDay] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const result = await apiCall<{
        stats: AdminStats;
        recentActivity: ActivityLog[];
        callsByDay: DailyStats[];
      }>("voip-admin-ext", { params: { action: "analytics" } });

      if (result.data) {
        setStats(result.data.stats);
        setRecentActivity(result.data.recentActivity || []);
        setCallsByDay(result.data.callsByDay || []);
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.activeUsers || 0} active`}
            icon={Users}
          />
          <StatCard
            title="Total Calls"
            value={stats?.totalCalls || 0}
            icon={PhoneCall}
          />
          <StatCard
            title="Phone Numbers"
            value={stats?.totalNumbers || 0}
            subtitle={`${stats?.assignedNumbers || 0} assigned`}
            icon={Hash}
          />
          <StatCard
            title="Pending Requests"
            value={stats?.pendingRequests || 0}
            icon={FileText}
            variant={stats?.pendingRequests && stats.pendingRequests > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Available Numbers"
            value={(stats?.totalNumbers || 0) - (stats?.assignedNumbers || 0)}
            icon={Phone}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Call Volume Chart Placeholder */}
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
