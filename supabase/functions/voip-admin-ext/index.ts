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
    return new Response(
      JSON.stringify({ error: "Authorization required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const adminId = parseInt(payload.sub);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      // ── Phone numbers management ────────────────────────
      case "numbers": {
        if (req.method === "GET") {
          const status = url.searchParams.get("status");

          let query = supabase
            .from("voip_phone_numbers")
            .select("*, voip_users(name, email)");

          if (status) {
            query = query.eq("status", status);
          }

          const { data: numbers, error } = await query.order("created_at", { ascending: false });
          if (error) throw error;

          return new Response(
            JSON.stringify({ numbers }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "POST") {
          const { phoneNumber, friendlyName, monthlyCost } = await req.json();

          if (!phoneNumber) {
            return new Response(
              JSON.stringify({ error: "Phone number is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { data, error } = await supabase
            .from("voip_phone_numbers")
            .insert({
              phone_number: phoneNumber,
              friendly_name: friendlyName || null,
              monthly_cost: monthlyCost || 1.0,
              status: "available",
            })
            .select("id")
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({ id: data.id, message: "Number created successfully" }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const numberId = url.searchParams.get("id");
          const { userId, status } = await req.json();

          if (!numberId) {
            return new Response(
              JSON.stringify({ error: "Number ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updates: Record<string, unknown> = {};

          if (userId !== undefined) {
            updates.user_id = userId || null;
            if (userId) {
              updates.status = "assigned";
              updates.assigned_at = new Date().toISOString();
            } else {
              updates.status = "available";
              updates.assigned_at = null;
            }
          }

          if (status) {
            updates.status = status;
          }

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from("voip_phone_numbers")
              .update(updates)
              .eq("id", parseInt(numberId));

            if (error) throw error;
          }

          return new Response(
            JSON.stringify({ message: "Number updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // ── Number requests ─────────────────────────────────
      case "requests": {
        if (req.method === "GET") {
          const status = url.searchParams.get("status") || "pending";

          const { data: requests, error } = await supabase
            .from("voip_number_requests")
            .select("*, voip_users(name, email)")
            .eq("status", status)
            .order("created_at", { ascending: true });

          if (error) throw error;

          return new Response(
            JSON.stringify({ requests }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const requestId = url.searchParams.get("id");
          const { status, adminNotes, assignedNumberId } = await req.json();

          if (!requestId) {
            return new Response(
              JSON.stringify({ error: "Request ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updates: Record<string, unknown> = {
            status,
            updated_at: new Date().toISOString(),
          };

          if (adminNotes) updates.admin_notes = adminNotes;
          if (assignedNumberId) {
            updates.assigned_number_id = assignedNumberId;

            const { data: requests } = await supabase
              .from("voip_number_requests")
              .select("user_id")
              .eq("id", parseInt(requestId))
              .single();

            if (requests) {
              await supabase
                .from("voip_phone_numbers")
                .update({
                  user_id: requests.user_id,
                  status: "assigned",
                  assigned_at: new Date().toISOString(),
                })
                .eq("id", assignedNumberId);
            }
          }

          const { error } = await supabase
            .from("voip_number_requests")
            .update(updates)
            .eq("id", parseInt(requestId));

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: "Request updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // ── System analytics (enhanced) ─────────────────────
      case "analytics": {
        const { count: totalUsers } = await supabase
          .from("voip_users")
          .select("*", { count: "exact", head: true });

        const { count: activeUsers } = await supabase
          .from("voip_users")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        const { count: totalCalls } = await supabase
          .from("voip_calls")
          .select("*", { count: "exact", head: true });

        const { count: totalNumbers } = await supabase
          .from("voip_phone_numbers")
          .select("*", { count: "exact", head: true });

        const { count: assignedNumbers } = await supabase
          .from("voip_phone_numbers")
          .select("*", { count: "exact", head: true })
          .eq("status", "assigned");

        const { count: pendingRequests } = await supabase
          .from("voip_number_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Available leads count
        const { count: availableLeads } = await supabase
          .from("voip_leads")
          .select("*", { count: "exact", head: true })
          .eq("status", "NEW");

        // Recent activity from audit log (last 10)
        const { data: recentLogs } = await supabase
          .from("voip_admin_audit_log")
          .select("id, action, entity_type, created_at, admin_id")
          .order("created_at", { ascending: false })
          .limit(10);

        // Get admin names for activity
        const adminIds = [...new Set((recentLogs || []).map(l => l.admin_id))];
        const adminMap = new Map<number, string>();
        if (adminIds.length > 0) {
          const { data: admins } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", adminIds);
          if (admins) {
            for (const a of admins) {
              adminMap.set(a.id, a.name || a.email);
            }
          }
        }

        const recentActivity = (recentLogs || []).map(log => ({
          id: log.id,
          action: log.action,
          entity_type: log.entity_type,
          user_name: adminMap.get(log.admin_id) || "System",
          created_at: log.created_at,
        }));

        // Daily call volume (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentCalls } = await supabase
          .from("voip_calls")
          .select("start_time")
          .gte("start_time", thirtyDaysAgo.toISOString());

        const callsByDay: Record<string, number> = {};
        recentCalls?.forEach(call => {
          if (call.start_time) {
            const date = call.start_time.split("T")[0];
            callsByDay[date] = (callsByDay[date] || 0) + 1;
          }
        });

        const callsByDayArray = Object.entries(callsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(
          JSON.stringify({
            stats: {
              totalUsers: totalUsers || 0,
              activeUsers: activeUsers || 0,
              totalCalls: totalCalls || 0,
              totalNumbers: totalNumbers || 0,
              assignedNumbers: assignedNumbers || 0,
              pendingRequests: pendingRequests || 0,
              availableLeads: availableLeads || 0,
            },
            recentActivity,
            callsByDay: callsByDayArray,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Invite tokens ───────────────────────────────────
      case "invite-tokens": {
        if (req.method === "GET") {
          const { data: tokens, error } = await supabase
            .from("voip_signup_tokens")
            .select(
              "*, created_by_user:voip_users!voip_signup_tokens_created_by_fkey(name), used_by_user:voip_users!voip_signup_tokens_used_by_fkey(name, email)"
            )
            .order("created_at", { ascending: false });

          if (error) throw error;

          const transformedTokens = (tokens || []).map((t: Record<string, unknown>) => ({
            id: t.id,
            token: t.token,
            email: t.email,
            expires_at: t.expires_at,
            used: t.used_by ? 1 : 0,
            used_by: t.used_by,
            used_by_name: (t.used_by_user as Record<string, unknown>)?.name || null,
            used_by_email: (t.used_by_user as Record<string, unknown>)?.email || null,
            used_at: t.used_at,
            created_by: t.created_by,
            created_by_name: (t.created_by_user as Record<string, unknown>)?.name || "System",
            created_at: t.created_at,
          }));

          return new Response(
            JSON.stringify({ tokens: transformedTokens }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "POST") {
          const { email, expiresInDays } = await req.json();

          const tokenBytes = new Uint8Array(24);
          crypto.getRandomValues(tokenBytes);
          const inviteToken = Array.from(tokenBytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

          const daysToExpire = parseInt(String(expiresInDays)) || 30;
          const expiresAt = new Date(
            Date.now() + daysToExpire * 24 * 60 * 60 * 1000
          ).toISOString();

          const { data, error } = await supabase
            .from("voip_signup_tokens")
            .insert({
              token: inviteToken,
              email: email?.toLowerCase().trim() || null,
              expires_at: expiresAt,
              created_by: adminId,
            })
            .select("id")
            .single();

          if (error) throw error;

          return new Response(
            JSON.stringify({
              id: data.id,
              token: inviteToken,
              email: email?.toLowerCase().trim() || null,
              expiresAt,
              message: "Invite token created successfully",
            }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const tokenId = url.searchParams.get("id");
          if (!tokenId) {
            return new Response(
              JSON.stringify({ error: "Token ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { expiresAt, neverExpires } = await req.json();

          const updates: Record<string, unknown> = {};
          if (neverExpires) {
            // Set to 10 years from now (effectively never)
            updates.expires_at = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString();
          } else if (expiresAt) {
            updates.expires_at = new Date(expiresAt).toISOString();
          }

          if (Object.keys(updates).length === 0) {
            return new Response(
              JSON.stringify({ error: "No updates provided" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { error } = await supabase
            .from("voip_signup_tokens")
            .update(updates)
            .eq("id", parseInt(tokenId));

          if (error) throw error;

          console.log(`[voip-admin-ext] Token ${tokenId} expiration updated by admin ${adminId}`);

          return new Response(
            JSON.stringify({ message: "Token expiration updated" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "DELETE") {
          const tokenId = url.searchParams.get("id");

          if (!tokenId) {
            return new Response(
              JSON.stringify({ error: "Token ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { error } = await supabase
            .from("voip_signup_tokens")
            .delete()
            .eq("id", parseInt(tokenId));

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: "Token deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // ── Audit log ───────────────────────────────────────
      case "audit-log": {
        if (req.method === "DELETE") {
          const { error } = await supabase
            .from("voip_admin_audit_log")
            .delete()
            .gte("id", 0);

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: "All audit logs cleared" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        const { data: logs, count, error } = await supabase
          .from("voip_admin_audit_log")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        const adminIds = [...new Set((logs || []).map(l => l.admin_id))];
        const adminMap = new Map();

        if (adminIds.length > 0) {
          const { data: admins } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", adminIds);

          if (admins) {
            for (const a of admins) {
              adminMap.set(a.id, a.name || a.email);
            }
          }
        }

        const enrichedLogs = (logs || []).map(log => ({
          ...log,
          admin_name: adminMap.get(log.admin_id) || "Unknown",
        }));

        return new Response(
          JSON.stringify({
            logs: enrichedLogs,
            pagination: { page, limit, total: count || 0 },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Master reset ───────────────────────────────────
      case "master-reset": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`Master reset initiated by admin ${adminId}`);

        // Delete in dependency order
        // 1. Commissions (depends on revenue_events & partners)
        await supabase.from("voip_commissions").delete().gte("id", 0);
        // 2. Revenue events
        await supabase.from("voip_revenue_events").delete().gte("id", 0);
        // 3. Partner token usage
        await supabase.from("voip_partner_token_usage").delete().gte("id", 0);
        // 4. Partner tokens
        await supabase.from("voip_partner_tokens").delete().gte("id", 0);
        // 5. Partner profiles
        await supabase.from("voip_partner_profiles").delete().gte("id", 0);
        // 6. Appointments (depends on leads & users)
        await supabase.from("voip_appointments").delete().gte("id", 0);
        // 7. Calls (depends on leads & users)
        await supabase.from("voip_calls").delete().gte("id", 0);
        // 8. Activity events
        await supabase.from("voip_activity_events").delete().gte("id", 0);
        // 9. Worker lead history
        await supabase.from("voip_worker_lead_history").delete().gte("id", 0);
        // 10. Duplicate leads
        await supabase.from("voip_duplicate_leads").delete().gte("id", 0);
        // 11. Leads
        await supabase.from("voip_leads").delete().gte("id", 0);
        // 12. Lead uploads
        await supabase.from("voip_lead_uploads").delete().gte("id", 0);
        // 13. User sessions
        await supabase.from("voip_user_sessions").delete().gte("id", 0);
        // 14. User preferences
        await supabase.from("voip_user_preferences").delete().gte("id", 0);
        // 15. Support ticket messages
        await supabase.from("voip_support_ticket_messages").delete().gte("id", 0);
        // 16. Support tickets
        await supabase.from("voip_support_tickets").delete().gte("id", 0);
        // 17. Chat messages
        await supabase.from("voip_chat_messages").delete().gte("id", 0);
        // 18. Chat channel reads
        await supabase.from("voip_chat_channel_reads").delete().gte("id", 0);
        // 19. Chat user status
        await supabase.from("voip_chat_user_status").delete().gte("id", 0);
        // 20. Chat channels
        await supabase.from("voip_chat_channels").delete().gte("id", 0);
        // 21. Signup tokens
        await supabase.from("voip_signup_tokens").delete().gte("id", 0);
        // 22. Refresh tokens
        await supabase.from("voip_refresh_tokens").delete().gte("id", 0);
        // 23. API keys
        await supabase.from("voip_api_keys").delete().gte("id", 0);
        // 24. Number requests
        await supabase.from("voip_number_requests").delete().gte("id", 0);
        // 25. Phone numbers
        await supabase.from("voip_phone_numbers").delete().gte("id", 0);
        // 26. Audit log
        await supabase.from("voip_admin_audit_log").delete().gte("id", 0);
        // 27. Delete all non-admin users (keep admin accounts)
        await supabase.from("voip_users").delete().neq("role", "admin");

        console.log("Master reset completed");

        return new Response(
          JSON.stringify({ message: "Master reset completed. All data cleared except admin accounts." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin-ext error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
