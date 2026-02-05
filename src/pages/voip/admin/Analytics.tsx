import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Phone, Users, TrendingUp, Target, CalendarCheck, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";

interface LeadStats {
  total: number;
  new: number;
  assigned: number;
  completed: number;
  dnc: number;
}

interface AdminStats {
  totalCalls: number;
  leadsRequested: number;
  leadsCompleted: number;
  completionRate: number;
  appointmentsCreated: number;
  conversionRate: number;
  outcomes: Record<string, number>;
  dailyCalls: { date: string; count: number }[];
  leaderboard: { userId: number; name: string; calls: number; appointments: number }[];
}

export default function AdminAnalytics() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const result = await apiCall<{ stats: LeadStats }>("voip-leads", {
        params: { action: "stats" },
      });
      if (result.data) setLeadStats(result.data.stats);

      const adminResult = await apiCall<AdminStats>("voip-analytics", {
        params: { action: "admin-stats" },
      });
      if (adminResult.data) setAdminStats(adminResult.data);
    };
    fetchData();
  }, [apiCall]);

  const handleResetAnalytics = async () => {
    if (resetText !== "RESET") return;
    setResetting(true);

    const result = await apiCall("voip-analytics", {
      method: "POST",
      params: { action: "reset-analytics" },
      body: { includeCallLogs: false },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Analytics data has been reset" });
      setShowResetConfirm(false);
      setResetText("");
      // Refresh data
      const adminResult = await apiCall<AdminStats>("voip-analytics", {
        params: { action: "admin-stats" },
      });
      if (adminResult.data) setAdminStats(adminResult.data);
    }
    setResetting(false);
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

  return (
    <VoipLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">System-wide statistics and insights</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Analytics
          </Button>
        </div>

        {showResetConfirm && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Confirm Reset
              </CardTitle>
              <CardDescription>
                This will delete all activity events and session data. Type "RESET" to confirm.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <input
                type="text"
                value={resetText}
                onChange={(e) => setResetText(e.target.value)}
                placeholder="Type RESET"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
              />
              <Button
                variant="destructive"
                disabled={resetText !== "RESET" || resetting}
                onClick={handleResetAnalytics}
              >
                {resetting ? "Resetting..." : "Confirm Reset"}
              </Button>
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Calls"
            value={adminStats?.totalCalls || 0}
            subtitle="All time"
            icon={Phone}
          />
          <StatCard
            title="Completion Rate"
            value={`${adminStats?.completionRate || 0}%`}
            subtitle="Leads completed"
            icon={Target}
            variant="success"
          />
          <StatCard
            title="Appointments"
            value={adminStats?.appointmentsCreated || 0}
            subtitle="Created"
            icon={CalendarCheck}
          />
          <StatCard
            title="Conversion Rate"
            value={`${adminStats?.conversionRate || 0}%`}
            subtitle="Leads → Appointments"
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
              {adminStats?.dailyCalls && adminStats.dailyCalls.length > 0 ? (
                <div className="space-y-2">
                  {adminStats.dailyCalls.map(({ date, count }) => (
                    <div key={date} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-20">
                        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(...adminStats.dailyCalls.map(d => d.count))) * 100)}%` }}
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
                    <p>No call data yet</p>
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
              <CardDescription>Breakdown of call results</CardDescription>
            </CardHeader>
            <CardContent>
              {adminStats?.outcomes && Object.keys(adminStats.outcomes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(adminStats.outcomes)
                    .sort((a, b) => b[1] - a[1])
                    .map(([outcome, count]) => (
                      <div key={outcome} className="flex items-center justify-between">
                        <span className="text-sm">{outcomeLabels[outcome] || outcome}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(count / adminStats.totalCalls) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-10 text-right">{count}</span>
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

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performers by call volume</CardDescription>
          </CardHeader>
          <CardContent>
            {adminStats?.leaderboard && adminStats.leaderboard.length > 0 ? (
              <div className="space-y-3">
                {adminStats.leaderboard.map((user, idx) => (
                  <div key={user.userId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? "bg-yellow-500 text-black" :
                      idx === 1 ? "bg-gray-400 text-black" :
                      idx === 2 ? "bg-amber-700 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{user.calls} calls</p>
                      <p className="text-xs text-muted-foreground">{user.appointments} appointments</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No call data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Lead Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Lead Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold text-primary">{leadStats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold" style={{ color: "hsl(var(--chart-2))" }}>{leadStats?.new || 0}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold" style={{ color: "hsl(var(--chart-1))" }}>{leadStats?.assigned || 0}</p>
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
