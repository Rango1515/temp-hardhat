import { useState, useEffect, useCallback, useRef } from "react";
import { VoipLayout } from "@/components/voip/layout/VoipLayout";
import { useVoipApi } from "@/hooks/useVoipApi";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, ShieldAlert, Ban, Activity, Globe, AlertTriangle, Trash2,
  RefreshCw, Loader2, Unlock, Copy, Radio, Settings2, Timer,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────
interface DashboardData {
  totalRequests: number;
  suspiciousCount: number;
  blockedCount: number;
  topIPs: { ip: string; count: number }[];
  recentAlerts: { ip_address: string; endpoint: string; rule_triggered: string; timestamp: string }[];
  timeline: { time: string; total: number; suspicious: number }[];
}

interface TrafficLog {
  id: number;
  timestamp: string;
  ip_address: string;
  method: string;
  path: string;
  status_code: number;
  response_ms: number | null;
  user_agent: string;
  is_suspicious: boolean;
  is_blocked: boolean;
  rule_triggered: string | null;
  action_taken: string | null;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at: string | null;
  status: string;
  scope: string;
  created_by_type: string;
}

interface WafRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  max_requests: number;
  time_window_seconds: number;
  block_duration_minutes: number;
  scope: string;
  enabled: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────
function CopyIpButton({ ip }: { ip: string }) {
  const { toast } = useToast();
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip).then(() => {
      toast({ title: "Copied", description: ip });
    });
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1 group cursor-pointer" title="Copy IP">
      <span className="font-mono text-xs select-all">{ip}</span>
      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!expiresAt) { setRemaining("Permanent"); return; }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="text-xs font-mono text-muted-foreground">{remaining}</span>;
}

const formatTime = (ts: string) => {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
};

// ── Main Component ────────────────────────────────────────────────
export default function SecurityMonitor() {
  const { apiCall } = useVoipApi();
  const { toast } = useToast();

  // Dashboard
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Traffic Logs
  const [trafficLogs, setTrafficLogs] = useState<TrafficLog[]>([]);
  const [trafficPage, setTrafficPage] = useState(1);
  const [trafficTotal, setTrafficTotal] = useState(0);
  const [trafficFilter, setTrafficFilter] = useState("all");
  const [trafficIpFilter, setTrafficIpFilter] = useState("");
  const [trafficEndpointFilter, setTrafficEndpointFilter] = useState("");
  const [liveMode, setLiveMode] = useState(false);
  const liveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Blocked IPs
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [blockIpInput, setBlockIpInput] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState("15min");
  const [blockScope, setBlockScope] = useState("all");

  // WAF Rules
  const [wafRules, setWafRules] = useState<WafRule[]>([]);
  const [editingRule, setEditingRule] = useState<WafRule | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("overview");

  // ── Data fetchers ───────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    const result = await apiCall<DashboardData>("voip-security", { params: { action: "dashboard" } });
    if (result.data) setDashboard(result.data);
  }, [apiCall]);

  const fetchTrafficLogs = useCallback(async () => {
    const params: Record<string, string> = {
      action: "traffic-logs",
      page: trafficPage.toString(),
      limit: "40",
    };
    if (trafficFilter !== "all") params.status = trafficFilter;
    if (trafficIpFilter) params.ip = trafficIpFilter;
    if (trafficEndpointFilter) params.endpoint = trafficEndpointFilter;

    const result = await apiCall<{ logs: TrafficLog[]; pagination: { total: number } }>(
      "voip-security", { params }
    );
    if (result.data) {
      setTrafficLogs(result.data.logs);
      setTrafficTotal(result.data.pagination.total);
    }
  }, [apiCall, trafficPage, trafficFilter, trafficIpFilter, trafficEndpointFilter]);

  const fetchBlockedIps = useCallback(async () => {
    const result = await apiCall<{ blockedIps: BlockedIP[] }>("voip-security", { params: { action: "blocked-ips" } });
    if (result.data) setBlockedIps(result.data.blockedIps);
  }, [apiCall]);

  const fetchWafRules = useCallback(async () => {
    const result = await apiCall<{ rules: WafRule[] }>("voip-security", { params: { action: "waf-rules" } });
    if (result.data) setWafRules(result.data.rules);
  }, [apiCall]);

  // Initial load — fetches everything once
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    setLoading(true);
    Promise.all([fetchDashboard(), fetchTrafficLogs(), fetchBlockedIps(), fetchWafRules()])
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh dashboard every 20s (lightweight — only dashboard stats)
  useEffect(() => {
    const interval = setInterval(fetchDashboard, 20000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Refetch traffic logs ONLY when filters change (not on initial mount — handled above)
  const filtersChanged = useRef(false);
  useEffect(() => {
    if (!filtersChanged.current) {
      filtersChanged.current = true;
      return; // Skip initial run, already handled by initial load
    }
    fetchTrafficLogs();
  }, [fetchTrafficLogs]);

  // Live stream mode
  useEffect(() => {
    if (liveMode) {
      liveInterval.current = setInterval(() => {
        fetchTrafficLogs();
        fetchDashboard();
      }, 3000);
    } else if (liveInterval.current) {
      clearInterval(liveInterval.current);
      liveInterval.current = null;
    }
    return () => { if (liveInterval.current) clearInterval(liveInterval.current); };
  }, [liveMode, fetchTrafficLogs, fetchDashboard]);

  // ── Actions ─────────────────────────────────────────────────────
  const handleBlockIp = async (ip?: string, reason?: string) => {
    const targetIp = ip || blockIpInput.trim();
    if (!targetIp) return;
    const result = await apiCall("voip-security", {
      method: "POST", params: { action: "block-ip" },
      body: { ip: targetIp, reason: reason || blockReason || "Manually blocked", duration: blockDuration, scope: blockScope },
    });
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { toast({ title: "IP Blocked", description: `${targetIp} blocked.` }); setBlockIpInput(""); setBlockReason(""); fetchBlockedIps(); fetchDashboard(); }
  };

  const handleUnblock = async (id: number) => {
    const result = await apiCall("voip-security", { method: "POST", params: { action: "unblock-ip" }, body: { id } });
    if (result.error) toast({ title: "Error", description: result.error, variant: "destructive" });
    else { toast({ title: "IP Unblocked" }); fetchBlockedIps(); fetchDashboard(); }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDashboard(), fetchTrafficLogs(), fetchBlockedIps(), fetchWafRules()]);
    setLoading(false);
  }, [fetchDashboard, fetchTrafficLogs, fetchBlockedIps, fetchWafRules]);

  const handleClearLogs = async (target: string) => {
    if (!confirm(`Clear ${target} logs? This cannot be undone.`)) return;
    await apiCall("voip-security", { method: "DELETE", params: { action: "clear-logs", target } });
    toast({ title: "Logs Cleared" });
    refreshAll();
  };

  const handleToggleRule = async (rule: WafRule) => {
    await apiCall("voip-security", {
      method: "PATCH", params: { action: "waf-rules", id: rule.id.toString() },
      body: { enabled: !rule.enabled },
    });
    fetchWafRules();
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    await apiCall("voip-security", {
      method: "PATCH", params: { action: "waf-rules", id: editingRule.id.toString() },
      body: editingRule,
    });
    toast({ title: "Rule Updated" });
    setEditingRule(null);
    fetchWafRules();
  };

  const handleCleanup = async () => {
    if (!confirm("Run retention cleanup? Deletes logs older than 7 days and security events older than 30 days.")) return;
    await apiCall("voip-security", { method: "POST", params: { action: "cleanup" } });
    toast({ title: "Cleanup Complete" });
    refreshAll();
  };

  const filterByIp = (ip: string) => {
    setTrafficIpFilter(ip);
    setTrafficPage(1);
    setActiveTab("traffic");
  };

  if (loading) {
    return <VoipLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></VoipLayout>;
  }

  const hasActiveAlert = (dashboard?.recentAlerts?.length || 0) > 0;

  return (
    <VoipLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6" /> Security Monitor & WAF
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Traffic monitoring, threat detection, and IP management</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={refreshAll}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={handleCleanup}><Timer className="w-4 h-4 mr-1" /> Cleanup</Button>
            <Button variant="destructive" size="sm" onClick={() => handleClearLogs("all")}><Trash2 className="w-4 h-4 mr-1" /> Clear All Logs</Button>
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
                    <p className="font-bold text-destructive text-lg">🚨 Possible DDoS / Bot Attack Detected</p>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {dashboard?.recentAlerts?.slice(0, 3).map((a, i) => (
                        <p key={i}><CopyIpButton ip={a.ip_address} />{" → "}{a.endpoint} ({a.rule_triggered})</p>
                      ))}
                    </div>
                  </div>
                </div>
                {dashboard?.recentAlerts?.[0] && (
                  <Button size="sm" variant="destructive"
                    onClick={() => handleBlockIp(dashboard.recentAlerts[0].ip_address, "Auto-blocked from alert")}>
                    <Ban className="w-4 h-4 mr-1" /> Block Top IP
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Activity className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.totalRequests || 0}</p>
                <p className="text-xs text-muted-foreground">Requests (24h)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.suspiciousCount || 0}</p>
                <p className="text-xs text-muted-foreground">Suspicious Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10"><Ban className="w-5 h-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.blockedCount || 0}</p>
                <p className="text-xs text-muted-foreground">Blocked IPs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><Globe className="w-5 h-5 text-muted-foreground" /></div>
              <div className="flex-1 min-w-0">
                {dashboard?.topIPs?.[0] ? (
                  <div className="flex items-center gap-2">
                    <CopyIpButton ip={dashboard.topIPs[0].ip} />
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => filterByIp(dashboard.topIPs[0].ip)}>View Logs</Button>
                  </div>
                ) : (
                  <p className="text-sm font-mono font-bold text-foreground">None</p>
                )}
                <p className="text-xs text-muted-foreground">Top Traffic IP</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Logs</TabsTrigger>
            <TabsTrigger value="blocks">Blocked IPs</TabsTrigger>
            <TabsTrigger value="waf">WAF Rules</TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW TAB ────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Traffic Timeline */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Traffic Timeline (Last Hour)</CardTitle></CardHeader>
              <CardContent>
                {(dashboard?.timeline?.length || 0) > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboard?.timeline || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                        <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Total" />
                        <Area type="monotone" dataKey="suspicious" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.2)" name="Suspicious" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No traffic data recorded yet. Activity will appear here once requests are logged.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top IPs */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Top IPs (24h)</CardTitle></CardHeader>
                <CardContent>
                  {(dashboard?.topIPs?.length || 0) > 0 ? (
                    <div className="space-y-2">
                      {dashboard?.topIPs?.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/30">
                          <CopyIpButton ip={entry.ip} />
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{entry.count} req</Badge>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => filterByIp(entry.ip)}>View</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No IP data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Security Alerts */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Recent Security Alerts</CardTitle></CardHeader>
                <CardContent>
                  {(dashboard?.recentAlerts?.length || 0) > 0 ? (
                    <div className="space-y-2">
                      {dashboard?.recentAlerts?.map((alert, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-destructive/5 border border-destructive/10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <CopyIpButton ip={alert.ip_address} />
                              <Badge variant="destructive" className="text-[10px]">{alert.rule_triggered}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.endpoint} — {formatTime(alert.timestamp)}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="flex-shrink-0 h-7 text-xs" onClick={() => filterByIp(alert.ip_address)}>View</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No security alerts — all clear 🛡️</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── TRAFFIC LOGS TAB ─────────────────────────── */}
          <TabsContent value="traffic" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    Traffic Logs
                    {liveMode && <span className="flex items-center gap-1 text-xs text-destructive"><Radio className="w-3 h-3 animate-pulse" /> LIVE</span>}
                  </CardTitle>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Live</span>
                      <Switch checked={liveMode} onCheckedChange={setLiveMode} />
                    </div>
                    <Select value={trafficFilter} onValueChange={(v) => { setTrafficFilter(v); setTrafficPage(1); }}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="suspicious">Suspicious</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Filter by IP" value={trafficIpFilter} onChange={(e) => { setTrafficIpFilter(e.target.value); setTrafficPage(1); }}
                      className="w-[140px] h-9 text-xs" />
                    <Input placeholder="Endpoint" value={trafficEndpointFilter} onChange={(e) => { setTrafficEndpointFilter(e.target.value); setTrafficPage(1); }}
                      className="w-[120px] h-9 text-xs" />
                    {(trafficIpFilter || trafficEndpointFilter || trafficFilter !== "all") && (
                      <Button variant="ghost" size="sm" onClick={() => { setTrafficIpFilter(""); setTrafficEndpointFilter(""); setTrafficFilter("all"); setTrafficPage(1); }}>Clear</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">Time</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">IP</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium hidden md:table-cell">Method</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">Endpoint</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium hidden md:table-cell">Status</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium hidden lg:table-cell">Latency</th>
                        <th className="pb-2 pr-3 text-muted-foreground font-medium">Rule</th>
                        <th className="pb-2 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trafficLogs.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No logs found</td></tr>
                      ) : trafficLogs.map((log) => (
                        <tr key={log.id} className={`border-b border-border/50 hover:bg-muted/30 ${log.is_suspicious ? "bg-destructive/5" : ""} ${log.is_blocked ? "bg-muted/20 opacity-60" : ""}`}>
                          <td className="py-2 pr-3 text-xs whitespace-nowrap">{formatTime(log.timestamp)}</td>
                          <td className="py-2 pr-3"><CopyIpButton ip={log.ip_address || "—"} /></td>
                          <td className="py-2 pr-3 text-xs hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{log.method}</Badge></td>
                          <td className="py-2 pr-3 text-xs truncate max-w-[150px]">{log.path}</td>
                          <td className="py-2 pr-3 text-xs hidden md:table-cell">{log.status_code || "—"}</td>
                          <td className="py-2 pr-3 text-xs hidden lg:table-cell">{log.response_ms ? `${log.response_ms}ms` : "—"}</td>
                          <td className="py-2 pr-3">
                            {log.is_suspicious ? <Badge variant="destructive" className="text-[10px]">{log.rule_triggered || "Suspicious"}</Badge>
                              : log.is_blocked ? <Badge className="bg-destructive/80 text-destructive-foreground text-[10px]">Blocked</Badge>
                              : log.rule_triggered ? <Badge variant="secondary" className="text-[10px]">{log.rule_triggered}</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2">
                            {(log.is_suspicious || log.rule_triggered) && log.ip_address && (
                              <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2"
                                onClick={() => handleBlockIp(log.ip_address, `Blocked from log #${log.id}`)}>
                                <Ban className="w-3 h-3 mr-1" /> Block
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {trafficTotal > 40 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground">Page {trafficPage} of {Math.ceil(trafficTotal / 40)}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={trafficPage <= 1} onClick={() => setTrafficPage(p => p - 1)}>Previous</Button>
                      <Button size="sm" variant="outline" disabled={trafficPage >= Math.ceil(trafficTotal / 40)} onClick={() => setTrafficPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BLOCKED IPS TAB ──────────────────────────── */}
          <TabsContent value="blocks" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Block IP Form */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Ban className="w-4 h-4" /> Block IP</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="IP Address (e.g. 192.168.1.1)" value={blockIpInput} onChange={(e) => setBlockIpInput(e.target.value)} />
                  <Input placeholder="Reason (optional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={blockDuration} onValueChange={setBlockDuration}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5min">5 Minutes</SelectItem>
                        <SelectItem value="15min">15 Minutes</SelectItem>
                        <SelectItem value="1hour">1 Hour</SelectItem>
                        <SelectItem value="24hours">24 Hours</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={blockScope} onValueChange={setBlockScope}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Block Entire Site</SelectItem>
                        <SelectItem value="sensitive_only">Sensitive Routes Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" variant="destructive" onClick={() => handleBlockIp()} disabled={!blockIpInput.trim()}>
                    <Ban className="w-4 h-4 mr-1" /> Confirm Block
                  </Button>
                </CardContent>
              </Card>

              {/* Active Blocks List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Active Blocks ({blockedIps.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {blockedIps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No blocked IPs</p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {blockedIps.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 gap-2">
                          <div className="min-w-0 flex-1">
                            <CopyIpButton ip={b.ip_address} />
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{b.reason}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <CountdownTimer expiresAt={b.expires_at} />
                              <Badge variant="outline" className="text-[10px]">{b.scope === "sensitive_only" ? "Sensitive" : "Full"}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{b.created_by_type}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={() => handleUnblock(b.id)}>
                            <Unlock className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── WAF RULES TAB ────────────────────────────── */}
          <TabsContent value="waf" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Settings2 className="w-4 h-4" /> WAF Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wafRules.map((rule) => (
                    <div key={rule.id} className={`p-4 rounded-lg border ${rule.enabled ? "border-border" : "border-border/50 opacity-60"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">{rule.name}</p>
                            <Badge variant="outline" className="text-[10px]">{rule.rule_type}</Badge>
                            <Badge variant={rule.scope === "sensitive_only" ? "destructive" : "secondary"} className="text-[10px]">{rule.scope}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            &gt; {rule.max_requests} req / {rule.time_window_seconds}s → block {rule.block_duration_minutes}m
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => setEditingRule(editingRule?.id === rule.id ? null : { ...rule })}>
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Switch checked={rule.enabled} onCheckedChange={() => handleToggleRule(rule)} />
                        </div>
                      </div>

                      {/* Inline editor */}
                      {editingRule?.id === rule.id && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Max Requests</label>
                              <Input type="number" value={editingRule.max_requests}
                                onChange={(e) => setEditingRule({ ...editingRule, max_requests: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Window (seconds)</label>
                              <Input type="number" value={editingRule.time_window_seconds}
                                onChange={(e) => setEditingRule({ ...editingRule, time_window_seconds: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Block (minutes)</label>
                              <Input type="number" value={editingRule.block_duration_minutes}
                                onChange={(e) => setEditingRule({ ...editingRule, block_duration_minutes: parseInt(e.target.value) || 0 })} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveRule}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingRule(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
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
