import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { useVoipAuth } from "@/contexts/VoipAuthContext";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
 import { Phone, PhoneOutgoing, Clock, TrendingUp, Loader2, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface Analytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_duration_seconds: number;
  total_cost: number;
  last_call_date: string | null;
  success_rate: number;
  avg_duration: number;
}

export default function ClientDashboard() {
  const { user } = useVoipAuth();
  const { apiCall } = useVoipApi();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const analyticsRes = await apiCall<Analytics>("voip-analytics", { params: { action: "summary" } });

      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      
      setIsLoading(false);
    };

    fetchData();
  }, [apiCall]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your calling activity
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/voip/dialer">
              <Phone className="w-4 h-4 mr-2" />
              Open Dialer
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/voip/calls">
              <PhoneOutgoing className="w-4 h-4 mr-2" />
              View Call History
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Calls"
            value={analytics?.total_calls || 0}
            subtitle="All time"
            icon={PhoneOutgoing}
          />
          <StatCard
            title="Success Rate"
            value={`${analytics?.success_rate || 0}%`}
            subtitle={`${analytics?.successful_calls || 0} successful`}
            icon={TrendingUp}
            variant={analytics?.success_rate && analytics.success_rate >= 80 ? "success" : "warning"}
          />
          <StatCard
            title="Total Duration"
            value={formatDuration(analytics?.total_duration_seconds || 0)}
            subtitle="Talk time"
            icon={Clock}
          />
          <StatCard
            title="Avg Duration"
            value={formatDuration(analytics?.avg_duration || 0)}
            subtitle="Per call"
            icon={Users}
          />
        </div>

        {/* Getting Started Card */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>How to make calls with TextNow</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the <strong>Dialer</strong> page and request your next lead</li>
              <li>Click <strong>"Open TextNow"</strong> to launch the calling app</li>
              <li>Make your call using TextNow and track the session timer</li>
              <li>Log your outcome and notes after each call</li>
              <li>Schedule appointments for interested leads</li>
            </ol>
            <Button className="mt-4" asChild>
              <Link to="/voip/dialer">
                <Phone className="w-4 h-4 mr-2" />
                Start Calling
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
