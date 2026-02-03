import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

interface UserAnalytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_duration_seconds: number;
  total_cost: number;
  last_call_date: string | null;
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
      case "summary": {
        // Get user analytics
        const analytics = await query<UserAnalytics>(
          `SELECT total_calls, successful_calls, failed_calls, 
                  total_duration_seconds, total_cost, last_call_date 
           FROM user_analytics WHERE user_id = ?`,
          [userId]
        );

        if (analytics.length === 0) {
          return new Response(
            JSON.stringify({
              total_calls: 0,
              successful_calls: 0,
              failed_calls: 0,
              total_duration_seconds: 0,
              total_cost: 0,
              last_call_date: null,
              success_rate: 0,
              avg_duration: 0,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = analytics[0];
        const successRate = data.total_calls > 0 
          ? Math.round((data.successful_calls / data.total_calls) * 100) 
          : 0;
        const avgDuration = data.successful_calls > 0 
          ? Math.round(data.total_duration_seconds / data.successful_calls) 
          : 0;

        return new Response(
          JSON.stringify({
            ...data,
            success_rate: successRate,
            avg_duration: avgDuration,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "daily": {
        const days = parseInt(url.searchParams.get("days") || "7");
        
        const dailyStats = await query<{ date: string; calls: number; duration: number }>(
          `SELECT DATE(start_time) as date, 
                  COUNT(*) as calls, 
                  SUM(duration_seconds) as duration 
           FROM calls 
           WHERE user_id = ? AND start_time >= DATE_SUB(NOW(), INTERVAL ? DAY) 
           GROUP BY DATE(start_time) 
           ORDER BY date`,
          [userId, days]
        );

        return new Response(
          JSON.stringify({ daily: dailyStats }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "top-numbers": {
        const topNumbers = await query<{ to_number: string; call_count: number; total_duration: number }>(
          `SELECT to_number, 
                  COUNT(*) as call_count, 
                  SUM(duration_seconds) as total_duration 
           FROM calls 
           WHERE user_id = ? 
           GROUP BY to_number 
           ORDER BY call_count DESC 
           LIMIT 10`,
          [userId]
        );

        return new Response(
          JSON.stringify({ topNumbers }),
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
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
