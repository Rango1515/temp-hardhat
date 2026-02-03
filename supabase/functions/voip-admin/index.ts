import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query, execute } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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

          let whereClause = "WHERE 1=1";
          const params: unknown[] = [];

          if (search) {
            whereClause += " AND (name LIKE ? OR email LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
          }

          const countResult = await query<{ count: number }>(
            `SELECT COUNT(*) as count FROM users ${whereClause}`,
            params
          );

          const users = await query(
            `SELECT id, name, email, role, status, signup_date, last_login 
             FROM users ${whereClause} 
             ORDER BY signup_date DESC 
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
          );

          return new Response(
            JSON.stringify({
              users,
              pagination: {
                page,
                limit,
                total: countResult[0]?.count || 0,
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

          const updates: string[] = [];
          const params: unknown[] = [];

          if (role) {
            updates.push("role = ?");
            params.push(role);
          }
          if (status) {
            updates.push("status = ?");
            params.push(status);
          }

          if (updates.length > 0) {
            params.push(userId);
            await execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

            await execute(
              "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
              [adminId, "user_updated", "user", userId, JSON.stringify({ role, status })]
            );
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
          
          let whereClause = "WHERE 1=1";
          const params: unknown[] = [];

          if (status) {
            whereClause += " AND pn.status = ?";
            params.push(status);
          }

          const numbers = await query(
            `SELECT pn.*, u.name as owner_name, u.email as owner_email 
             FROM phone_numbers pn 
             LEFT JOIN users u ON pn.owner_id = u.id 
             ${whereClause} 
             ORDER BY pn.created_at DESC`,
            params
          );

          return new Response(
            JSON.stringify({ numbers }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "POST") {
          const { phoneNumber, friendlyName, city, state, country, numberType, monthlyCost } = await req.json();

          if (!phoneNumber) {
            return new Response(
              JSON.stringify({ error: "Phone number is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const result = await execute(
            `INSERT INTO phone_numbers 
             (phone_number, friendly_name, location_city, location_state, location_country, number_type, monthly_cost) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [phoneNumber, friendlyName || null, city || null, state || null, country || "US", numberType || "local", monthlyCost || 0]
          );

          await execute(
            "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
            [adminId, "number_created", "phone_number", result.lastInsertId, JSON.stringify({ phoneNumber })]
          );

          return new Response(
            JSON.stringify({ id: result.lastInsertId, message: "Number created successfully" }),
            { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const numberId = url.searchParams.get("id");
          const { ownerId, status } = await req.json();

          if (!numberId) {
            return new Response(
              JSON.stringify({ error: "Number ID is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updates: string[] = [];
          const params: unknown[] = [];

          if (ownerId !== undefined) {
            updates.push("owner_id = ?");
            params.push(ownerId || null);
            if (ownerId) {
              updates.push("status = 'assigned'");
              updates.push("assigned_date = NOW()");
            } else {
              updates.push("status = 'available'");
              updates.push("assigned_date = NULL");
            }
          }

          if (status) {
            updates.push("status = ?");
            params.push(status);
          }

          if (updates.length > 0) {
            params.push(numberId);
            await execute(`UPDATE phone_numbers SET ${updates.join(", ")} WHERE id = ?`, params);

            await execute(
              "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
              [adminId, "number_updated", "phone_number", numberId, JSON.stringify({ ownerId, status })]
            );
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

          const requests = await query(
            `SELECT nr.*, u.name as user_name, u.email as user_email 
             FROM number_requests nr 
             JOIN users u ON nr.user_id = u.id 
             WHERE nr.status = ? 
             ORDER BY nr.created_at ASC`,
            [status]
          );

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

          const updates: string[] = ["status = ?", "processed_at = NOW()"];
          const params: unknown[] = [status];

          if (adminNotes) {
            updates.push("admin_notes = ?");
            params.push(adminNotes);
          }

          if (assignedNumberId) {
            updates.push("assigned_number_id = ?");
            params.push(assignedNumberId);

            // Get request user and assign number
            const requests = await query<{ user_id: number }>(
              "SELECT user_id FROM number_requests WHERE id = ?",
              [requestId]
            );

            if (requests.length > 0) {
              await execute(
                "UPDATE phone_numbers SET owner_id = ?, status = 'assigned', assigned_date = NOW() WHERE id = ?",
                [requests[0].user_id, assignedNumberId]
              );
            }
          }

          params.push(requestId);
          await execute(`UPDATE number_requests SET ${updates.join(", ")} WHERE id = ?`, params);

          return new Response(
            JSON.stringify({ message: "Request updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // System analytics
      case "analytics": {
        const totalUsers = await query<{ count: number }>("SELECT COUNT(*) as count FROM users");
        const activeUsers = await query<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
        const totalCalls = await query<{ count: number }>("SELECT COUNT(*) as count FROM calls");
        const totalNumbers = await query<{ count: number }>("SELECT COUNT(*) as count FROM phone_numbers");
        const assignedNumbers = await query<{ count: number }>("SELECT COUNT(*) as count FROM phone_numbers WHERE status = 'assigned'");
        const pendingRequests = await query<{ count: number }>("SELECT COUNT(*) as count FROM number_requests WHERE status = 'pending'");

        const recentActivity = await query(
          `SELECT al.*, u.name as user_name 
           FROM activity_logs al 
           LEFT JOIN users u ON al.user_id = u.id 
           ORDER BY al.created_at DESC 
           LIMIT 20`
        );

        const callsByDay = await query(
          `SELECT DATE(start_time) as date, COUNT(*) as count 
           FROM calls 
           WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
           GROUP BY DATE(start_time) 
           ORDER BY date`
        );

        return new Response(
          JSON.stringify({
            stats: {
              totalUsers: totalUsers[0]?.count || 0,
              activeUsers: activeUsers[0]?.count || 0,
              totalCalls: totalCalls[0]?.count || 0,
              totalNumbers: totalNumbers[0]?.count || 0,
              assignedNumbers: assignedNumbers[0]?.count || 0,
              pendingRequests: pendingRequests[0]?.count || 0,
            },
            recentActivity,
            callsByDay,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // API Keys management
      case "api-keys": {
        if (req.method === "GET") {
          const userId = url.searchParams.get("user_id");

          let whereClause = "WHERE 1=1";
          const params: unknown[] = [];

          if (userId) {
            whereClause += " AND ak.user_id = ?";
            params.push(userId);
          }

          const keys = await query(
            `SELECT ak.*, u.name as user_name, u.email as user_email 
             FROM api_keys ak 
             JOIN users u ON ak.user_id = u.id 
             ${whereClause} 
             ORDER BY ak.creation_date DESC`,
            params
          );

          return new Response(
            JSON.stringify({ keys }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "PATCH") {
          const keyId = url.searchParams.get("id");
          const { status } = await req.json();

          if (!keyId || !status) {
            return new Response(
              JSON.stringify({ error: "Key ID and status are required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          await execute("UPDATE api_keys SET status = ? WHERE id = ?", [status, keyId]);

          return new Response(
            JSON.stringify({ message: "API key updated successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      // Invite tokens management
      case "invite-tokens": {
        if (req.method === "GET") {
          const tokens = await query(
            `SELECT st.*, u.name as created_by_name, ub.name as used_by_name, ub.email as used_by_email 
             FROM signup_tokens st 
             LEFT JOIN users u ON st.created_by = u.id 
             LEFT JOIN users ub ON st.used_by = ub.id 
             ORDER BY st.created_at DESC`
          );

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
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ")
            : null;

          const result = await execute(
            `INSERT INTO signup_tokens (token, email, expires_at, created_by) VALUES (?, ?, ?, ?)`,
            [inviteToken, email?.toLowerCase().trim() || null, expiresAt, adminId]
          );

          await execute(
            "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
            [adminId, "invite_created", "signup_token", result.lastInsertId, JSON.stringify({ email, expiresInDays })]
          );

          return new Response(
            JSON.stringify({ 
              id: result.lastInsertId, 
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

          await execute("DELETE FROM signup_tokens WHERE id = ? AND used = 0", [tokenId]);

          await execute(
            "INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)",
            [adminId, "invite_deleted", "signup_token", tokenId]
          );

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
