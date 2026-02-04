import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

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

        let query = supabase
          .from("voip_calls")
          .select("*", { count: "exact" })
          .eq("user_id", userId);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: calls, count, error } = await query
          .order("start_time", { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            calls,
            pagination: {
              page,
              limit,
              total: count || 0,
              totalPages: Math.ceil((count || 0) / limit),
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
          const { data: numbers } = await supabase
            .from("voip_phone_numbers")
            .select("phone_number")
            .eq("user_id", userId)
            .eq("status", "assigned")
            .limit(1);

          callerNumber = numbers && numbers.length > 0 ? numbers[0].phone_number : "+19096874971";
        }

        // Create call record
        const { data: call, error } = await supabase
          .from("voip_calls")
          .insert({
            user_id: userId,
            from_number: callerNumber,
            to_number: toNumber,
            direction: "outbound",
            status: "initiated",
          })
          .select("id")
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            id: call.id,
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

        const { status, duration_seconds } = await req.json();

        // Verify call belongs to user
        const { data: calls } = await supabase
          .from("voip_calls")
          .select("id")
          .eq("id", parseInt(callId))
          .eq("user_id", userId);

        if (!calls || calls.length === 0) {
          return new Response(
            JSON.stringify({ error: "Call not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {};

        if (status) {
          updates.status = status;
          if (status === "completed" || status === "failed" || status === "no_answer" || status === "busy") {
            updates.end_time = new Date().toISOString();
          }
        }

        if (duration_seconds !== undefined) {
          updates.duration_seconds = duration_seconds;
          // Calculate cost (mock: $0.02 per minute)
          updates.cost = parseFloat(((duration_seconds / 60) * 0.02).toFixed(4));
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("voip_calls")
            .update(updates)
            .eq("id", parseInt(callId));

          if (error) throw error;
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
