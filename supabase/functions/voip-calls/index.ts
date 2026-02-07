import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

async function checkCaseCloseBonus(userId: number) {
  try {
    // Get the client's partner_id
    const { data: user } = await supabase
      .from("voip_users")
      .select("id, partner_id")
      .eq("id", userId)
      .maybeSingle();

    if (!user?.partner_id) {
      console.log("[case-close-bonus] User has no partner, skipping bonus check");
      return;
    }

    const partnerId = user.partner_id;

    // Get partner settings
    const { data: settings } = await supabase
      .from("voip_partner_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!settings?.bonus_enabled) {
      console.log("[case-close-bonus] Bonus not enabled, skipping");
      return;
    }

    // Check if bonus already applied for this client (if once per client)
    if (settings.apply_bonus_once_per_client) {
      const { data: existingBonus } = await supabase
        .from("voip_revenue_events")
        .select("id")
        .eq("client_id", userId)
        .eq("partner_id", partnerId)
        .eq("type", "case_bonus")
        .limit(1);

      if (existingBonus && existingBonus.length > 0) {
        console.log("[case-close-bonus] Bonus already applied for this client, skipping");
        return;
      }
    }

    // Calculate bonus amount
    let bonusAmount = 0;
    if (settings.bonus_type === "flat_amount") {
      bonusAmount = Number(settings.bonus_value);
    } else if (settings.bonus_type === "percentage") {
      // Percentage of... we'll use a fixed reference or just the bonus_value as a dollar amount
      bonusAmount = Number(settings.bonus_value);
    }

    if (bonusAmount <= 0) {
      console.log("[case-close-bonus] Bonus amount is 0, skipping");
      return;
    }

    // Create revenue event
    const { data: event, error: evtErr } = await supabase
      .from("voip_revenue_events")
      .insert({
        client_id: userId,
        partner_id: partnerId,
        amount: bonusAmount,
        type: "case_bonus",
        description: `Case-close bonus for client #${userId}`,
      })
      .select("id")
      .single();

    if (evtErr) {
      console.error("[case-close-bonus] Error creating revenue event:", evtErr);
      return;
    }

    // Create commission
    const commissionRate = Number(settings.commission_rate) || 0.05;
    const commissionAmount = bonusAmount * commissionRate;

    await supabase.from("voip_commissions").insert({
      revenue_event_id: event.id,
      partner_id: partnerId,
      commission_amount: commissionAmount,
      commission_rate: commissionRate,
      status: "pending",
    });

    console.log(`[case-close-bonus] Created bonus: $${bonusAmount}, commission: $${commissionAmount} for partner ${partnerId}`);
  } catch (err) {
    console.error("[case-close-bonus] Error:", err);
  }
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

  const userRole = payload.role;

  try {
    switch (req.method) {
      case "GET": {
        const action = url.searchParams.get("action");

        // Admin-only: get calls for a specific user
        if (action === "user-calls") {
          if (userRole !== "admin") {
            return new Response(
              JSON.stringify({ error: "Admin access required" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const targetUserId = url.searchParams.get("userId");
          if (!targetUserId) {
            return new Response(
              JSON.stringify({ error: "userId is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { data: calls, error } = await supabase
            .from("voip_calls")
            .select("id, to_number, from_number, start_time, duration_seconds, outcome, status")
            .eq("user_id", parseInt(targetUserId))
            .order("start_time", { ascending: false })
            .limit(50);

          if (error) throw error;

          return new Response(
            JSON.stringify({ calls: calls || [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Default: get current user's calls
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

        const body = await req.json();
        const { status, duration_seconds, outcome } = body;

        // Verify call belongs to user
        const { data: calls } = await supabase
          .from("voip_calls")
          .select("id, user_id")
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

        if (outcome) {
          updates.outcome = outcome;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from("voip_calls")
            .update(updates)
            .eq("id", parseInt(callId));

          if (error) throw error;
        }

        // Check for case-close bonus when outcome is a "closed" type
        const closedOutcomes = ["closed", "case_closed", "sold", "won", "converted"];
        if (outcome && closedOutcomes.includes(outcome.toLowerCase())) {
          console.log(`[voip-calls] Case closed outcome detected for user ${userId}, checking bonus...`);
          // Fire and forget - don't block the response
          checkCaseCloseBonus(userId).catch(e => console.error("[voip-calls] Bonus check error:", e));
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
