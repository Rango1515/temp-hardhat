import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// Sensitive endpoints that trigger endpoint_abuse detection
const SENSITIVE_ENDPOINTS = ["voip-leads", "voip-auth", "voip-admin", "voip-admin-ext"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── log-request (available to all authenticated users) ──────────────
    if (action === "log-request" && req.method === "POST") {
      const body = await req.json();
      const { endpoint, method: reqMethod, userAgent, isFailedLogin } = body;

      // Extract IP from headers (forwarded by edge proxy)
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        "unknown";

      // Check if IP is currently blocked
      const { data: blocked } = await supabase
        .from("voip_blocked_ips")
        .select("id")
        .eq("ip_address", ip)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .limit(1);

      if (blocked && blocked.length > 0) {
        // Still log it as blocked
        await supabase.from("voip_security_logs").insert({
          ip_address: ip,
          endpoint: endpoint || "unknown",
          user_agent: userAgent || null,
          status: "blocked",
          user_id: userId,
          rule_triggered: "ip_blocked",
          details: { method: reqMethod },
        });
        return new Response(
          JSON.stringify({ status: "blocked" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Detection Rule 1: Rate flooding (>50 requests from same IP in 10s)
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      const { count: recentCount } = await supabase
        .from("voip_security_logs")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("timestamp", tenSecondsAgo);

      let status = "normal";
      let ruleTriggered: string | null = null;

      if ((recentCount || 0) > 50) {
        status = "suspicious";
        ruleTriggered = "rate_flood";
        console.warn(`[SECURITY] Rate flood detected from IP ${ip}: ${recentCount} requests in 10s`);
      }

      // ── Detection Rule 2: Brute force (>10 failed logins in 1 min)
      if (!ruleTriggered && isFailedLogin) {
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
        const { count: failedCount } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("ip_address", ip)
          .gte("timestamp", oneMinuteAgo)
          .eq("rule_triggered", "failed_login");

        if ((failedCount || 0) > 10) {
          status = "suspicious";
          ruleTriggered = "brute_force";
          console.warn(`[SECURITY] Brute force detected from IP ${ip}: ${failedCount} failed logins in 1min`);
        } else {
          ruleTriggered = "failed_login";
        }
      }

      // ── Detection Rule 3: Endpoint abuse (sensitive routes >20 in 30s)
      if (!ruleTriggered && endpoint && SENSITIVE_ENDPOINTS.some(e => endpoint.includes(e))) {
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
        const { count: sensitiveCount } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("ip_address", ip)
          .gte("timestamp", thirtySecondsAgo)
          .in("endpoint", SENSITIVE_ENDPOINTS.map(e => endpoint.includes(e) ? endpoint : null).filter(Boolean));

        if ((sensitiveCount || 0) > 20) {
          status = "suspicious";
          ruleTriggered = "endpoint_abuse";
          console.warn(`[SECURITY] Endpoint abuse from IP ${ip} on ${endpoint}`);
        }
      }

      // Insert the log entry
      await supabase.from("voip_security_logs").insert({
        ip_address: ip,
        endpoint: endpoint || "unknown",
        user_agent: userAgent || null,
        status,
        user_id: userId,
        rule_triggered: ruleTriggered,
        details: { method: reqMethod },
      });

      return new Response(
        JSON.stringify({ status, rule: ruleTriggered }),
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

        // Total requests (24h)
        const { count: totalRequests } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .gte("timestamp", twentyFourHoursAgo);

        // Suspicious events (24h)
        const { count: suspiciousCount } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "suspicious")
          .gte("timestamp", twentyFourHoursAgo);

        // Active blocked IPs
        const { count: blockedCount } = await supabase
          .from("voip_blocked_ips")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Active alerts (suspicious in last 5 min)
        const { data: recentAlerts } = await supabase
          .from("voip_security_logs")
          .select("ip_address, endpoint, rule_triggered, timestamp")
          .eq("status", "suspicious")
          .gte("timestamp", fiveMinutesAgo)
          .order("timestamp", { ascending: false })
          .limit(5);

        // Top offending IPs (by volume, last 24h)
        const { data: allLogs24h } = await supabase
          .from("voip_security_logs")
          .select("ip_address")
          .gte("timestamp", twentyFourHoursAgo)
          .limit(1000);

        const ipCounts: Record<string, number> = {};
        (allLogs24h || []).forEach((l) => {
          if (l.ip_address) ipCounts[l.ip_address] = (ipCounts[l.ip_address] || 0) + 1;
        });
        const topIPs = Object.entries(ipCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([ip, count]) => ({ ip, count }));

        // Recent suspicious events
        const { data: recentSuspicious } = await supabase
          .from("voip_security_logs")
          .select("*")
          .eq("status", "suspicious")
          .order("timestamp", { ascending: false })
          .limit(20);

        // Attack timeline (requests per minute, last hour)
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { data: timelineLogs } = await supabase
          .from("voip_security_logs")
          .select("timestamp, status")
          .gte("timestamp", oneHourAgo)
          .order("timestamp", { ascending: true })
          .limit(1000);

        const timeline: Record<string, { total: number; suspicious: number }> = {};
        (timelineLogs || []).forEach((l) => {
          const minute = l.timestamp.slice(0, 16); // YYYY-MM-DDTHH:MM
          if (!timeline[minute]) timeline[minute] = { total: 0, suspicious: 0 };
          timeline[minute].total++;
          if (l.status === "suspicious") timeline[minute].suspicious++;
        });
        const timelineArray = Object.entries(timeline).map(([time, data]) => ({
          time: time.split("T")[1] || time, // Just HH:MM
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
            recentSuspicious: recentSuspicious || [],
            timeline: timelineArray,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Paginated logs ──────────────────────────────────
      case "logs": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const statusFilter = url.searchParams.get("status");
        const ipFilter = url.searchParams.get("ip");
        const offset = (page - 1) * limit;

        let query = supabase
          .from("voip_security_logs")
          .select("*", { count: "exact" });

        if (statusFilter && statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }
        if (ipFilter) {
          query = query.eq("ip_address", ipFilter);
        }

        const { data: logs, count, error } = await query
          .order("timestamp", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            logs: logs || [],
            pagination: { page, limit, total: count || 0 },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Block IP ────────────────────────────────────────
      case "block-ip": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { ip, reason, duration } = await req.json();
        if (!ip) {
          return new Response(
            JSON.stringify({ error: "IP address is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate expiry
        let expiresAt: string | null = null;
        if (duration === "15min") expiresAt = new Date(Date.now() + 900000).toISOString();
        else if (duration === "1hour") expiresAt = new Date(Date.now() + 3600000).toISOString();
        else if (duration === "24hours") expiresAt = new Date(Date.now() + 86400000).toISOString();
        // else permanent (null)

        const { error } = await supabase.from("voip_blocked_ips").insert({
          ip_address: ip,
          reason: reason || "Manually blocked by admin",
          blocked_by: userId,
          expires_at: expiresAt,
          status: "active",
        });

        if (error) throw error;

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "block_ip",
          entity_type: "security",
          details: { ip, reason, duration, expires_at: expiresAt },
        });

        console.log(`[SECURITY] IP ${ip} blocked by admin ${userId} for ${duration || "permanent"}`);

        return new Response(
          JSON.stringify({ message: `IP ${ip} blocked successfully` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Unblock IP ──────────────────────────────────────
      case "unblock-ip": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { id: blockId } = await req.json();
        if (!blockId) {
          return new Response(
            JSON.stringify({ error: "Block ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_blocked_ips")
          .update({ status: "manual_unblock" })
          .eq("id", blockId);

        if (error) throw error;

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "unblock_ip",
          entity_type: "security",
          details: { block_id: blockId },
        });

        return new Response(
          JSON.stringify({ message: "IP unblocked successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── List blocked IPs ────────────────────────────────
      case "blocked-ips": {
        // Expire old blocks first
        await supabase
          .from("voip_blocked_ips")
          .update({ status: "expired" })
          .eq("status", "active")
          .lt("expires_at", new Date().toISOString())
          .not("expires_at", "is", null);

        const { data: blockedIps, error } = await supabase
          .from("voip_blocked_ips")
          .select("*")
          .eq("status", "active")
          .order("blocked_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ blockedIps: blockedIps || [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Clear logs ──────────────────────────────────────
      case "clear-logs": {
        if (req.method !== "DELETE") {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_security_logs")
          .delete()
          .gte("id", 0);

        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "clear_security_logs",
          entity_type: "security",
          details: {},
        });

        return new Response(
          JSON.stringify({ message: "Security logs cleared" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Suspicious count (for sidebar badge) ────────────
      case "suspicious-count": {
        const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
        const { count } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "suspicious")
          .gte("timestamp", fiveMinAgo);

        return new Response(
          JSON.stringify({ count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[voip-security] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
