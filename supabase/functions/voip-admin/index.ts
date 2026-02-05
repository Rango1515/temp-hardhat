import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// Sanitize search input to prevent SQL wildcard injection
function sanitizeSearchPattern(input: string): string {
  // Escape SQL wildcards % and _
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
      // Users management
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
              pagination: {
                page,
                limit,
                total: count || 0,
              },
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

          // Don't allow deleting yourself
          if (parseInt(userId) === adminId) {
            return new Response(
              JSON.stringify({ error: "You cannot delete your own account" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

        const userIdInt = parseInt(userId);

        // Clear references in related tables before deletion
        // Clear signup tokens used_by references
        await supabase
          .from("voip_signup_tokens")
          .update({ used_by: null })
          .eq("used_by", userIdInt);

        // Clear refresh tokens
        await supabase
          .from("voip_refresh_tokens")
          .delete()
          .eq("user_id", userIdInt);

        // Clear API keys
        await supabase
          .from("voip_api_keys")
          .delete()
          .eq("user_id", userIdInt);

        // Clear lead assignments
        await supabase
          .from("voip_leads")
          .update({ assigned_to: null })
          .eq("assigned_to", userIdInt);

        // Clear worker lead history
        await supabase
          .from("voip_worker_lead_history")
          .delete()
          .eq("worker_id", userIdInt);

          // Delete the user (calls and other data are preserved via SET NULL)
          const { error } = await supabase
            .from("voip_users")
            .delete()
          .eq("id", userIdInt);

        if (error) {
          console.error("[users DELETE] Error deleting user:", error);
          throw error;
        }

          // Audit log
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

      // Phone numbers management
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
              monthly_cost: monthlyCost || 1.00,
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

      // Number requests management
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

            // Get request user and assign number
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

      // System analytics
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

        return new Response(
          JSON.stringify({
            stats: {
              totalUsers: totalUsers || 0,
              activeUsers: activeUsers || 0,
              totalCalls: totalCalls || 0,
              totalNumbers: totalNumbers || 0,
              assignedNumbers: assignedNumbers || 0,
              pendingRequests: pendingRequests || 0,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invite tokens management
      case "invite-tokens": {
        if (req.method === "GET") {
          const { data: tokens, error } = await supabase
            .from("voip_signup_tokens")
            .select("*, created_by_user:voip_users!voip_signup_tokens_created_by_fkey(name), used_by_user:voip_users!voip_signup_tokens_used_by_fkey(name, email)")
            .order("created_at", { ascending: false });

          if (error) throw error;

          // Transform data to match frontend interface
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

          // Generate a secure random token
          const tokenBytes = new Uint8Array(24);
          crypto.getRandomValues(tokenBytes);
          const inviteToken = Array.from(tokenBytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

          // Default to 30 days if not specified (expires_at is required)
          const daysToExpire = parseInt(String(expiresInDays)) || 30;
          const expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000).toISOString();

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
              message: "Invite token created successfully" 
            }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            .eq("id", parseInt(tokenId))
            .is("used_by", null);

          if (error) throw error;

          return new Response(
            JSON.stringify({ message: "Token deleted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // User suspension with reason
      case "suspend-user": {
         const { userId: targetUserId, reason } = await req.json();
 
         if (!targetUserId) {
          return new Response(
             JSON.stringify({ error: "userId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Don't allow suspending yourself
        if (parseInt(targetUserId) === adminId) {
          return new Response(
            JSON.stringify({ error: "You cannot suspend your own account" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_users")
          .update({
            status: "suspended",
             suspension_reason: reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(targetUserId));

        if (error) throw error;

        // End user's active sessions
        await supabase
          .from("voip_user_sessions")
          .update({ session_end: new Date().toISOString() })
          .eq("user_id", parseInt(targetUserId))
          .is("session_end", null);

        // Invalidate refresh tokens
        await supabase
          .from("voip_refresh_tokens")
          .delete()
          .eq("user_id", parseInt(targetUserId));

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: adminId,
          action: "user_suspended",
          entity_type: "users",
          entity_id: parseInt(targetUserId),
           details: { reason: reason || "No reason provided" },
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

       // Set user status (pending/suspended with optional reason)
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
             JSON.stringify({ error: "Invalid status. Must be active, pending, or suspended" }),
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
 
         // Don't allow changing your own status
         if (parseInt(targetUserId) === adminId) {
           return new Response(
             JSON.stringify({ error: "You cannot change your own status" }),
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
 
         const updates: Record<string, unknown> = {
           status,
           updated_at: new Date().toISOString(),
         };
 
         // Only set suspension_reason for non-active statuses
         if (status !== "active") {
           updates.suspension_reason = reason || null;
         } else {
           updates.suspension_reason = null;
         }
 
         const { error } = await supabase
           .from("voip_users")
           .update(updates)
           .eq("id", parseInt(targetUserId));
 
         if (error) throw error;
 
         // If suspended or pending, end sessions and invalidate tokens
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
 
         // Audit log
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
 
       // Get user activity/prompt history
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
 
         // Get lead info for events with lead_id
         const leadIds = [...new Set((events || []).map(e => e.lead_id).filter(Boolean))];
         let leadMap = new Map<number, { name: string | null; phone: string }>();
         
         if (leadIds.length > 0) {
           const { data: leads } = await supabase
             .from("voip_leads")
             .select("id, name, phone")
             .in("id", leadIds);
           
           if (leads) {
             leadMap = new Map(leads.map(l => [l.id, { name: l.name, phone: l.phone }]));
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
 
      // Reactivate user
      case "reactivate-user": {
        const { userId: targetUserId } = await req.json();
        
        if (!targetUserId) {
          return new Response(
            JSON.stringify({ error: "userId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_users")
          .update({
            status: "active",
            suspension_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(targetUserId));

        if (error) throw error;

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: adminId,
          action: "user_reactivated",
          entity_type: "users",
          entity_id: parseInt(targetUserId),
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Admin password reset
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

        // Import hash function from auth module
        const encoder = new TextEncoder();
        const data = encoder.encode(newPassword);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const { error } = await supabase
          .from("voip_users")
          .update({
            password_hash: passwordHash,
            force_password_change: forceChange || false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parseInt(targetUserId));

        if (error) throw error;

        // Invalidate all refresh tokens to force re-login
        await supabase
          .from("voip_refresh_tokens")
          .delete()
          .eq("user_id", parseInt(targetUserId));

        // Audit log
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

      // Get audit log
      case "audit-log": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = (page - 1) * limit;

        const { data: logs, count, error } = await supabase
          .from("voip_admin_audit_log")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Get admin names
        const adminIds = [...new Set((logs || []).map(l => l.admin_id))];
        let adminMap = new Map<number, string>();
        
        if (adminIds.length > 0) {
          const { data: admins } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", adminIds);
          
          if (admins) {
            adminMap = new Map(admins.map(a => [a.id, a.name || a.email]));
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

      // Get user status (for live kick)
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
