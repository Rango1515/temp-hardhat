import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// ── In-memory rate counter (per-isolate, resets on cold start) ──────────────
// Map<ip, Array<timestamp_ms>>
const ipHits: Map<string, number[]> = new Map();
const SENSITIVE_ENDPOINTS = ["voip-leads", "voip-auth", "voip-admin", "voip-admin-ext", "voip-leads-ext"];

// Prune entries older than 2 minutes
function pruneHits(ip: string) {
  const hits = ipHits.get(ip);
  if (!hits) return;
  const cutoff = Date.now() - 120_000;
  const pruned = hits.filter(t => t > cutoff);
  if (pruned.length === 0) ipHits.delete(ip);
  else ipHits.set(ip, pruned);
}

function countHitsInWindow(ip: string, windowMs: number): number {
  const hits = ipHits.get(ip);
  if (!hits) return 0;
  const cutoff = Date.now() - windowMs;
  return hits.filter(t => t > cutoff).length;
}

function recordHit(ip: string) {
  pruneHits(ip);
  const hits = ipHits.get(ip) || [];
  hits.push(Date.now());
  ipHits.set(ip, hits);
}

// Cache WAF rules (refresh every 60s)
interface WafRule {
  id: number;
  name: string;
  rule_type: string;
  max_requests: number;
  time_window_seconds: number;
  block_duration_minutes: number;
  target_endpoints: string[] | null;
  scope: string;
  enabled: boolean;
}
let cachedRules: WafRule[] = [];
let rulesLastFetched = 0;

async function getWafRules(): Promise<WafRule[]> {
  if (Date.now() - rulesLastFetched < 60_000 && cachedRules.length > 0) {
    return cachedRules;
  }
  const { data } = await supabase
    .from("voip_waf_rules")
    .select("*")
    .eq("enabled", true);
  cachedRules = (data || []) as WafRule[];
  rulesLastFetched = Date.now();
  return cachedRules;
}

// Cache blocked IPs (refresh every 10s)
let blockedIpCache: Set<string> = new Set();
let blockedCacheTime = 0;

async function isIpBlocked(ip: string): Promise<boolean> {
  if (Date.now() - blockedCacheTime < 10_000) {
    return blockedIpCache.has(ip);
  }
  // Expire old blocks
  await supabase
    .from("voip_blocked_ips")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expires_at", new Date().toISOString())
    .not("expires_at", "is", null);

  const { data } = await supabase
    .from("voip_blocked_ips")
    .select("ip_address")
    .eq("status", "active");
  blockedIpCache = new Set((data || []).map(d => d.ip_address));
  blockedCacheTime = Date.now();
  return blockedIpCache.has(ip);
}

function extractIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Sampling: log ~1 in N requests for normal traffic (random-based for multi-isolate)
const SAMPLE_RATE = 5;
function shouldSample(): boolean {
  return Math.random() < (1 / SAMPLE_RATE);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ── Public endpoint: log-public (no auth required) ──────────────────
  // This allows public pages (home, demos, etc.) to log visits + enforce WAF
  if (action === "log-public" && req.method === "POST") {
    try {
      const body = await req.json();
      const { page, referrer, userAgent: ua, hostname: clientHostname } = body;
      const ip = extractIp(req);

      // Fast block check
      const blocked = await isIpBlocked(ip);
      if (blocked) {
        return new Response(
          JSON.stringify({ status: "blocked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Record hit in memory for WAF
      recordHit(ip);

      // Check WAF rules (public pages are NOT sensitive)
      const rules = await getWafRules();
      let triggered: WafRule | null = null;

      for (const rule of rules) {
        if (rule.scope === "sensitive_only") continue;
        if (rule.rule_type === "brute_force") continue;

        const hitCount = countHitsInWindow(ip, rule.time_window_seconds * 1000);
        if (hitCount > rule.max_requests) {
          triggered = rule;
          break;
        }
      }

      let actionTaken: string | null = null;

      if (triggered) {
        actionTaken = "auto_blocked";
        const expiresAt = new Date(Date.now() + triggered.block_duration_minutes * 60_000).toISOString();
        await supabase.from("voip_blocked_ips").insert({
          ip_address: ip,
          reason: `WAF Rule: ${triggered.name} (public page flood)`,
          blocked_by: null,
          expires_at: expiresAt,
          status: "active",
          rule_id: triggered.id,
          scope: triggered.scope,
          created_by_type: "system",
        });
        blockedCacheTime = 0;

        await supabase.from("voip_security_logs").insert({
          ip_address: ip,
          endpoint: page || "/",
          user_agent: ua || null,
          status: "suspicious",
          rule_triggered: triggered.name,
          details: { source: "public_page", auto_blocked: true },
        });
      }

      // Always log public page visits (they're infrequent compared to API calls)
      // Store hostname in referer column to distinguish production vs preview traffic
      const { error: insertErr } = await supabase.from("voip_request_logs").insert({
        ip_address: ip,
        method: "GET",
        path: page || "/",
        status_code: 200,
        user_agent: ua || null,
        referer: clientHostname || referrer || null,
        is_suspicious: !!triggered,
        is_blocked: false,
        rule_triggered: triggered?.name || null,
        action_taken: actionTaken,
      });
      if (insertErr) console.error("[WAF] Public log insert error:", JSON.stringify(insertErr));

      return new Response(
        JSON.stringify({ status: triggered ? "blocked" : "ok" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("[WAF] Public log error:", e);
      return new Response(
        JSON.stringify({ status: "ok" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // ── Authenticated endpoints below ──────────────────────────────────────
  const token = extractToken(req.headers.get("Authorization"));
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Authorization required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = parseInt(payload.sub);

  try {
    // ── log-request (available to all authenticated users) ──────────────
    if (action === "log-request" && req.method === "POST") {
      const body = await req.json();
      const { endpoint, method: reqMethod, userAgent, isFailedLogin, statusCode, responseMs } = body;
      const ip = extractIp(req);

      // Fast in-memory block check
      const blocked = await isIpBlocked(ip);
      if (blocked) {
        // Minimal log for blocked traffic
        if (shouldSample()) {
          const { error: blkErr } = await supabase.from("voip_request_logs").insert({
            ip_address: ip,
            method: reqMethod || "GET",
            path: endpoint || "unknown",
            status_code: 403,
            user_agent: userAgent,
            user_id: userId,
            is_blocked: true,
            action_taken: "blocked",
          });
          if (blkErr) console.error("[WAF] Blocked log insert error:", blkErr);
        }
        return new Response(
          JSON.stringify({ status: "blocked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Record hit in memory
      recordHit(ip);

      // Check WAF rules
      const rules = await getWafRules();
      let triggered: WafRule | null = null;
      const isSensitive = SENSITIVE_ENDPOINTS.some(e => (endpoint || "").includes(e));

      for (const rule of rules) {
        if (rule.scope === "sensitive_only" && !isSensitive) continue;
        if (rule.rule_type === "brute_force" && !isFailedLogin) continue;

        const hitCount = countHitsInWindow(ip, rule.time_window_seconds * 1000);
        if (hitCount > rule.max_requests) {
          triggered = rule;
          break;
        }
      }

      let logStatus = "normal";
      let actionTaken: string | null = null;

      if (triggered) {
        logStatus = "suspicious";
        actionTaken = "auto_blocked";

        // Auto-block the IP
        const expiresAt = new Date(Date.now() + triggered.block_duration_minutes * 60_000).toISOString();
        await supabase.from("voip_blocked_ips").insert({
          ip_address: ip,
          reason: `WAF Rule: ${triggered.name} (${countHitsInWindow(ip, triggered.time_window_seconds * 1000)} requests in ${triggered.time_window_seconds}s)`,
          blocked_by: null,
          expires_at: expiresAt,
          status: "active",
          rule_id: triggered.id,
          scope: triggered.scope,
          created_by_type: "system",
        });

        // Invalidate cache
        blockedCacheTime = 0;

        // Also log to security_logs for the alert banner
        await supabase.from("voip_security_logs").insert({
          ip_address: ip,
          endpoint: endpoint || "unknown",
          user_agent: userAgent,
          status: "suspicious",
          user_id: userId,
          rule_triggered: triggered.name,
          details: { method: reqMethod, rule_id: triggered.id, auto_blocked: true },
        });

        console.warn(`[WAF] IP ${ip} auto-blocked by rule "${triggered.name}" for ${triggered.block_duration_minutes}m`);
      }

      // Sampled logging: always log suspicious, sample normal
      const shouldLog = triggered || isFailedLogin || shouldSample();

      if (shouldLog) {
        const { error: logErr } = await supabase.from("voip_request_logs").insert({
          ip_address: ip,
          method: reqMethod || "GET",
          path: endpoint || "unknown",
          status_code: statusCode || 200,
          response_ms: responseMs || null,
          user_agent: userAgent,
          user_id: userId,
          is_suspicious: !!triggered,
          is_blocked: false,
          rule_triggered: triggered?.name || (isFailedLogin ? "failed_login" : null),
          action_taken: actionTaken,
        });
        if (logErr) console.error("[WAF] Log insert failed:", logErr);
      }

      return new Response(
        JSON.stringify({ status: logStatus, rule: triggered?.name || null, blocked: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Admin-only actions below ──────────────────────────────────────────
    if (payload.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      // ── Dashboard stats ─────────────────────────────────
      case "dashboard": {
        const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
        const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();

        const { count: totalRequests } = await supabase
          .from("voip_request_logs")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", twentyFourHoursAgo);

        const { count: suspiciousCount } = await supabase
          .from("voip_request_logs")
          .select("*", { count: "exact", head: true })
          .eq("is_suspicious", true)
          .gte("timestamp", twentyFourHoursAgo);

        const { count: blockedCount } = await supabase
          .from("voip_blocked_ips")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Active alerts (suspicious in last 5 min from security_logs)
        const { data: recentAlerts } = await supabase
          .from("voip_security_logs")
          .select("ip_address, endpoint, rule_triggered, timestamp")
          .eq("status", "suspicious")
          .gte("timestamp", fiveMinutesAgo)
          .order("timestamp", { ascending: false })
          .limit(5);

        // Top IPs (last 24h)
        const { data: allLogs24h } = await supabase
          .from("voip_request_logs")
          .select("ip_address")
          .gte("timestamp", twentyFourHoursAgo)
          .limit(1000);

        const ipCounts: Record<string, number> = {};
        (allLogs24h || []).forEach(l => {
          if (l.ip_address) ipCounts[l.ip_address] = (ipCounts[l.ip_address] || 0) + 1;
        });
        const topIPs = Object.entries(ipCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ip, count]) => ({ ip, count }));

        // Timeline (last hour)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { data: timelineLogs } = await supabase
          .from("voip_request_logs")
          .select("timestamp, is_suspicious")
          .gte("timestamp", oneHourAgo)
          .order("timestamp", { ascending: true })
          .limit(1000);

        const timeline: Record<string, { total: number; suspicious: number }> = {};
        (timelineLogs || []).forEach(l => {
          const minute = l.timestamp.slice(0, 16);
          if (!timeline[minute]) timeline[minute] = { total: 0, suspicious: 0 };
          timeline[minute].total++;
          if (l.is_suspicious) timeline[minute].suspicious++;
        });
        const timelineArray = Object.entries(timeline).map(([time, data]) => ({
          time: time.split("T")[1] || time,
          total: data.total,
          suspicious: data.suspicious,
        }));

        return new Response(
          JSON.stringify({
            totalRequests: totalRequests || 0,
            suspiciousCount: suspiciousCount || 0,
            blockedCount: blockedCount || 0,
            topIPs,
            recentAlerts: recentAlerts || [],
            timeline: timelineArray,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Traffic logs (paginated) ────────────────────────
      case "traffic-logs": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const statusFilter = url.searchParams.get("status");
        const ipFilter = url.searchParams.get("ip");
        const endpointFilter = url.searchParams.get("endpoint");
        const offset = (page - 1) * limit;

        let query = supabase.from("voip_request_logs").select("*", { count: "exact" });

        if (statusFilter === "suspicious") query = query.eq("is_suspicious", true);
        else if (statusFilter === "blocked") query = query.eq("is_blocked", true);
        if (ipFilter) query = query.eq("ip_address", ipFilter);
        if (endpointFilter) query = query.ilike("path", `%${endpointFilter.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`);

        const { data: logs, count, error } = await query
          .order("timestamp", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({ logs: logs || [], pagination: { page, limit, total: count || 0 } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Security logs (legacy, for alert details) ───────
      case "logs": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const statusFilter = url.searchParams.get("status");
        const ipFilter = url.searchParams.get("ip");
        const offset = (page - 1) * limit;

        let query = supabase.from("voip_security_logs").select("*", { count: "exact" });
        if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
        if (ipFilter) query = query.eq("ip_address", ipFilter);

        const { data: logs, count, error } = await query
          .order("timestamp", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({ logs: logs || [], pagination: { page, limit, total: count || 0 } }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── WAF rules CRUD ──────────────────────────────────
      case "waf-rules": {
        if (req.method === "GET") {
          const { data, error } = await supabase
            .from("voip_waf_rules")
            .select("*")
            .order("id", { ascending: true });
          if (error) throw error;
          return new Response(
            JSON.stringify({ rules: data || [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const ruleId = url.searchParams.get("id");
          if (!ruleId) {
            return new Response(JSON.stringify({ error: "Rule ID required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const updates = await req.json();
          const allowed = ["name", "description", "max_requests", "time_window_seconds",
            "block_duration_minutes", "scope", "enabled", "target_endpoints"];
          const filtered: Record<string, unknown> = { updated_at: new Date().toISOString() };
          for (const key of allowed) {
            if (key in updates) filtered[key] = updates[key];
          }
          const { error } = await supabase.from("voip_waf_rules").update(filtered).eq("id", parseInt(ruleId));
          if (error) throw error;
          rulesLastFetched = 0; // invalidate cache
          return new Response(JSON.stringify({ message: "Rule updated" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { error } = await supabase.from("voip_waf_rules").insert({
            name: body.name,
            description: body.description || null,
            rule_type: body.rule_type || "rate_limit",
            max_requests: body.max_requests || 60,
            time_window_seconds: body.time_window_seconds || 10,
            block_duration_minutes: body.block_duration_minutes || 15,
            scope: body.scope || "all",
            target_endpoints: body.target_endpoints || null,
          });
          if (error) throw error;
          rulesLastFetched = 0;
          return new Response(JSON.stringify({ message: "Rule created" }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "DELETE") {
          const ruleId = url.searchParams.get("id");
          if (!ruleId) {
            return new Response(JSON.stringify({ error: "Rule ID required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const { error } = await supabase.from("voip_waf_rules").delete().eq("id", parseInt(ruleId));
          if (error) throw error;
          rulesLastFetched = 0;
          return new Response(JSON.stringify({ message: "Rule deleted" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        break;
      }

      // ── Block IP ────────────────────────────────────────
      case "block-ip": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { ip, reason, duration, scope: blockScope } = await req.json();
        if (!ip) {
          return new Response(JSON.stringify({ error: "IP address is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        let expiresAt: string | null = null;
        if (duration === "5min") expiresAt = new Date(Date.now() + 300000).toISOString();
        else if (duration === "15min") expiresAt = new Date(Date.now() + 900000).toISOString();
        else if (duration === "1hour") expiresAt = new Date(Date.now() + 3600000).toISOString();
        else if (duration === "24hours") expiresAt = new Date(Date.now() + 86400000).toISOString();

        const { error } = await supabase.from("voip_blocked_ips").insert({
          ip_address: ip,
          reason: reason || "Manually blocked by admin",
          blocked_by: userId,
          expires_at: expiresAt,
          status: "active",
          scope: blockScope || "all",
          created_by_type: "admin",
        });
        if (error) throw error;
        blockedCacheTime = 0; // invalidate

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "block_ip",
          entity_type: "security",
          details: { ip, reason, duration, scope: blockScope },
        });

        console.log(`[WAF] IP ${ip} manually blocked by admin ${userId}`);

        return new Response(JSON.stringify({ message: `IP ${ip} blocked` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Unblock IP ──────────────────────────────────────
      case "unblock-ip": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { id: blockId } = await req.json();
        if (!blockId) {
          return new Response(JSON.stringify({ error: "Block ID required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { error } = await supabase.from("voip_blocked_ips")
          .update({ status: "manual_unblock" }).eq("id", blockId);
        if (error) throw error;
        blockedCacheTime = 0;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId, action: "unblock_ip", entity_type: "security", details: { block_id: blockId },
        });

        return new Response(JSON.stringify({ message: "IP unblocked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── List blocked IPs ────────────────────────────────
      case "blocked-ips": {
        await supabase.from("voip_blocked_ips")
          .update({ status: "expired" })
          .eq("status", "active")
          .lt("expires_at", new Date().toISOString())
          .not("expires_at", "is", null);

        const { data, error } = await supabase.from("voip_blocked_ips")
          .select("*").eq("status", "active").order("blocked_at", { ascending: false });
        if (error) throw error;

        return new Response(JSON.stringify({ blockedIps: data || [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Clear logs ──────────────────────────────────────
      case "clear-logs": {
        if (req.method !== "DELETE") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const target = url.searchParams.get("target") || "all";
        if (target === "traffic" || target === "all") {
          await supabase.from("voip_request_logs").delete().gte("id", 0);
        }
        if (target === "security" || target === "all") {
          await supabase.from("voip_security_logs").delete().gte("id", 0);
        }

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId, action: "clear_security_logs", entity_type: "security", details: { target },
        });

        return new Response(JSON.stringify({ message: "Logs cleared" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Suspicious count (sidebar badge) ────────────────
      case "suspicious-count": {
        const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
        const { count } = await supabase.from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "suspicious").gte("timestamp", fiveMinAgo);

        return new Response(JSON.stringify({ count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Retention cleanup ───────────────────────────────
      case "cleanup": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Keep detailed logs 7 days, security_logs 30 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

        await supabase.from("voip_request_logs").delete().lt("timestamp", sevenDaysAgo);
        await supabase.from("voip_security_logs").delete().lt("timestamp", thirtyDaysAgo);
        await supabase.from("voip_blocked_ips").delete()
          .neq("status", "active").lt("created_at", thirtyDaysAgo);

        return new Response(JSON.stringify({ message: "Cleanup completed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[voip-security] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
