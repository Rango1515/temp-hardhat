import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken, hashPassword } from "../_shared/auth.ts";

// Sanitize search input to prevent SQL wildcard injection
function sanitizeSearchPattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

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
      // ── Users CRUD ──────────────────────────────────────
      case "users": {
        if (req.method === "GET") {
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = (page - 1) * limit;
          const search = url.searchParams.get("search");

          let query = supabase
            .from("voip_users")
            .select("id, name, email, role, status, created_at", { count: "exact" });

          if (search) {
            const sanitized = sanitizeSearchPattern(search);
            query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
          }

          const { data: users, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;

          return new Response(
            JSON.stringify({
              users,
              pagination: { page, limit, total: count || 0 },
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const userId = url.searchParams.get("id");
          const { role, status } = await req.json();

          if (!userId) {
            return new Response(
              JSON.stringify({ error: "User ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updates: Record<string, unknown> = {};
          if (role) updates.role = role;
          if (status) updates.status = status;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from("voip_users")
              .update(updates)
              .eq("id", parseInt(userId));

            if (error) throw error;
          }

          return new Response(
            JSON.stringify({ message: "User updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "DELETE") {
          const userId = url.searchParams.get("id");

          if (!userId) {
            return new Response(
              JSON.stringify({ error: "User ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          if (parseInt(userId) === adminId) {
            return new Response(
              JSON.stringify({ error: "You cannot delete your own account" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const userIdInt = parseInt(userId);

          await supabase.from("voip_signup_tokens").update({ used_by: null }).eq("used_by", userIdInt);
          await supabase.from("voip_refresh_tokens").delete().eq("user_id", userIdInt);
          await supabase.from("voip_api_keys").delete().eq("user_id", userIdInt);
          await supabase.from("voip_leads").update({ assigned_to: null }).eq("assigned_to", userIdInt);
          await supabase.from("voip_worker_lead_history").delete().eq("worker_id", userIdInt);

          const { error } = await supabase.from("voip_users").delete().eq("id", userIdInt);

          if (error) {
            console.error("[users DELETE] Error:", error);
            throw error;
          }

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "user_delete",
            entity_type: "users",
            entity_id: userIdInt,
            details: { deleted_by: adminId },
          });

          return new Response(
            JSON.stringify({ message: "User deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // ── Set user status ─────────────────────────────────
      case "set-status": {
        const { userId: targetUserId, status, reason } = await req.json();

        if (!targetUserId || !status) {
          return new Response(
            JSON.stringify({ error: "userId and status are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!["active", "pending", "suspended"].includes(status)) {
          return new Response(
            JSON.stringify({ error: "Invalid status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (parseInt(targetUserId) === adminId) {
          return new Response(
            JSON.stringify({ error: "You cannot change your own status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {
          status,
          updated_at: new Date().toISOString(),
          suspension_reason: status !== "active" ? (reason || null) : null,
        };

        const { error } = await supabase
          .from("voip_users")
          .update(updates)
          .eq("id", parseInt(targetUserId));

        if (error) throw error;

        if (status !== "active") {
          await supabase
            .from("voip_user_sessions")
            .update({ session_end: new Date().toISOString() })
            .eq("user_id", parseInt(targetUserId))
            .is("session_end", null);

          await supabase
            .from("voip_refresh_tokens")
            .delete()
            .eq("user_id", parseInt(targetUserId));
        }

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: adminId,
          action: `user_status_changed_to_${status}`,
          entity_type: "users",
          entity_id: parseInt(targetUserId),
          details: { status, reason: reason || null },
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── User activity history ───────────────────────────
      case "user-activity": {
        const targetUserId = url.searchParams.get("userId");
        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: "userId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: events, error } = await supabase
          .from("voip_activity_events")
          .select("id, event_type, lead_id, metadata, created_at")
          .eq("user_id", parseInt(targetUserId))
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        const leadIds = [...new Set((events || []).map(e => e.lead_id).filter(Boolean))];
        const leadMap = new Map();

        if (leadIds.length > 0) {
          const { data: leads } = await supabase
            .from("voip_leads")
            .select("id, name, phone")
            .in("id", leadIds);

          if (leads) {
            for (const l of leads) {
              leadMap.set(l.id, { name: l.name, phone: l.phone });
            }
          }
        }

        const enrichedEvents = (events || []).map(event => ({
          ...event,
          lead_name: event.lead_id ? leadMap.get(event.lead_id)?.name : null,
          lead_phone: event.lead_id ? leadMap.get(event.lead_id)?.phone : null,
        }));

        return new Response(
          JSON.stringify({ events: enrichedEvents }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Reset password ──────────────────────────────────
      case "reset-password": {
        const { userId: targetUserId, newPassword, forceChange } = await req.json();

        if (!targetUserId || !newPassword) {
          return new Response(
            JSON.stringify({ error: "userId and newPassword are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (newPassword.length < 8) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 8 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use the same secure PBKDF2 hashing as signup
        const passwordHash = await hashPassword(newPassword);

        const { error } = await supabase
          .from("voip_users")
          .update({
            password_hash: passwordHash,
            force_password_change: forceChange || false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(targetUserId));

        if (error) throw error;

        await supabase
          .from("voip_refresh_tokens")
          .delete()
          .eq("user_id", parseInt(targetUserId));

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: adminId,
          action: "password_reset",
          entity_type: "users",
          entity_id: parseInt(targetUserId),
          details: { forceChange: forceChange || false },
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Check own status (for live kick) ────────────────
      case "check-status": {
        const { data: user, error } = await supabase
          .from("voip_users")
          .select("status, suspension_reason")
          .eq("id", adminId)
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify(user),
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
    console.error("Admin error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
