import { useEffect, useState } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { StatCard } from "@/components/voip/dashboard/StatCard";
import { useVoipAuth } from "@/contexts/VoipAuthContext";
import { useVoipApi } from "@/hooks/useVoipApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOutgoing, Clock, TrendingUp, Hash, Loader2, Users } from "lucide-react";
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

interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string;
  status: string;
}

export default function ClientDashboard() {
  const { user } = useVoipAuth();
  const { apiCall } = useVoipApi();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [analyticsRes, numbersRes] = await Promise.all([
        apiCall<Analytics>("voip-analytics", { params: { action: "summary" } }),
        apiCall<{ numbers: PhoneNumber[] }>("voip-numbers", { params: { action: "my-numbers" } }),
      ]);

      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      if (numbersRes.data) setNumbers(numbersRes.data.numbers);
      
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
            <Link to="/voip/request-number">
              <Hash className="w-4 h-4 mr-2" />
              Request Number
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

        {/* My Numbers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Phone Numbers</CardTitle>
              <CardDescription>Numbers assigned to your account</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/voip/numbers">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {numbers.length === 0 ? (
              <div className="text-center py-8">
                <Hash className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No numbers assigned yet
                </p>
                <Button variant="outline" asChild>
                  <Link to="/voip/request-number">Request a Number</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {numbers.slice(0, 3).map((number) => (
                  <div
                    key={number.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{number.phone_number}</p>
                        {number.friendly_name && (
                          <p className="text-sm text-muted-foreground">
                            {number.friendly_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {number.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VoipLayout>
  );
}
