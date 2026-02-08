import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// ── In-memory rate counter (per-isolate, resets on cold start) ──────────────
// Map<ip, Array<timestamp_ms>>
const ipHits: Map<string, number[]> = new Map();
const SENSITIVE_ENDPOINTS = ["voip-leads", "voip-auth", "voip-admin", "voip-admin-ext", "voip-leads-ext"];

// ── Discord alert throttle ──────────────────────────────────────────────────
// DB-backed throttle: stores last alert time in voip_app_config to survive cold starts
// Key format: "discord_alert_{ip}" → timestamp ISO string
const DISCORD_THROTTLE_MS = 2 * 60 * 1000; // 2 minute cooldown per IP
// ── DDoS detection (multiple unique IPs blocked in short window) ────────────
// Track recently blocked IPs within a rolling window
const recentBlockedIps: Map<string, number> = new Map(); // ip -> timestamp
const DDOS_WINDOW_MS = 60_000; // 1-minute window
const DDOS_IP_THRESHOLD = 5; // 5+ unique IPs blocked in 1 minute = DDoS
const DDOS_ALERT_COOLDOWN_MS = 600_000; // 10 minute buffer between DDoS Discord alerts
let lastDdosAlertTime = 0; // In-memory DDoS alert cooldown for cloudflare-ddos-discord endpoint

// ── Fingerprint tracking (IP + User-Agent combo) ────────────────────────────
// Map<fingerprint, Array<timestamp_ms>>
const fingerprintHits: Map<string, number[]> = new Map();
function buildFingerprint(ip: string, ua: string | null): string {
  return `${ip}::${(ua || "unknown").slice(0, 80)}`;
}

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

function recordHit(ip: string, ua: string | null = null) {
  pruneHits(ip);
  const now = Date.now();
  const hits = ipHits.get(ip) || [];
  hits.push(now);
  ipHits.set(ip, hits);

  // Also record fingerprint hit
  if (ua) {
    const fp = buildFingerprint(ip, ua);
    const fpHits = fingerprintHits.get(fp) || [];
    const cutoff = now - 120_000;
    const pruned = fpHits.filter(t => t > cutoff);
    pruned.push(now);
    fingerprintHits.set(fp, pruned);

    // Prune old fingerprints every ~100 recordings
    if (fingerprintHits.size > 500) {
      for (const [k, v] of fingerprintHits.entries()) {
        const fresh = v.filter(t => t > cutoff);
        if (fresh.length === 0) fingerprintHits.delete(k);
        else fingerprintHits.set(k, fresh);
      }
    }
  }
}

function countFingerprintHitsInWindow(fp: string, windowMs: number): number {
  const hits = fingerprintHits.get(fp);
  if (!hits) return 0;
  const cutoff = Date.now() - windowMs;
  return hits.filter(t => t > cutoff).length;
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

// Cache whitelisted IPs (refresh every 30s)
let whitelistedIpCache: Set<string> = new Set();
let whitelistCacheTime = 0;

async function isIpWhitelisted(ip: string): Promise<boolean> {
  if (Date.now() - whitelistCacheTime < 30_000 && whitelistedIpCache.size > 0) {
    return whitelistedIpCache.has(ip);
  }
  const { data } = await supabase
    .from("voip_whitelisted_ips")
    .select("ip_address");
  whitelistedIpCache = new Set((data || []).map(d => d.ip_address));
  whitelistCacheTime = Date.now();
  return whitelistedIpCache.has(ip);
}

async function isIpBlocked(ip: string): Promise<boolean> {
  // Whitelisted IPs are NEVER blocked
  if (await isIpWhitelisted(ip)) return false;

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

// Sampling: log ~1 in N requests for normal traffic
const SAMPLE_RATE = 5;
function shouldSample(): boolean {
  return Math.random() < (1 / SAMPLE_RATE);
}

// Extract a clean rule slug from WAF reason strings like "WAF Rule: Rate Flood (escalated to 60m)"
function extractRuleSlug(reason: string): string {
  const match = reason.match(/WAF Rule:\s*([^(]+)/);
  if (match) {
    return match[1].trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
  }
  // Fallback: try the raw reason
  return reason.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "").slice(0, 30) || "unknown";
}

// ── DB-backed rate counting (cross-isolate accuracy) ────────────────────────
async function getDbHitCount(ip: string, windowSeconds: number): Promise<number> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await supabase
    .from("voip_request_logs")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("timestamp", since);
  return count || 0;
}

// ── Progressive block escalation (graduated ladder) ─────────────────────────
// Only counts EXPIRED blocks (not active/concurrent ones from the same burst)
// Ladder: 1m → 5m → 15m → 60m → 1440m (24h)
const ESCALATION_LADDER = [1, 5, 15, 60, 1440]; // minutes

async function getEscalatedDuration(ip: string, _baseDurationMinutes: number): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 86400000).toISOString();
  // Only count EXPIRED blocks — not active ones from the current burst
  const { count: priorExpiredBlocks } = await supabase
    .from("voip_blocked_ips")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("status", "expired")
    .gte("blocked_at", twentyFourHoursAgo);

  const step = Math.min(priorExpiredBlocks || 0, ESCALATION_LADDER.length - 1);
  return ESCALATION_LADDER[step];
}

// ── Prevent duplicate blocks from concurrent isolates ───────────────────────
async function hasActiveBlock(ip: string): Promise<boolean> {
  const { count } = await supabase
    .from("voip_blocked_ips")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  return (count || 0) > 0;
}

// ── Unified WAF check (DB-primary + in-memory fast path) ────────────────────
// NOTE: Edge function isolates cold-start on nearly every request, so in-memory
// counters are almost always 0-1. We MUST use DB counts as the primary method.
async function checkWafRules(
  ip: string,
  ua: string | null,
  isSensitive: boolean,
  isFailedLogin: boolean
): Promise<{ triggered: WafRule | null; ruleLabel: string | null }> {
  // Whitelisted IPs skip ALL WAF checks
  if (await isIpWhitelisted(ip)) {
    return { triggered: null, ruleLabel: null };
  }

  const rules = await getWafRules();
  let triggered: WafRule | null = null;
  let ruleLabel: string | null = null;

  for (const rule of rules) {
    if (rule.scope === "sensitive_only" && !isSensitive) continue;
    if (rule.rule_type === "brute_force" && !isFailedLogin) continue;

    const windowMs = rule.time_window_seconds * 1000;
    const memoryCount = countHitsInWindow(ip, windowMs);

    // Fast path: in-memory trigger (works when same isolate handles burst)
    if (memoryCount > rule.max_requests) {
      triggered = rule;
      ruleLabel = rule.name;
      break;
    }

    // Primary check: ALWAYS query DB for accurate cross-isolate counting
    // This is essential because cold starts reset in-memory counters
    const dbCount = await getDbHitCount(ip, rule.time_window_seconds);
    if (dbCount > rule.max_requests) {
      triggered = rule;
      ruleLabel = `${rule.name} (cross-isolate)`;
      break;
    }
  }

  // Fingerprint check: detect automated tools hitting faster than normal
  if (!triggered && ua) {
    const fp = buildFingerprint(ip, ua);
    const fpCount5s = countFingerprintHitsInWindow(fp, 5000);
    // If same fingerprint fires >30 requests in 5 seconds, it's an automated tool
    if (fpCount5s > 30) {
      // Find the most restrictive applicable rule
      const floodRule = rules.find(r => r.scope === "all" && r.rule_type === "rate_limit" && r.enabled);
      if (floodRule) {
        triggered = floodRule;
        ruleLabel = "automated_tool_detected";
      }
    }
  }

  return { triggered, ruleLabel };
}

// ── Discord webhook URL helper ───────────────────────────────────────────────
async function getDiscordWebhookUrl(): Promise<string | null> {
  // Try DB first (admin-configurable), fallback to env secret
  const { data } = await supabase
    .from("voip_app_config")
    .select("value")
    .eq("key", "discord_webhook_url")
    .maybeSingle();
  if (data?.value) return data.value;
  return Deno.env.get("DISCORD_WEBHOOK_URL") || null;
}

// ── Discord webhook alert (with DB-backed per-IP throttle) ──────────────────
async function sendDiscordAlert(
  ip: string,
  ruleLabel: string,
  durationMinutes: number,
  context: { endpoint?: string; ua?: string | null; source?: string },
  options?: { force?: boolean }
) {
  console.log(`[WAF-Discord] sendDiscordAlert called for IP ${ip}, rule: ${ruleLabel}, duration: ${durationMinutes}m, force: ${!!options?.force}`);

  // DB-backed throttle: check voip_app_config for last alert time (survives cold starts)
  const throttleKey = `discord_alert_${ip.replace(/[^a-zA-Z0-9._:-]/g, "_")}`;

  if (!options?.force) {
    try {
      const { data: existing, error: throttleErr } = await supabase
        .from("voip_app_config")
        .select("value, updated_at")
        .eq("key", throttleKey)
        .maybeSingle();

      if (throttleErr) {
        console.error(`[WAF-Discord] Throttle check failed:`, throttleErr);
      }

      if (existing) {
        const lastAlertMs = new Date(existing.updated_at).getTime();
        const elapsed = Date.now() - lastAlertMs;
        if (elapsed < DISCORD_THROTTLE_MS) {
          console.log(`[WAF-Discord] Alert throttled for IP ${ip} (last alert ${Math.round(elapsed / 1000)}s ago)`);
          return;
        }
      }
    } catch (e) {
      console.error(`[WAF-Discord] Throttle check error:`, e);
    }
  }

  const webhookUrl = await getDiscordWebhookUrl();
  if (!webhookUrl) {
    console.warn("[WAF-Discord] No webhook URL configured, skipping alert");
    return;
  }
  console.log(`[WAF-Discord] Webhook URL found, sending alert for IP ${ip}`);

  // Record this alert time in DB BEFORE sending (prevents concurrent isolate sends)
  try {
    const { error: upsertErr } = await supabase
      .from("voip_app_config")
      .upsert(
        { key: throttleKey, value: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (upsertErr) {
      console.error(`[WAF-Discord] Throttle upsert failed:`, upsertErr);
    }
  } catch (e) {
    console.error(`[WAF-Discord] Throttle upsert error:`, e);
  }

  const isEscalated = durationMinutes > 15;
  const color = isEscalated ? 0xff0000 : 0xff6600;

  const embed = {
    title: "🚨 WAF Auto-Block Triggered",
    color,
    fields: [
      { name: "🌐 IP Address", value: `\`${ip}\``, inline: true },
      { name: "📛 Rule", value: ruleLabel, inline: true },
      { name: "⏱️ Duration", value: `${durationMinutes} minutes`, inline: true },
      { name: "🎯 Endpoint", value: `\`${context.endpoint || "/"}\``, inline: true },
      { name: "📡 Source", value: context.source || "unknown", inline: true },
      { name: "🔒 Escalated", value: isEscalated ? "Yes ⚠️" : "No", inline: true },
    ],
    footer: { text: "HardHat Hosting WAF" },
    timestamp: new Date().toISOString(),
  };

  if (context.ua) {
    embed.fields.push({ name: "🤖 User Agent", value: `\`${context.ua.slice(0, 200)}\``, inline: false });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "HardHat WAF",
        avatar_url: "https://hardhathosting.work/hardhat-icon.png",
        embeds: [embed],
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WAF-Discord] Webhook failed: ${res.status} ${errText}`);
    } else {
      console.log(`[WAF-Discord] ✅ Alert sent successfully for IP ${ip}`);
    }
  } catch (e) {
    console.error("[WAF-Discord] Webhook error:", e);
  }
}

// ── DDoS consolidated Discord alert ─────────────────────────────────────────
async function sendDdosDiscordAlert(
  uniqueIpCount: number,
  attackingIps: string[],
  lastRule: string,
  context: { endpoint?: string; ua?: string | null; source?: string }
) {
  const webhookUrl = await getDiscordWebhookUrl();
  if (!webhookUrl) return;

  const ipList = attackingIps.map(ip => `\`${ip}\``).join(", ");
  const truncated = attackingIps.length < uniqueIpCount ? ` (+${uniqueIpCount - attackingIps.length} more)` : "";

  const embed = {
    title: "🔴 DDoS Attack Detected",
    description: `**${uniqueIpCount} unique IPs** have been automatically blocked in the last 60 seconds. This indicates a coordinated distributed attack.`,
    color: 0xcc0000, // Dark red
    fields: [
      { name: "🌐 Attacking IPs", value: ipList + truncated, inline: false },
      { name: "📛 Primary Rule", value: lastRule, inline: true },
      { name: "🎯 Target", value: `\`${context.endpoint || "/"}\``, inline: true },
      { name: "🛡️ Status", value: "All IPs auto-blocked with escalation", inline: true },
      { name: "📊 Scale", value: `${uniqueIpCount} unique sources / 60s`, inline: true },
      { name: "📡 Source", value: context.source || "unknown", inline: true },
      { name: "⚡ Action", value: "Progressive blocks applied", inline: true },
    ],
    footer: { text: "HardHat Hosting WAF — DDoS Protection" },
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "HardHat WAF",
        avatar_url: "https://hardhathosting.work/hardhat-icon.png",
        content: "🚨 **DDoS ATTACK IN PROGRESS**",
        embeds: [embed],
      }),
    });
    if (!res.ok) {
      console.error(`[WAF] DDoS Discord alert failed: ${res.status}`);
    } else {
      console.log(`[WAF] DDoS Discord alert sent (${uniqueIpCount} IPs)`);
    }
  } catch (e) {
    console.error("[WAF] DDoS Discord alert error:", e);
  }
}

// ── Block an IP with escalation ─────────────────────────────────────────────
async function blockIp(
  ip: string,
  rule: WafRule,
  ruleLabel: string,
  context: { endpoint?: string; ua?: string | null; userId?: number | null; source?: string }
) {
  // ── Prevent duplicate blocks from concurrent isolates ──
  if (await hasActiveBlock(ip)) {
    console.log(`[WAF] IP ${ip} already has an active block, skipping duplicate`);
    return;
  }

  const actualDuration = await getEscalatedDuration(ip, rule.block_duration_minutes);
  const expiresAt = new Date(Date.now() + actualDuration * 60_000).toISOString();

  await supabase.from("voip_blocked_ips").insert({
    ip_address: ip,
    reason: `WAF Rule: ${ruleLabel} (escalated to ${actualDuration}m)`,
    blocked_by: null,
    expires_at: expiresAt,
    status: "active",
    rule_id: rule.id,
    scope: rule.scope,
    created_by_type: "system",
  });

  // Invalidate cache immediately
  blockedCacheTime = 0;

  // Log to security_logs for the alert banner
  const isEscalated = actualDuration > rule.block_duration_minutes;
  await supabase.from("voip_security_logs").insert({
    ip_address: ip,
    endpoint: context.endpoint || "/",
    user_agent: context.ua || null,
    status: isEscalated ? "escalated" : "suspicious",
    user_id: context.userId || null,
    rule_triggered: ruleLabel,
    details: {
      source: context.source || "waf",
      auto_blocked: true,
      block_duration_minutes: actualDuration,
      base_duration_minutes: rule.block_duration_minutes,
      escalated: isEscalated,
    },
  });

  // ── DDoS detection: track this block and check for mass-block pattern ──
  const now = Date.now();
  recentBlockedIps.set(ip, now);

  // Prune old entries outside the window
  const cutoff = now - DDOS_WINDOW_MS;
  for (const [blockedIp, ts] of recentBlockedIps.entries()) {
    if (ts < cutoff) recentBlockedIps.delete(blockedIp);
  }

  const uniqueBlockedCount = recentBlockedIps.size;

  // DB-backed DDoS cooldown check
  const ddosThrottleKey = "discord_ddos_last_alert";
  let ddosCooldownOk = true;
  if (uniqueBlockedCount >= DDOS_IP_THRESHOLD) {
    const { data: ddosRec } = await supabase
      .from("voip_app_config")
      .select("updated_at")
      .eq("key", ddosThrottleKey)
      .maybeSingle();
    if (ddosRec) {
      const elapsed = now - new Date(ddosRec.updated_at).getTime();
      ddosCooldownOk = elapsed > DDOS_ALERT_COOLDOWN_MS;
    }
  }

  if (uniqueBlockedCount >= DDOS_IP_THRESHOLD && ddosCooldownOk) {
    // DDoS detected! Record cooldown in DB then send consolidated alert
    await supabase
      .from("voip_app_config")
      .upsert(
        { key: ddosThrottleKey, value: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    const attackingIps = Array.from(recentBlockedIps.keys()).slice(0, 20);
    await sendDdosDiscordAlert(uniqueBlockedCount, attackingIps, ruleLabel, context);

    console.warn(`[WAF] 🚨 DDoS DETECTED: ${uniqueBlockedCount} unique IPs blocked in last 60s`);
  } else if (uniqueBlockedCount < DDOS_IP_THRESHOLD) {
    // Normal single-IP block — send individual alert (throttled per-IP via DB)
    await sendDiscordAlert(ip, ruleLabel, actualDuration, context);
  }
  // If DDoS threshold met but cooldown active, skip individual alert too (already notified)

  console.warn(`[WAF] IP ${ip} auto-blocked by "${ruleLabel}" for ${actualDuration}m (base: ${rule.block_duration_minutes}m)`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ── Extract IP first ──────────────────────────────────────────────────
  const reqIp = extractIp(req);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ── Public endpoint: check-block (MUST run BEFORE the blocked-IP early exit) ──
  if (action === "check-block" && req.method === "POST") {
    const blocked = await isIpBlocked(reqIp);
    let remainingSeconds = 0;
    if (blocked) {
      const { data: blockRec } = await supabase
        .from("voip_blocked_ips")
        .select("expires_at")
        .eq("ip_address", reqIp)
        .eq("status", "active")
        .order("blocked_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (blockRec?.expires_at) {
        remainingSeconds = Math.max(0, Math.round((new Date(blockRec.expires_at).getTime() - Date.now()) / 1000));
      }
    }
    return new Response(
      JSON.stringify({ blocked, ip: reqIp, remaining_seconds: remainingSeconds }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Public endpoint: escalate-block (called from block page retry button) ──
  if (action === "escalate-block" && req.method === "POST") {
    // Find the active block for this IP
    const { data: activeBlock } = await supabase
      .from("voip_blocked_ips")
      .select("id, ip_address, expires_at, reason, rule_id")
      .eq("ip_address", reqIp)
      .eq("status", "active")
      .order("blocked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeBlock) {
      return new Response(
        JSON.stringify({ blocked: false, escalated: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Escalate: double the remaining time, cap at 24 hours
    const currentExpiry = new Date(activeBlock.expires_at || Date.now()).getTime();
    const remainingMs = Math.max(0, currentExpiry - Date.now());
    const newDurationMs = Math.min(remainingMs * 2 + 60000, 24 * 60 * 60 * 1000); // double + 1min minimum, cap 24h
    const newExpiry = new Date(Date.now() + newDurationMs).toISOString();

    await supabase
      .from("voip_blocked_ips")
      .update({ expires_at: newExpiry })
      .eq("id", activeBlock.id);

    // Invalidate cache
    blockedCacheTime = 0;

    // Log escalation
    await supabase.from("voip_security_logs").insert({
      ip_address: reqIp,
      endpoint: "blocked-page-retry",
      status: "escalated",
      rule_triggered: activeBlock.reason || "retry_escalation",
      details: {
        source: "block_page_retry",
        escalated: true,
        new_duration_seconds: Math.round(newDurationMs / 1000),
        previous_expiry: activeBlock.expires_at,
        new_expiry: newExpiry,
      },
    });

    // Send Discord alert for escalation
    const ruleLabel = activeBlock.reason || "Retry Escalation";
    await sendDiscordAlert(reqIp, `${ruleLabel} (retry escalation)`, Math.round(newDurationMs / 60000), {
      endpoint: "blocked-page-retry",
      source: "block_page_retry",
    }, { force: true });

    console.warn(`[WAF] IP ${reqIp} escalated via retry button — new expiry: ${newExpiry} (${Math.round(newDurationMs / 60000)}m)`);

    return new Response(
      JSON.stringify({ blocked: true, escalated: true, new_expiry_seconds: Math.round(newDurationMs / 1000) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── EARLY EXIT: Check blocked IP before ANYTHING else ─────────────────
  if (await isIpBlocked(reqIp)) {
    // Look up the block reason to return the rule name
    const { data: blockRecord } = await supabase
      .from("voip_blocked_ips")
      .select("reason, rule_id")
      .eq("ip_address", reqIp)
      .eq("status", "active")
      .order("blocked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const ruleSlug = extractRuleSlug(blockRecord?.reason || "");
    const reqUa = req.headers.get("user-agent");

    // Always log blocked requests so they appear in traffic logs and update counters
    await supabase.from("voip_request_logs").insert({
      ip_address: reqIp,
      method: req.method,
      path: action || new URL(req.url).pathname,
      status_code: 403,
      user_agent: reqUa,
      is_suspicious: true,
      is_blocked: true,
      rule_triggered: ruleSlug || blockRecord?.reason || "blocked_ip",
      action_taken: "blocked_early_exit",
    }).then(({ error }) => {
      if (error) console.error("[WAF] Blocked request log failed:", error);
    });

    return new Response(
      JSON.stringify({ error: "Forbidden", blocked: true, rule: ruleSlug }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }


  // ── Public endpoint: log-public (no auth required) ──────────────────

  // ── Public endpoint: log-public (no auth required) ──────────────────
  if (action === "log-public" && req.method === "POST") {
    try {
      const body = await req.json();
      const { page, referrer, userAgent: ua, hostname: clientHostname } = body;
      const ip = reqIp;

      // Record hit in memory for WAF (include UA for fingerprinting)
      recordHit(ip, ua);

      // Check WAF rules (public pages are NOT sensitive)
      const { triggered, ruleLabel } = await checkWafRules(ip, ua, false, false);

      let actionTaken: string | null = null;

      if (triggered) {
        actionTaken = "auto_blocked";
        await blockIp(ip, triggered, ruleLabel || triggered.name, {
          endpoint: page || "/",
          ua,
          source: "public_page",
        });
      }

      // Always log public page visits
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
        rule_triggered: ruleLabel || null,
        action_taken: actionTaken,
      });
      if (insertErr) console.error("[WAF] Public log insert error:", JSON.stringify(insertErr));

      const responseBody: Record<string, unknown> = { status: triggered ? "blocked" : "ok" };
      if (triggered) {
        responseBody.rule = ruleLabel || triggered.name;
        responseBody.duration = triggered.block_duration_minutes;
      }

      return new Response(
        JSON.stringify(responseBody),
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
      const ip = reqIp;

      // Record hit in memory FIRST (include UA for fingerprinting)
      recordHit(ip, userAgent);

      // INSERT the log BEFORE checking WAF — ensures concurrent requests see each other
      // Always insert (no sampling) for accurate WAF DB-backed counting
      const { error: logErr } = await supabase.from("voip_request_logs").insert({
        ip_address: ip,
        method: reqMethod || "GET",
        path: endpoint || "unknown",
        status_code: statusCode || 200,
        response_ms: responseMs || null,
        user_agent: userAgent,
        user_id: userId,
        is_suspicious: false,
        is_blocked: false,
        rule_triggered: isFailedLogin ? "failed_login" : null,
        action_taken: null,
      });
      if (logErr) console.error("[WAF] Log insert failed:", logErr);

      // Now check WAF rules (the current request is already in the DB count)
      const isSensitive = SENSITIVE_ENDPOINTS.some(e => (endpoint || "").includes(e));
      const { triggered, ruleLabel } = await checkWafRules(ip, userAgent, isSensitive, !!isFailedLogin);

      let logStatus = "normal";

      if (triggered) {
        logStatus = "suspicious";

        // Update the log we just inserted to reflect the block
        // (we already inserted it, so update the most recent one)
        await supabase.from("voip_request_logs")
          .update({
            is_suspicious: true,
            rule_triggered: ruleLabel || triggered.name,
            action_taken: "auto_blocked",
          })
          .eq("ip_address", ip)
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(1);

        await blockIp(ip, triggered, ruleLabel || triggered.name, {
          endpoint: endpoint || "unknown",
          ua: userAgent,
          userId,
          source: "authenticated",
        });
      }

      // Return blocked: true when we actually triggered a block
      const responseBody: Record<string, unknown> = {
        status: logStatus,
        rule: ruleLabel || null,
        blocked: !!triggered,
      };
      if (triggered) {
        responseBody.duration = triggered.block_duration_minutes;
      }

      return new Response(
        JSON.stringify(responseBody),
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

        // Timeline range parameter: "1h" (default), "24h", "all"
        const timelineRange = url.searchParams.get("timeline_range") || "1h";

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

        // Active alerts (suspicious in last 24h from security_logs)
        const { data: recentAlerts } = await supabase
          .from("voip_security_logs")
          .select("ip_address, endpoint, rule_triggered, timestamp, details")
          .eq("status", "suspicious")
          .gte("timestamp", twentyFourHoursAgo)
          .order("timestamp", { ascending: false })
          .limit(10);

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

        // Timeline — dynamic range based on parameter
        let timelineSince: string;
        let bucketFormat: "minute" | "hour" | "day" = "minute";
        let queryLimit = 1000;
        if (timelineRange === "24h") {
          timelineSince = twentyFourHoursAgo;
          bucketFormat = "hour";
          queryLimit = 2000;
        } else if (timelineRange === "all") {
          // All time = last 30 days (matches retention)
          timelineSince = new Date(Date.now() - 30 * 86400000).toISOString();
          bucketFormat = "day";
          queryLimit = 5000;
        } else {
          timelineSince = new Date(Date.now() - 3600000).toISOString();
          bucketFormat = "minute";
        }

        const { data: timelineLogs } = await supabase
          .from("voip_request_logs")
          .select("timestamp, is_suspicious")
          .gte("timestamp", timelineSince)
          .order("timestamp", { ascending: true })
          .limit(queryLimit);

        const timeline: Record<string, { total: number; suspicious: number }> = {};
        (timelineLogs || []).forEach(l => {
          // Bucket by minute, hour, or day depending on range
          let bucket: string;
          if (bucketFormat === "minute") {
            bucket = l.timestamp.slice(0, 16); // "YYYY-MM-DDTHH:mm"
          } else if (bucketFormat === "hour") {
            bucket = l.timestamp.slice(0, 13); // "YYYY-MM-DDTHH"
          } else {
            bucket = l.timestamp.slice(0, 10); // "YYYY-MM-DD"
          }
          if (!timeline[bucket]) timeline[bucket] = { total: 0, suspicious: 0 };
          timeline[bucket].total++;
          if (l.is_suspicious) timeline[bucket].suspicious++;
        });
        const timelineArray = Object.entries(timeline).map(([time, data]) => ({
          time, // Return full bucket key — frontend will format it
          total: data.total,
          suspicious: data.suspicious,
        }));

        // Count escalated blocks in last 24h
        const { count: escalatedCount } = await supabase
          .from("voip_security_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "escalated")
          .gte("timestamp", twentyFourHoursAgo);

        return new Response(
          JSON.stringify({
            totalRequests: totalRequests || 0,
            suspiciousCount: suspiciousCount || 0,
            blockedCount: blockedCount || 0,
            escalatedCount: escalatedCount || 0,
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
        else if (statusFilter === "escalated") query = query.eq("action_taken", "auto_blocked").eq("is_suspicious", true);
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

        // Send Discord alert for manual blocks too
        const durationMinutes = duration === "5min" ? 5 : duration === "15min" ? 15 : duration === "1hour" ? 60 : duration === "24hours" ? 1440 : 0;
        sendDiscordAlert(ip, "Manual Admin Block", durationMinutes, {
          endpoint: "admin/security",
          source: "manual_block",
        }, { force: true });

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
        if (target === "suspicious") {
          // Clear only suspicious request logs and security alert logs
          await supabase.from("voip_request_logs").delete().eq("is_suspicious", true);
          await supabase.from("voip_security_logs").delete().gte("id", 0);
        }

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId, action: "clear_security_logs", entity_type: "security", details: { target },
        });

        return new Response(JSON.stringify({ message: "Logs cleared" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Discord webhook config ──────────────────────────
      case "discord-webhook": {
        if (req.method === "GET") {
          const { data } = await supabase
            .from("voip_app_config")
            .select("value, updated_at")
            .eq("key", "discord_webhook_url")
            .maybeSingle();

          // Mask the URL for display (show first 40 chars + ...)
          const raw = data?.value || Deno.env.get("DISCORD_WEBHOOK_URL") || "";
          const masked = raw ? (raw.length > 45 ? raw.slice(0, 45) + "..." : raw) : "";
          const source = data?.value ? "database" : (raw ? "environment" : "not_set");

          return new Response(
            JSON.stringify({ url: masked, source, updatedAt: data?.updated_at || null }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "POST") {
          const { url: newUrl } = await req.json();
          if (!newUrl || !newUrl.startsWith("https://discord.com/api/webhooks/")) {
            return new Response(
              JSON.stringify({ error: "Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { error } = await supabase.from("voip_app_config").upsert({
            key: "discord_webhook_url",
            value: newUrl,
            updated_at: new Date().toISOString(),
            updated_by: userId,
          }, { onConflict: "key" });

          if (error) throw error;

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: userId,
            action: "update_discord_webhook",
            entity_type: "config",
            details: { masked_url: newUrl.slice(0, 45) + "..." },
          });

          return new Response(
            JSON.stringify({ message: "Discord webhook URL updated" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "DELETE") {
          await supabase.from("voip_app_config").delete().eq("key", "discord_webhook_url");

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: userId,
            action: "remove_discord_webhook",
            entity_type: "config",
          });

          return new Response(
            JSON.stringify({ message: "Discord webhook URL removed" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // ── Test Discord webhook ─────────────────────────────
      case "test-discord": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const webhookUrl = await getDiscordWebhookUrl();
        if (!webhookUrl) {
          return new Response(
            JSON.stringify({ error: "No Discord webhook URL configured. Please save one first." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Send a test embed directly
        const testEmbed = {
          title: "🧪 WAF Test Alert",
          description: "This is a test alert from the HardHat Hosting Security Monitor. If you see this, your Discord webhook is working correctly!",
          color: 0x00cc66, // Green for test
          fields: [
            { name: "🌐 IP Address", value: "`0.0.0.0` (test)", inline: true },
            { name: "📛 Rule", value: "Test Alert", inline: true },
            { name: "⏱️ Duration", value: "N/A", inline: true },
            { name: "🎯 Endpoint", value: "`/security-monitor`", inline: true },
            { name: "📡 Source", value: "admin_test", inline: true },
            { name: "✅ Status", value: "Webhook is working!", inline: true },
          ],
          footer: { text: "HardHat Hosting WAF" },
          timestamp: new Date().toISOString(),
        };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "HardHat WAF",
              avatar_url: "https://hardhathosting.work/hardhat-icon.png",
              embeds: [testEmbed],
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error(`[WAF] Discord test failed: ${res.status} ${errText}`);
            return new Response(
              JSON.stringify({ error: `Discord returned ${res.status}: ${errText.slice(0, 200)}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log("[WAF] Discord test alert sent successfully");
          return new Response(
            JSON.stringify({ message: "Test alert sent to Discord!" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("[WAF] Discord test error:", e);
          return new Response(
            JSON.stringify({ error: `Webhook request failed: ${String(e)}` }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // ── Suspicious count (sidebar badge) ────────────────
      case "suspicious-count": {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

        // Get whitelisted IPs to exclude from count
        const { data: wlIps } = await supabase.from("voip_whitelisted_ips").select("ip_address");
        const whitelistedIpList = (wlIps || []).map((r: { ip_address: string }) => r.ip_address);

        // Count suspicious request logs (last hour) + active blocked IPs
        // Exclude whitelisted IPs from suspicious count
        let suspiciousQuery = supabase.from("voip_request_logs")
          .select("*", { count: "exact", head: true })
          .eq("is_suspicious", true)
          .gte("timestamp", oneHourAgo);

        let blockedQuery = supabase.from("voip_blocked_ips")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Exclude whitelisted IPs if any exist
        if (whitelistedIpList.length > 0) {
          for (const wlIp of whitelistedIpList) {
            suspiciousQuery = suspiciousQuery.neq("ip_address", wlIp);
            blockedQuery = blockedQuery.neq("ip_address", wlIp);
          }
        }

        const [suspiciousResult, blockedResult] = await Promise.all([
          suspiciousQuery,
          blockedQuery,
        ]);

        const total = (suspiciousResult.count || 0) + (blockedResult.count || 0);

        return new Response(JSON.stringify({ count: total }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Retention cleanup ───────────────────────────────
      case "cleanup": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

        await supabase.from("voip_request_logs").delete().lt("timestamp", sevenDaysAgo);
        await supabase.from("voip_security_logs").delete().lt("timestamp", thirtyDaysAgo);
        await supabase.from("voip_blocked_ips").delete()
          .neq("status", "active").lt("created_at", thirtyDaysAgo);

        return new Response(JSON.stringify({ message: "Cleanup completed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Whitelist CRUD ─────────────────────────────────
      case "whitelist": {
        if (req.method === "GET") {
          const { data, error } = await supabase
            .from("voip_whitelisted_ips")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          return new Response(JSON.stringify({ ips: data || [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "POST") {
          const { ip, label } = await req.json();
          if (!ip) {
            return new Response(JSON.stringify({ error: "IP address is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const { error } = await supabase.from("voip_whitelisted_ips").insert({
            ip_address: ip.trim(),
            label: label || null,
            added_by: userId,
          });
          if (error) {
            if (error.code === "23505") {
              return new Response(JSON.stringify({ error: "IP already whitelisted" }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
            throw error;
          }
          whitelistCacheTime = 0; // invalidate cache

          // Also unblock this IP if currently blocked
          await supabase.from("voip_blocked_ips")
            .update({ status: "manual_unblock" })
            .eq("ip_address", ip.trim())
            .eq("status", "active");
          blockedCacheTime = 0;

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: userId, action: "whitelist_ip", entity_type: "security",
            details: { ip: ip.trim(), label },
          });

          return new Response(JSON.stringify({ message: `IP ${ip} whitelisted` }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "DELETE") {
          const whitelistId = url.searchParams.get("id");
          if (!whitelistId) {
            return new Response(JSON.stringify({ error: "Whitelist entry ID required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
          const { error } = await supabase.from("voip_whitelisted_ips")
            .delete().eq("id", parseInt(whitelistId));
          if (error) throw error;
          whitelistCacheTime = 0;

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: userId, action: "remove_whitelist_ip", entity_type: "security",
            details: { whitelist_id: whitelistId },
          });

          return new Response(JSON.stringify({ message: "IP removed from whitelist" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        break;
      }

      // ── Cloudflare firewall events ─────────────────────
      case "cloudflare-events": {
        const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
        const cfZone = Deno.env.get("CLOUDFLARE_ZONE_ID");

        if (!cfToken || !cfZone) {
          return new Response(
            JSON.stringify({ error: "Cloudflare credentials not configured", events: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const cfLimit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
        const cfSince = url.searchParams.get("since") || new Date(Date.now() - 3600000).toISOString();

        const graphqlQuery = {
          query: `query($zoneTag: string, $filter: FirewallEventsAdaptiveFilter_InputObject, $httpFilter: ZoneHttpRequestsAdaptiveGroupsFilter_InputObject) {
            viewer {
              zones(filter: { zoneTag: $zoneTag }) {
                firewallEventsAdaptive(
                  filter: $filter
                  limit: ${cfLimit}
                  orderBy: [datetime_DESC]
                ) {
                  action
                  clientAsn
                  clientCountryName
                  clientIP
                  clientRequestHTTPHost
                  clientRequestPath
                  clientRequestQuery
                  datetime
                  source
                  userAgent
                  ruleId
                  rayName
                }
                httpRequestsAdaptiveGroups(
                  filter: $httpFilter
                  limit: 60
                  orderBy: [datetimeMinute_ASC]
                ) {
                  dimensions {
                    datetimeMinute
                  }
                  count
                  sum {
                    edgeResponseBytes
                  }
                  avg {
                    sampleInterval
                  }
                }
              }
            }
          }`,
          variables: {
            zoneTag: cfZone,
            filter: {
              datetime_gt: cfSince,
            },
            httpFilter: {
              datetime_gt: cfSince,
            },
          },
        };

        try {
          const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${cfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(graphqlQuery),
          });

          if (!cfRes.ok) {
            const errText = await cfRes.text();
            console.error(`[CF] Cloudflare API error: ${cfRes.status} ${errText}`);
            return new Response(
              JSON.stringify({ error: `Cloudflare API returned ${cfRes.status}`, events: [], httpTimeline: [] }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const cfData = await cfRes.json();
          console.log("[CF] GraphQL response:", JSON.stringify(cfData?.errors || "no errors"));
          const zones = cfData?.data?.viewer?.zones;
          const events = zones?.[0]?.firewallEventsAdaptive || [];
          const httpGroups = zones?.[0]?.httpRequestsAdaptiveGroups || [];

          // Build summary stats from firewall events
          const actionCounts: Record<string, number> = {};
          const sourceCounts: Record<string, number> = {};
          const countryCounts: Record<string, number> = {};
          for (const ev of events) {
            actionCounts[ev.action] = (actionCounts[ev.action] || 0) + 1;
            sourceCounts[ev.source] = (sourceCounts[ev.source] || 0) + 1;
            if (ev.clientCountryName) {
              countryCounts[ev.clientCountryName] = (countryCounts[ev.clientCountryName] || 0) + 1;
            }
          }

          // Build HTTP timeline from httpRequestsAdaptiveGroups
          const httpTimeline = httpGroups.map((g: { dimensions: { datetimeMinute: string }; count: number; sum: { edgeResponseBytes: number } }) => ({
            time: g.dimensions.datetimeMinute,
            requests: g.count,
            bytes: g.sum?.edgeResponseBytes || 0,
          }));

          // Total HTTP requests in the period
          const totalHttpRequests = httpGroups.reduce((sum: number, g: { count: number }) => sum + g.count, 0);
          const totalBytes = httpGroups.reduce((sum: number, g: { sum: { edgeResponseBytes: number } }) => sum + (g.sum?.edgeResponseBytes || 0), 0);

          return new Response(
            JSON.stringify({
              events,
              summary: {
                total: events.length,
                actions: actionCounts,
                sources: sourceCounts,
                countries: countryCounts,
              },
              httpTimeline,
              httpSummary: {
                totalRequests: totalHttpRequests,
                totalBytes,
                dataPoints: httpTimeline.length,
              },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("[CF] Cloudflare events fetch error:", e);
          return new Response(
            JSON.stringify({ error: String(e), events: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // ── Forward Cloudflare events to Discord ────────────
      case "cloudflare-discord-forward": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const webhookUrl = await getDiscordWebhookUrl();
        if (!webhookUrl) {
          return new Response(
            JSON.stringify({ error: "No Discord webhook configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { events: fwdEvents } = await req.json();
        if (!fwdEvents?.length) {
          return new Response(JSON.stringify({ message: "No events to forward" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Build a consolidated embed for batch events
        const actionMap: Record<string, string> = {
          block: "🔴 Block", challenge: "🟡 Challenge", js_challenge: "🟡 JS Challenge",
          managed_challenge: "🟡 Managed Challenge", log: "📝 Log", allow: "🟢 Allow",
          skip: "⏭️ Skip", bypass: "🔓 Bypass",
        };

        const topEvents = fwdEvents.slice(0, 10);
        const eventLines = topEvents.map((ev: Record<string, string>) =>
          `${actionMap[ev.action] || ev.action} | \`${ev.clientIP}\` → \`${ev.clientRequestPath || "/"}\` (${ev.source})`
        ).join("\n");

        const cfEmbed = {
          title: "☁️ Cloudflare Firewall Events",
          description: eventLines,
          color: 0xf48120, // Cloudflare orange
          fields: [
            { name: "📊 Total Events", value: `${fwdEvents.length}`, inline: true },
            { name: "⏱️ Period", value: "Last hour", inline: true },
          ],
          footer: { text: "Cloudflare → HardHat WAF" },
          timestamp: new Date().toISOString(),
        };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "HardHat WAF",
              avatar_url: "https://hardhathosting.work/hardhat-icon.png",
              embeds: [cfEmbed],
            }),
          });

          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: `Discord returned ${res.status}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(JSON.stringify({ message: "Forwarded to Discord" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // ── DDoS alert to Discord (1-minute server-side cooldown) ────────────
      case "cloudflare-ddos-discord": {
        if (req.method !== "POST") {
          return new Response(JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Server-side 10-minute cooldown — reuse the same lastDdosAlertTime variable
        const nowMs = Date.now();
        if ((nowMs - lastDdosAlertTime) < DDOS_ALERT_COOLDOWN_MS) {
          return new Response(
            JSON.stringify({ message: "DDoS alert on cooldown", cooldown_remaining_s: Math.ceil((DDOS_ALERT_COOLDOWN_MS - (nowMs - lastDdosAlertTime)) / 1000) }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        lastDdosAlertTime = nowMs;

        const webhookUrl = await getDiscordWebhookUrl();
        if (!webhookUrl) {
          return new Response(
            JSON.stringify({ error: "No Discord webhook configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const ddosBody = await req.json();
        const { uniqueIps, totalEvents, topIps, topActions, topPaths } = ddosBody;

        const ipList = (topIps || []).slice(0, 10).map((e: { ip: string; count: number }) =>
          `\`${e.ip}\` (${e.count}x)`
        ).join(", ");

        const actionBreakdown = Object.entries(topActions || {})
          .map(([action, count]) => `${action}: ${count}`)
          .join(", ");

        const targetPaths = (topPaths || []).slice(0, 5).map((p: string) => `\`${p}\``).join(", ");

        const ddosEmbed = {
          title: "🔴 DDoS Attack Detected",
          description: `**${totalEvents}** block/challenge events from **${uniqueIps}** unique IPs detected in the last hour.`,
          color: 0xcc0000,
          fields: [
            { name: "🌐 Attacking IPs", value: ipList || "N/A", inline: false },
            { name: "📛 Actions", value: actionBreakdown || "N/A", inline: true },
            { name: "🎯 Targets", value: targetPaths || "/", inline: true },
            { name: "📊 Scale", value: `${uniqueIps} unique sources`, inline: true },
            { name: "🛡️ Status", value: "Auto-blocked with escalation", inline: true },
          ],
          footer: { text: "HardHat Hosting WAF" },
          timestamp: new Date().toISOString(),
        };

        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "HardHat WAF",
              avatar_url: "https://hardhathosting.work/hardhat-icon.png",
              content: "🚨 **DDoS ATTACK DETECTED**",
              embeds: [ddosEmbed],
            }),
          });

          if (!res.ok) {
            console.error(`[CF-DDoS] Discord alert failed: ${res.status}`);
            return new Response(
              JSON.stringify({ error: `Discord returned ${res.status}` }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          console.log(`[CF-DDoS] Discord DDoS alert sent (${uniqueIps} IPs, ${totalEvents} events)`);
          return new Response(JSON.stringify({ message: "DDoS alert sent to Discord" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        } catch (e) {
          console.error("[CF-DDoS] Discord alert error:", e);
          return new Response(JSON.stringify({ error: String(e) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // ── Cloudflare config viewer (masked) ───────────
      case "cloudflare-config": {
        const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN") || "";
        const cfZone = Deno.env.get("CLOUDFLARE_ZONE_ID") || "";

        const maskValue = (val: string) => {
          if (!val) return "(not set)";
          if (val.length <= 8) return "****" + val.slice(-4);
          return val.slice(0, 4) + "····" + val.slice(-4);
        };

        return new Response(
          JSON.stringify({
            apiToken: maskValue(cfToken),
            zoneId: maskValue(cfZone),
            apiTokenFull: cfToken,
            zoneIdFull: cfZone,
            configured: !!(cfToken && cfZone),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
