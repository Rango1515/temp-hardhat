import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Phone, Users, TrendingUp, Clock, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useVoipApi } from "@/hooks/useVoipApi";

interface LeadStats {
  total: number;
  new: number;
  assigned: number;
  completed: number;
  dnc: number;
}

export default function AdminAnalytics() {
  const { apiCall } = useVoipApi();
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await apiCall<{ stats: LeadStats }>("voip-leads", {
        params: { action: "stats" },
      });
      if (result.data) setLeadStats(result.data.stats);
    };
    fetchStats();
  }, [apiCall]);

  const connectRate = leadStats && leadStats.total > 0
    ? Math.round((leadStats.completed / leadStats.total) * 100)
    : 0;

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">System-wide statistics and insights</p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Leads"
            value={leadStats?.total || 0}
            subtitle="In system"
            icon={Users}
          />
          <StatCard
            title="Available Leads"
            value={leadStats?.new || 0}
            subtitle="Ready to assign"
            icon={Target}
            variant="success"
          />
          <StatCard
            title="Completed"
            value={leadStats?.completed || 0}
            subtitle="Calls finished"
            icon={Phone}
          />
          <StatCard
            title="Connect Rate"
            value={`${connectRate}%`}
            subtitle="Completion rate"
            icon={TrendingUp}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calls Per Day Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Calls Per Day
              </CardTitle>
              <CardDescription>Daily call volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No call data yet</p>
                  <p className="text-sm">Data will appear as calls are made</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Lead Status Breakdown
              </CardTitle>
              <CardDescription>Current lead distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>New (Available)</span>
                  </div>
                  <span className="font-medium">{leadStats?.new || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Assigned (In Progress)</span>
                  </div>
                  <span className="font-medium">{leadStats?.assigned || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span>Completed</span>
                  </div>
                  <span className="font-medium">{leadStats?.completed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Do Not Call</span>
                  </div>
                  <span className="font-medium">{leadStats?.dnc || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Call Outcomes
            </CardTitle>
            <CardDescription>Breakdown of call results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-primary">{leadStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-green-600">{leadStats?.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-blue-600">{leadStats?.assigned || 0}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-destructive">{leadStats?.dnc || 0}</p>
                <p className="text-sm text-muted-foreground">DNC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
