import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query, execute } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

interface Call {
  id: number;
  user_id: number;
  from_number: string;
  to_number: string;
  direction: string;
  duration_seconds: number;
  start_time: string;
  end_time: string | null;
  status: string;
  cost: number;
  notes: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verify authentication
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

  try {
    switch (req.method) {
      case "GET": {
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;
        const status = url.searchParams.get("status");

        let whereClause = "WHERE user_id = ?";
        const params: unknown[] = [userId];

        if (status) {
          whereClause += " AND status = ?";
          params.push(status);
        }

        // Get total count
        const countResult = await query<{ count: number }>(
          `SELECT COUNT(*) as count FROM calls ${whereClause}`,
          params
        );
        const total = countResult[0]?.count || 0;

        // Get calls
        const calls = await query<Call>(
          `SELECT id, user_id, from_number, to_number, direction, duration_seconds, 
                  start_time, end_time, status, cost, notes 
           FROM calls ${whereClause} 
           ORDER BY start_time DESC 
           LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return new Response(
          JSON.stringify({
            calls,
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        const { toNumber, fromNumber } = await req.json();

        if (!toNumber) {
          return new Response(
            JSON.stringify({ error: "To number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate phone number format
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(toNumber.replace(/[\s\-\(\)]/g, ""))) {
          return new Response(
            JSON.stringify({ error: "Invalid phone number format" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user's assigned number if not provided
        let callerNumber = fromNumber;
        if (!callerNumber) {
          const numbers = await query<{ phone_number: string }>(
            "SELECT phone_number FROM phone_numbers WHERE owner_id = ? AND status = 'assigned' LIMIT 1",
            [userId]
          );
          callerNumber = numbers.length > 0 ? numbers[0].phone_number : "+19096874971";
        }

        // Create call record
        const result = await execute(
          `INSERT INTO calls (user_id, from_number, to_number, direction, status) 
           VALUES (?, ?, ?, 'outbound', 'initiated')`,
          [userId, callerNumber, toNumber]
        );

        const callId = result.lastInsertId;

        // Log activity
        await execute(
          "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
          [userId, "call_initiated", "call", callId, JSON.stringify({ to: toNumber })]
        );

        return new Response(
          JSON.stringify({
            id: callId,
            from_number: callerNumber,
            to_number: toNumber,
            status: "initiated",
            message: "Call initiated successfully",
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "PATCH": {
        const callId = url.searchParams.get("id");
        if (!callId) {
          return new Response(
            JSON.stringify({ error: "Call ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { status, duration_seconds, notes } = await req.json();

        // Verify call belongs to user
        const calls = await query<Call>(
          "SELECT id, user_id FROM calls WHERE id = ? AND user_id = ?",
          [callId, userId]
        );

        if (calls.length === 0) {
          return new Response(
            JSON.stringify({ error: "Call not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: string[] = [];
        const params: unknown[] = [];

        if (status) {
          updates.push("status = ?");
          params.push(status);

          if (status === "completed" || status === "failed" || status === "no_answer" || status === "busy") {
            updates.push("end_time = NOW()");
          }
        }

        if (duration_seconds !== undefined) {
          updates.push("duration_seconds = ?");
          params.push(duration_seconds);

          // Calculate cost (mock: $0.02 per minute)
          const cost = (duration_seconds / 60) * 0.02;
          updates.push("cost = ?");
          params.push(cost.toFixed(4));
        }

        if (notes) {
          updates.push("notes = ?");
          params.push(notes);
        }

        if (updates.length > 0) {
          params.push(callId);
          await execute(
            `UPDATE calls SET ${updates.join(", ")} WHERE id = ?`,
            params
          );

          // Update analytics if call completed
          if (status === "completed" || status === "failed") {
            const successField = status === "completed" ? "successful_calls" : "failed_calls";
            await execute(
              `UPDATE user_analytics SET 
                total_calls = total_calls + 1,
                ${successField} = ${successField} + 1,
                total_duration_seconds = total_duration_seconds + ?,
                total_cost = total_cost + ?,
                last_call_date = NOW(),
                updated_at = NOW()
               WHERE user_id = ?`,
              [duration_seconds || 0, (duration_seconds || 0) / 60 * 0.02, userId]
            );
          }
        }

        return new Response(
          JSON.stringify({ message: "Call updated successfully" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Calls error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
