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
      case "summary": {
        // Get user's call statistics from the calls table
        const { data: calls, error } = await supabase
          .from("voip_calls")
          .select("status, duration_seconds, cost, start_time")
          .eq("user_id", userId);

        if (error) throw error;

        const totalCalls = calls?.length || 0;
        const successfulCalls = calls?.filter(c => c.status === "completed").length || 0;
        const failedCalls = calls?.filter(c => c.status === "failed").length || 0;
        const totalDuration = calls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0;
        const totalCost = calls?.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0) || 0;
        
        const lastCall = calls?.sort((a, b) => 
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )[0];

        const successRate = totalCalls > 0 
          ? Math.round((successfulCalls / totalCalls) * 100) 
          : 0;
        const avgDuration = successfulCalls > 0 
          ? Math.round(totalDuration / successfulCalls) 
          : 0;

        return new Response(
          JSON.stringify({
            total_calls: totalCalls,
            successful_calls: successfulCalls,
            failed_calls: failedCalls,
            total_duration_seconds: totalDuration,
            total_cost: totalCost,
            last_call_date: lastCall?.start_time || null,
            success_rate: successRate,
            avg_duration: avgDuration,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "daily": {
        const days = parseInt(url.searchParams.get("days") || "7");
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: calls, error } = await supabase
          .from("voip_calls")
          .select("start_time, duration_seconds")
          .eq("user_id", userId)
          .gte("start_time", startDate.toISOString());

        if (error) throw error;

        // Group by date
        const dailyStats: Record<string, { calls: number; duration: number }> = {};
        
        calls?.forEach(call => {
          const date = call.start_time.split("T")[0];
          if (!dailyStats[date]) {
            dailyStats[date] = { calls: 0, duration: 0 };
          }
          dailyStats[date].calls++;
          dailyStats[date].duration += call.duration_seconds || 0;
        });

        const daily = Object.entries(dailyStats)
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(
          JSON.stringify({ daily }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "top-numbers": {
        const { data: calls, error } = await supabase
          .from("voip_calls")
          .select("to_number, duration_seconds")
          .eq("user_id", userId);

        if (error) throw error;

        // Aggregate by to_number
        const numberStats: Record<string, { call_count: number; total_duration: number }> = {};
        
        calls?.forEach(call => {
          if (!numberStats[call.to_number]) {
            numberStats[call.to_number] = { call_count: 0, total_duration: 0 };
          }
          numberStats[call.to_number].call_count++;
          numberStats[call.to_number].total_duration += call.duration_seconds || 0;
        });

        const topNumbers = Object.entries(numberStats)
          .map(([to_number, stats]) => ({ to_number, ...stats }))
          .sort((a, b) => b.call_count - a.call_count)
          .slice(0, 10);

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
