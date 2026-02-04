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
  if (!payload) {
    return new Response(
      JSON.stringify({ error: "Invalid token" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = parseInt(payload.sub);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "my-numbers": {
        const { data: numbers, error } = await supabase
          .from("voip_phone_numbers")
          .select("id, phone_number, friendly_name, status, monthly_cost, assigned_at")
          .eq("user_id", userId)
          .order("assigned_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ numbers }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "available": {
        const areaCode = url.searchParams.get("area_code");

        let query = supabase
          .from("voip_phone_numbers")
          .select("id, phone_number, friendly_name, monthly_cost")
          .eq("status", "available");

        if (areaCode) {
          query = query.ilike("phone_number", `%${areaCode}%`);
        }

        const { data: numbers, error } = await query.limit(20);

        if (error) throw error;

        return new Response(
          JSON.stringify({ numbers }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "request": {
        if (req.method !== "POST") {
          return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { areaCode, country, numberType } = await req.json();

        // Check for pending requests
        const { count: pendingCount } = await supabase
          .from("voip_number_requests")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "pending");

        if (pendingCount && pendingCount >= 3) {
          return new Response(
            JSON.stringify({ error: "You have too many pending requests. Please wait for approval." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("voip_number_requests")
          .insert({
            user_id: userId,
            area_code: areaCode || null,
            country: country || "US",
            number_type: numberType || "local",
            status: "pending",
          })
          .select("id")
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            id: data.id,
            message: "Number request submitted successfully" 
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "my-requests": {
        const { data: requests, error } = await supabase
          .from("voip_number_requests")
          .select("id, area_code, country, number_type, status, admin_notes, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ requests }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Numbers error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
