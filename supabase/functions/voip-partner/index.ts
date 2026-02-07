import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = extractToken(req.headers.get("Authorization"));
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "partner") {
    return new Response(JSON.stringify({ error: "Partner access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const partnerId = parseInt(payload.sub);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      // ── Partner Dashboard Stats ──
      case "dashboard": {
        // Total clients linked to this partner
        const { count: totalClients } = await supabase
          .from("voip_users")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("role", "client");

        // Active clients
        const { count: activeClients } = await supabase
          .from("voip_users")
          .select("id", { count: "exact", head: true })
          .eq("partner_id", partnerId)
          .eq("role", "client")
          .eq("status", "active");

        // Total revenue from partner's clients
        const { data: revenueData } = await supabase
          .from("voip_revenue_events")
          .select("amount")
          .eq("partner_id", partnerId);

        const totalRevenue = (revenueData || []).reduce((sum, r) => sum + Number(r.amount), 0);

        // Commission totals
        const { data: commissionData } = await supabase
          .from("voip_commissions")
          .select("commission_amount, status, created_at")
          .eq("partner_id", partnerId);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let lifetimeCommission = 0;
        let thisMonthCommission = 0;
        let pendingPayouts = 0;

        for (const c of commissionData || []) {
          const amt = Number(c.commission_amount);
          lifetimeCommission += amt;
          if (c.created_at >= monthStart) thisMonthCommission += amt;
          if (c.status === "pending" || c.status === "approved") pendingPayouts += amt;
        }

        return new Response(JSON.stringify({
          totalClients: totalClients || 0,
          activeClients: activeClients || 0,
          totalRevenue,
          lifetimeCommission,
          thisMonthCommission,
          pendingPayouts,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── My Clients ──
      case "my-clients": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const { data: clients, count, error } = await supabase
          .from("voip_users")
          .select("id, name, email, status, created_at", { count: "exact" })
          .eq("partner_id", partnerId)
          .eq("role", "client")
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Enrich with call counts per client
        const clientIds = (clients || []).map(c => c.id);
        const enriched = [];

        for (const client of clients || []) {
          const { count: callCount } = await supabase
            .from("voip_calls")
            .select("id", { count: "exact", head: true })
            .eq("user_id", client.id)
            .is("deleted_at", null);

          const { count: appointmentCount } = await supabase
            .from("voip_appointments")
            .select("id", { count: "exact", head: true })
            .eq("created_by", client.id)
            .is("deleted_at", null);

          enriched.push({
            ...client,
            totalCalls: callCount || 0,
            totalAppointments: appointmentCount || 0,
          });
        }

        return new Response(JSON.stringify({
          clients: enriched,
          pagination: { page, limit, total: count || 0 },
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Client Detail (read-only) ──
      case "client-detail": {
        const clientId = url.searchParams.get("clientId");
        if (!clientId) {
          return new Response(JSON.stringify({ error: "clientId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify this client belongs to this partner
        const { data: client } = await supabase
          .from("voip_users")
          .select("id, name, email, status, created_at")
          .eq("id", parseInt(clientId))
          .eq("partner_id", partnerId)
          .single();

        if (!client) {
          return new Response(JSON.stringify({ error: "Client not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Recent calls
        const { data: recentCalls } = await supabase
          .from("voip_calls")
          .select("id, to_number, outcome, duration_seconds, start_time")
          .eq("user_id", client.id)
          .is("deleted_at", null)
          .order("start_time", { ascending: false })
          .limit(10);

        // Revenue events for this client
        const { data: revenue } = await supabase
          .from("voip_revenue_events")
          .select("id, amount, type, created_at")
          .eq("client_id", client.id)
          .eq("partner_id", partnerId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({
          client,
          recentCalls: recentCalls || [],
          revenue: revenue || [],
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Earnings ──
      case "earnings": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;
        const status = url.searchParams.get("status"); // pending, approved, paid

        let query = supabase
          .from("voip_commissions")
          .select("id, revenue_event_id, commission_amount, commission_rate, status, notes, paid_at, created_at", { count: "exact" })
          .eq("partner_id", partnerId);

        if (status) query = query.eq("status", status);

        const { data: commissions, count, error } = await query
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Get revenue event details for each commission
        const eventIds = (commissions || []).map(c => c.revenue_event_id).filter(Boolean);
        let eventsMap: Record<number, { amount: number; type: string; client_id: number }> = {};

        if (eventIds.length > 0) {
          const { data: events } = await supabase
            .from("voip_revenue_events")
            .select("id, amount, type, client_id")
            .in("id", eventIds);

          for (const e of events || []) {
            eventsMap[e.id] = { amount: Number(e.amount), type: e.type, client_id: e.client_id };
          }
        }

        // Get client names
        const clientIds = [...new Set(Object.values(eventsMap).map(e => e.client_id))];
        let clientMap: Record<number, string> = {};

        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("voip_users")
            .select("id, name")
            .in("id", clientIds);

          for (const c of clients || []) {
            clientMap[c.id] = c.name;
          }
        }

        const enriched = (commissions || []).map(c => {
          const event = eventsMap[c.revenue_event_id] || {};
          return {
            ...c,
            revenue_amount: event.amount || 0,
            event_type: event.type || "unknown",
            client_name: clientMap[event.client_id] || "Unknown",
          };
        });

        return new Response(JSON.stringify({
          commissions: enriched,
          pagination: { page, limit, total: count || 0 },
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Earnings Summary ──
      case "earnings-summary": {
        const { data: commissions } = await supabase
          .from("voip_commissions")
          .select("commission_amount, status, created_at")
          .eq("partner_id", partnerId);

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        let lifetime = 0;
        let thisMonth = 0;
        let pending = 0;

        for (const c of commissions || []) {
          const amt = Number(c.commission_amount);
          lifetime += amt;
          if (c.created_at >= monthStart) thisMonth += amt;
          if (c.status === "pending" || c.status === "approved") pending += amt;
        }

        return new Response(JSON.stringify({ lifetime, thisMonth, pending }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("[voip-partner] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
