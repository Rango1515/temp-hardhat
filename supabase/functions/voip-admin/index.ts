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
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
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

          return new Response(
            JSON.stringify({ tokens }),
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

          const expiresAt = expiresInDays 
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : null;

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
