import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query, execute } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

interface PhoneNumber {
  id: number;
  phone_number: string;
  friendly_name: string;
  location_city: string;
  location_state: string;
  location_country: string;
  owner_id: number | null;
  status: string;
  number_type: string;
  monthly_cost: number;
}

interface NumberRequest {
  id: number;
  user_id: number;
  area_code: string;
  city_preference: string;
  number_type: string;
  business_name: string;
  business_website: string;
  reason: string;
  status: string;
  created_at: string;
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
        const numbers = await query<PhoneNumber>(
          `SELECT id, phone_number, friendly_name, location_city, location_state, 
                  location_country, status, number_type, monthly_cost 
           FROM phone_numbers 
           WHERE owner_id = ? 
           ORDER BY assigned_date DESC`,
          [userId]
        );

        return new Response(
          JSON.stringify({ numbers }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "available": {
        const areaCode = url.searchParams.get("area_code");
        const numberType = url.searchParams.get("type") || "local";

        let whereClause = "WHERE status = 'available' AND number_type = ?";
        const params: unknown[] = [numberType];

        if (areaCode) {
          whereClause += " AND phone_number LIKE ?";
          params.push(`%${areaCode}%`);
        }

        const numbers = await query<PhoneNumber>(
          `SELECT id, phone_number, friendly_name, location_city, location_state, 
                  location_country, number_type, monthly_cost 
           FROM phone_numbers 
           ${whereClause} 
           ORDER BY phone_number 
           LIMIT 20`,
          params
        );

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

        const { areaCode, cityPreference, numberType, businessName, businessWebsite, reason } = await req.json();

        if (!businessName) {
          return new Response(
            JSON.stringify({ error: "Business name is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for pending requests
        const pendingRequests = await query<{ count: number }>(
          "SELECT COUNT(*) as count FROM number_requests WHERE user_id = ? AND status = 'pending'",
          [userId]
        );

        if (pendingRequests[0]?.count >= 3) {
          return new Response(
            JSON.stringify({ error: "You have too many pending requests. Please wait for approval." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await execute(
          `INSERT INTO number_requests 
           (user_id, area_code, city_preference, number_type, business_name, business_website, reason) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, areaCode || null, cityPreference || null, numberType || "local", businessName, businessWebsite || null, reason || null]
        );

        // Log activity
        await execute(
          "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
          [userId, "number_request", "number_request", result.lastInsertId, JSON.stringify({ businessName })]
        );

        return new Response(
          JSON.stringify({ 
            id: result.lastInsertId,
            message: "Number request submitted successfully" 
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "my-requests": {
        const requests = await query<NumberRequest>(
          `SELECT id, area_code, city_preference, number_type, business_name, 
                  business_website, reason, status, created_at 
           FROM number_requests 
           WHERE user_id = ? 
           ORDER BY created_at DESC`,
          [userId]
        );

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
