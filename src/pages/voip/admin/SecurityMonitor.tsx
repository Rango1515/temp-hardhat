import { useState, useEffect, useCallback } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ShieldAlert,
  Ban,
  Activity,
  Globe,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  Unlock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  totalRequests: number;
  suspiciousCount: number;
  blockedCount: number;
  topIPs: { ip: string; count: number }[];
  recentAlerts: { ip_address: string; endpoint: string; rule_triggered: string; timestamp: string }[];
  recentSuspicious: {
    id: number;
    ip_address: string;
    endpoint: string;
    user_agent: string;
    status: string;
    rule_triggered: string;
    timestamp: string;
    request_count: number;
  }[];
  timeline: { time: string; total: number; suspicious: number }[];
}

interface LogEntry {
  id: number;
  timestamp: string;
  ip_address: string;
  endpoint: string;
  request_count: number;
  user_agent: string;
  status: string;
  rule_triggered: string;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  status: string;
}

export default function SecurityMonitor() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockIpInput, setBlockIpInput] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("15min");

  const fetchDashboard = useCallback(async () => {
    const result = await apiCall<DashboardData>("voip-security", {
      params: { action: "dashboard" },
    });
    if (result.data) setDashboard(result.data);
  }, [apiCall]);

  const fetchLogs = useCallback(async () => {
    const params: Record<string, string> = {
      action: "logs",
      page: logsPage.toString(),
      limit: "30",
    };
    if (statusFilter !== "all") params.status = statusFilter;

    const result = await apiCall<{ logs: LogEntry[]; pagination: { total: number } }>(
      "voip-security",
      { params }
    );
    if (result.data) {
      setLogs(result.data.logs);
      setLogsTotal(result.data.pagination.total);
    }
  }, [apiCall, logsPage, statusFilter]);

  const fetchBlockedIps = useCallback(async () => {
    const result = await apiCall<{ blockedIps: BlockedIP[] }>("voip-security", {
      params: { action: "blocked-ips" },
    });
    if (result.data) setBlockedIps(result.data.blockedIps);
  }, [apiCall]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchLogs(), fetchBlockedIps()]);
    setLoading(false);
  }, [fetchDashboard, fetchLogs, fetchBlockedIps]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Refetch logs when filter/page changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleBlockIp = async (ip?: string, reason?: string) => {
    const targetIp = ip || blockIpInput.trim();
    if (!targetIp) return;

    const result = await apiCall("voip-security", {
      method: "POST",
      params: { action: "block-ip" },
      body: { ip: targetIp, reason: reason || blockReason || "Manually blocked", duration: blockDuration },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "IP Blocked", description: `${targetIp} has been blocked.` });
      setBlockIpInput("");
      setBlockReason("");
      fetchBlockedIps();
      fetchDashboard();
    }
  };

  const handleUnblock = async (id: number) => {
    const result = await apiCall("voip-security", {
      method: "POST",
      params: { action: "unblock-ip" },
      body: { id },
    });

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "IP Unblocked" });
      fetchBlockedIps();
      fetchDashboard();
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Clear all security logs? This cannot be undone.")) return;
    const result = await apiCall("voip-security", {
      method: "DELETE",
      params: { action: "clear-logs" },
    });
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Logs Cleared" });
      loadAll();
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "suspicious":
        return <Badge variant="destructive">Suspicious</Badge>;
      case "blocked":
        return <Badge className="bg-destructive/80 text-destructive-foreground">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const ruleLabel = (rule: string | null) => {
    switch (rule) {
      case "rate_flood": return "Rate Flood";
      case "brute_force": return "Brute Force";
      case "endpoint_abuse": return "Endpoint Abuse";
      case "ip_blocked": return "IP Blocked";
      case "failed_login": return "Failed Login";
      default: return rule || "—";
    }
  };

  if (loading) {
    return (
      <VoipLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </VoipLayout>
    );
  }

  const hasActiveAlert = (dashboard?.recentAlerts?.length || 0) > 0;

  return (
    <VoipLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" /> Security Monitor
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track traffic patterns, detect threats, and manage blocked IPs
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearLogs}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear Logs
            </Button>
          </div>
        </div>

        {/* Attack Alert Banner */}
        {hasActiveAlert && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-destructive animate-pulse" />
                  <div>
                    <p className="font-bold text-destructive text-lg">
                      🚨 Possible DDoS / Bot Attack Detected
                    </p>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {dashboard?.recentAlerts?.slice(0, 3).map((a, i) => (
                        <p key={i}>
                          <span className="font-mono font-medium text-foreground">{a.ip_address}</span>
                          {" → "}{a.endpoint} ({ruleLabel(a.rule_triggered)})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {dashboard?.recentAlerts?.[0] && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBlockIp(dashboard.recentAlerts[0].ip_address, "Auto-blocked from alert")}
                    >
                      <Ban className="w-4 h-4 mr-1" /> Block Top IP
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.totalRequests || 0}</p>
                <p className="text-xs text-muted-foreground">Requests (24h)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.suspiciousCount || 0}</p>
                <p className="text-xs text-muted-foreground">Suspicious Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.blockedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Blocked IPs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Globe className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-mono font-bold text-foreground truncate max-w-[120px]">
                  {dashboard?.topIPs?.[0]?.ip || "None"}
                </p>
                <p className="text-xs text-muted-foreground">Top Traffic IP</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Timeline */}
        {(dashboard?.timeline?.length || 0) > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Traffic Timeline (Last Hour)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      name="Total"
                    />
                    <Area
                      type="monotone"
                      dataKey="suspicious"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive) / 0.2)"
                      name="Suspicious"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Security Logs Table */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <CardTitle className="text-base">Security Logs</CardTitle>
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setLogsPage(1); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="suspicious">Suspicious</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">Time</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">IP</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium hidden md:table-cell">Endpoint</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">Status</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium hidden lg:table-cell">Rule</th>
                        <th className="pb-2 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No logs found</td></tr>
                      ) : logs.map((log) => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 pr-3 text-xs">{formatTime(log.timestamp)}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{log.ip_address}</td>
                          <td className="py-2 pr-3 text-xs hidden md:table-cell truncate max-w-[150px]">{log.endpoint}</td>
                          <td className="py-2 pr-3">{statusBadge(log.status)}</td>
                          <td className="py-2 pr-3 text-xs hidden lg:table-cell">{ruleLabel(log.rule_triggered)}</td>
                          <td className="py-2">
                            {log.status === "suspicious" && log.ip_address && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => handleBlockIp(log.ip_address, `Blocked from security log #${log.id}`)}
                              >
                                <Ban className="w-3 h-3 mr-1" /> Block
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsTotal > 30 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page {logsPage} of {Math.ceil(logsTotal / 30)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={logsPage <= 1}
                        onClick={() => setLogsPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={logsPage >= Math.ceil(logsTotal / 30)}
                        onClick={() => setLogsPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Block IP Form */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Block IP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="IP Address (e.g. 192.168.1.1)"
                  value={blockIpInput}
                  onChange={(e) => setBlockIpInput(e.target.value)}
                />
                <Input
                  placeholder="Reason (optional)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
                <Select value={blockDuration} onValueChange={setBlockDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15min">15 Minutes</SelectItem>
                    <SelectItem value="1hour">1 Hour</SelectItem>
                    <SelectItem value="24hours">24 Hours</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => handleBlockIp()}
                  disabled={!blockIpInput.trim()}
                >
                  <Ban className="w-4 h-4 mr-1" /> Block IP
                </Button>
              </CardContent>
            </Card>

            {/* Blocked IPs List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Active Blocks ({blockedIps.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blockedIps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No blocked IPs</p>
                ) : (
                  <div className="space-y-3">
                    {blockedIps.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium truncate">{b.ip_address}</p>
                          <p className="text-xs text-muted-foreground truncate">{b.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.expires_at ? `Expires: ${formatTime(b.expires_at)}` : "Permanent"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-shrink-0"
                          onClick={() => handleUnblock(b.id)}
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top IPs */}
            {(dashboard?.topIPs?.length || 0) > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top IPs (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard?.topIPs?.map((entry, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs truncate max-w-[140px]">{entry.ip}</span>
                        <Badge variant="outline">{entry.count} req</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </VoipLayout>
  );
}
