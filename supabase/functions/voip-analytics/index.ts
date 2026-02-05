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
  const userRole = payload.role;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "heartbeat": {
        // Update or create session heartbeat
        const { data: existingSession } = await supabase
          .from("voip_user_sessions")
          .select("id, session_start, total_active_seconds")
          .eq("user_id", userId)
          .is("session_end", null)
          .order("session_start", { ascending: false })
          .limit(1)
          .single();

        if (existingSession) {
          // Update existing session
          const now = new Date();
          const lastHeartbeat = new Date(existingSession.session_start);
          const additionalSeconds = Math.min(35, Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000));
          
          await supabase
            .from("voip_user_sessions")
            .update({
              last_heartbeat: now.toISOString(),
              is_idle: false,
              total_active_seconds: (existingSession.total_active_seconds || 0) + additionalSeconds,
            })
            .eq("id", existingSession.id);
        } else {
          // Create new session
          await supabase.from("voip_user_sessions").insert({
            user_id: userId,
            session_start: new Date().toISOString(),
            last_heartbeat: new Date().toISOString(),
            is_idle: false,
            total_active_seconds: 0,
          });
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "idle": {
        // Mark session as idle
        await supabase
          .from("voip_user_sessions")
          .update({ is_idle: true })
          .eq("user_id", userId)
          .is("session_end", null);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "end-session": {
        // End session on logout
        await supabase
          .from("voip_user_sessions")
          .update({ session_end: new Date().toISOString() })
          .eq("user_id", userId)
          .is("session_end", null);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "track-event": {
        // Track activity event
        const { eventType, leadId, metadata } = await req.json();

        if (!eventType) {
          return new Response(
            JSON.stringify({ error: "eventType is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("voip_activity_events").insert({
          user_id: userId,
          event_type: eventType,
          lead_id: leadId || null,
          metadata: metadata || null,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "my-stats": {
        // Get personal stats for the current user
        const { data: calls } = await supabase
          .from("voip_calls")
          .select("outcome, duration_seconds, session_duration_seconds, appointment_created, start_time")
          .eq("user_id", userId);

        const totalCalls = calls?.length || 0;
        const outcomes: Record<string, number> = {};
        let totalDuration = 0;
        let totalSessionTime = 0;
        let appointmentsCreated = 0;
         let interestedCount = 0;

        calls?.forEach(call => {
          if (call.outcome) {
            outcomes[call.outcome] = (outcomes[call.outcome] || 0) + 1;
             if (call.outcome === "interested") interestedCount++;
          }
          totalDuration += call.duration_seconds || 0;
          totalSessionTime += call.session_duration_seconds || 0;
          if (call.appointment_created) appointmentsCreated++;
        });

        // Get activity events
        const { data: events } = await supabase
          .from("voip_activity_events")
          .select("event_type")
          .eq("user_id", userId);

        const leadsRequested = events?.filter(e => e.event_type === "lead_requested").length || 0;
        const leadsCompleted = events?.filter(e => e.event_type === "lead_completed").length || 0;

        // Get session stats
        const { data: sessions } = await supabase
          .from("voip_user_sessions")
          .select("total_active_seconds, session_start")
          .eq("user_id", userId);

        const totalActiveTime = sessions?.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0) || 0;

        // Daily activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyActivity: Record<string, number> = {};
        calls?.forEach(call => {
          if (call.start_time) {
            const date = call.start_time.split("T")[0];
            dailyActivity[date] = (dailyActivity[date] || 0) + 1;
          }
        });

        return new Response(
          JSON.stringify({
            totalCalls,
            outcomes,
            leadsRequested,
            leadsCompleted,
            completionRate: leadsRequested > 0 ? Math.round((leadsCompleted / leadsRequested) * 100) : 0,
             conversionRate: interestedCount > 0 ? Math.round((appointmentsCreated / interestedCount) * 100) : 0,
            avgTimePerLead: leadsCompleted > 0 ? Math.round(totalSessionTime / leadsCompleted) : 0,
            totalActiveTime,
            appointmentsCreated,
            dailyActivity: Object.entries(dailyActivity)
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date)),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

       case "my-sessions": {
         // Get call sessions for the current user with lead info
         const { data: calls } = await supabase
           .from("voip_calls")
           .select("id, start_time, duration_seconds, outcome, notes, lead_id, appointment_created")
           .eq("user_id", userId)
           .order("start_time", { ascending: false })
           .limit(100);
 
         if (!calls || calls.length === 0) {
           return new Response(
             JSON.stringify({ sessions: [] }),
             { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
 
         // Get lead info
         const leadIds = [...new Set(calls.map(c => c.lead_id).filter(Boolean))];
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
 
         const sessions = calls.map(call => ({
           id: call.id,
           start_time: call.start_time,
           duration_seconds: call.duration_seconds || 0,
           outcome: call.outcome,
           notes: call.notes,
           lead_name: call.lead_id ? leadMap.get(call.lead_id)?.name : null,
           lead_phone: call.lead_id ? leadMap.get(call.lead_id)?.phone || "Unknown" : "Unknown",
           appointment_created: call.appointment_created || false,
         }));
 
         return new Response(
           JSON.stringify({ sessions }),
           { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
      case "admin-stats": {
        // Admin only - system-wide analytics
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all calls
        const { data: calls } = await supabase
          .from("voip_calls")
          .select("user_id, outcome, session_duration_seconds, appointment_created, start_time");

        // Get all activity events
        const { data: events } = await supabase
          .from("voip_activity_events")
          .select("user_id, event_type, created_at");

        // Calculate system-wide stats
        const totalCalls = calls?.length || 0;
        const leadsRequested = events?.filter(e => e.event_type === "lead_requested").length || 0;
        const leadsCompleted = events?.filter(e => e.event_type === "lead_completed").length || 0;
        const appointmentsCreated = calls?.filter(c => c.appointment_created).length || 0;

        // Outcomes breakdown
        const outcomes: Record<string, number> = {};
        calls?.forEach(call => {
          if (call.outcome) {
            outcomes[call.outcome] = (outcomes[call.outcome] || 0) + 1;
          }
        });

        // Daily call volume (last 14 days)
        const dailyCalls: Record<string, number> = {};
        calls?.forEach(call => {
          if (call.start_time) {
            const date = call.start_time.split("T")[0];
            dailyCalls[date] = (dailyCalls[date] || 0) + 1;
          }
        });

        // Per-user leaderboard
        const userStats: Record<number, { calls: number; appointments: number }> = {};
        calls?.forEach(call => {
          if (call.user_id) {
            if (!userStats[call.user_id]) {
              userStats[call.user_id] = { calls: 0, appointments: 0 };
            }
            userStats[call.user_id].calls++;
            if (call.appointment_created) userStats[call.user_id].appointments++;
          }
        });

        // Get user names
        const userIds = Object.keys(userStats).map(Number);
        let leaderboard: { userId: number; name: string; calls: number; appointments: number }[] = [];
        
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", userIds);

          leaderboard = userIds.map(uid => ({
            userId: uid,
            name: users?.find(u => u.id === uid)?.name || users?.find(u => u.id === uid)?.email || "Unknown",
            calls: userStats[uid].calls,
            appointments: userStats[uid].appointments,
          })).sort((a, b) => b.calls - a.calls);
        }

        return new Response(
          JSON.stringify({
            totalCalls,
            leadsRequested,
            leadsCompleted,
            completionRate: leadsRequested > 0 ? Math.round((leadsCompleted / leadsRequested) * 100) : 0,
            appointmentsCreated,
            conversionRate: leadsCompleted > 0 ? Math.round((appointmentsCreated / leadsCompleted) * 100) : 0,
            outcomes,
            dailyCalls: Object.entries(dailyCalls)
              .map(([date, count]) => ({ date, count }))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-14),
            leaderboard: leaderboard.slice(0, 10),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "online-users": {
        // Admin only - get currently online users
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

        const { data: sessions } = await supabase
          .from("voip_user_sessions")
          .select("user_id, last_heartbeat, is_idle, total_active_seconds")
          .is("session_end", null)
          .gte("last_heartbeat", thirtySecondsAgo);

        if (!sessions || sessions.length === 0) {
          return new Response(
            JSON.stringify({ onlineUsers: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userIds = sessions.map(s => s.user_id);
        const { data: users } = await supabase
          .from("voip_users")
          .select("id, name, email")
          .in("id", userIds);

        const onlineUsers = sessions.map(session => ({
          userId: session.user_id,
          name: users?.find(u => u.id === session.user_id)?.name || "Unknown",
          isIdle: session.is_idle,
          lastHeartbeat: session.last_heartbeat,
          sessionTime: session.total_active_seconds,
        }));

        return new Response(
          JSON.stringify({ onlineUsers }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "user-sessions": {
        // Admin only - get session history for a user
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

        const { data: sessions } = await supabase
          .from("voip_user_sessions")
          .select("*")
          .eq("user_id", parseInt(targetUserId))
          .order("session_start", { ascending: false })
          .limit(50);

        // Calculate time summaries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(todayStart);
        monthStart.setDate(monthStart.getDate() - 30);

        let todayTime = 0;
        let weekTime = 0;
        let monthTime = 0;

        sessions?.forEach(session => {
          const sessionStart = new Date(session.session_start);
          const activeSeconds = session.total_active_seconds || 0;
          
          if (sessionStart >= todayStart) todayTime += activeSeconds;
          if (sessionStart >= weekStart) weekTime += activeSeconds;
          if (sessionStart >= monthStart) monthTime += activeSeconds;
        });

        return new Response(
          JSON.stringify({
            sessions: sessions || [],
            summary: {
              today: todayTime,
              week: weekTime,
              month: monthTime,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reset-analytics": {
        // Admin only - reset all analytics data
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { includeCallLogs } = await req.json();

        // Delete activity events
        await supabase.from("voip_activity_events").delete().neq("id", 0);

        // Delete user sessions
        await supabase.from("voip_user_sessions").delete().neq("id", 0);

        // Optionally delete call logs
        if (includeCallLogs) {
          await supabase.from("voip_calls").delete().neq("id", 0);
        }

        // Log the action
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "reset_analytics",
          entity_type: "analytics",
          details: { includeCallLogs },
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

       case "leaderboard": {
         // Get leaderboard data - accessible to all users
         const period = url.searchParams.get("period") || "today";
         
         // Get date ranges
         const now = new Date();
         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
         const weekStart = new Date(now);
         weekStart.setDate(weekStart.getDate() - 7);
         const monthStart = new Date(now);
         monthStart.setMonth(monthStart.getMonth() - 1);
 
         // Get all calls with user info
         const { data: leaderboardCalls } = await supabase
           .from("voip_calls")
           .select("user_id, outcome, appointment_created, start_time")
           .gte("start_time", monthStart.toISOString());
 
         // Get all client users
         const { data: clientUsers } = await supabase
           .from("voip_users")
           .select("id, name")
           .eq("role", "client");
 
         // Build stats per user
         const leaderboardStats = new Map<number, {
           calls_today: number;
           calls_week: number;
           calls_month: number;
           appointments_today: number;
           appointments_week: number;
           appointments_month: number;
         }>();
 
         clientUsers?.forEach(u => {
           leaderboardStats.set(u.id, {
             calls_today: 0,
             calls_week: 0,
             calls_month: 0,
             appointments_today: 0,
             appointments_week: 0,
             appointments_month: 0,
           });
         });
 
         leaderboardCalls?.forEach(call => {
           if (!call.user_id || !leaderboardStats.has(call.user_id)) return;
           const stats = leaderboardStats.get(call.user_id)!;
           const callDate = new Date(call.start_time);
 
           // Month stats
           stats.calls_month++;
           if (call.appointment_created) stats.appointments_month++;
 
           // Week stats
           if (callDate >= weekStart) {
             stats.calls_week++;
             if (call.appointment_created) stats.appointments_week++;
           }
 
           // Today stats
           if (call.start_time >= todayStart) {
             stats.calls_today++;
             if (call.appointment_created) stats.appointments_today++;
           }
         });
 
         const leaderboard = clientUsers?.map(u => {
           const stats = leaderboardStats.get(u.id) || {
             calls_today: 0, calls_week: 0, calls_month: 0,
             appointments_today: 0, appointments_week: 0, appointments_month: 0,
           };
           
           const totalCalls = stats.calls_month;
           const totalAppts = stats.appointments_month;
           const conversionRate = totalCalls > 0 ? (totalAppts / totalCalls) * 100 : 0;
 
           return {
             user_id: u.id,
             user_name: u.name,
             ...stats,
             conversion_rate: Math.round(conversionRate * 10) / 10,
           };
         }) || [];
 
         return new Response(
           JSON.stringify({ leaderboard }),
           { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
      case "user-performance": {
        // Admin only - per-user leads requested/completed/rate/appointments
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all client users
        const { data: allUsers } = await supabase
          .from("voip_users")
          .select("id, name, email")
          .eq("role", "client");

        if (!allUsers || allUsers.length === 0) {
          return new Response(
            JSON.stringify({ users: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const allUserIds = allUsers.map(u => u.id);

        // Get activity events for all users
        const { data: allEvents } = await supabase
          .from("voip_activity_events")
          .select("user_id, event_type")
          .in("user_id", allUserIds);

        // Get call counts and appointments per user
        const { data: allCalls } = await supabase
          .from("voip_calls")
          .select("user_id, appointment_created")
          .in("user_id", allUserIds);

        const userPerfMap = new Map<number, {
          leadsRequested: number;
          leadsCompleted: number;
          totalCalls: number;
          appointmentsCreated: number;
        }>();

        allUserIds.forEach(uid => {
          userPerfMap.set(uid, { leadsRequested: 0, leadsCompleted: 0, totalCalls: 0, appointmentsCreated: 0 });
        });

        allEvents?.forEach(e => {
          const stats = userPerfMap.get(e.user_id);
          if (!stats) return;
          if (e.event_type === "lead_requested") stats.leadsRequested++;
          if (e.event_type === "lead_completed") stats.leadsCompleted++;
        });

        allCalls?.forEach(c => {
          const stats = userPerfMap.get(c.user_id);
          if (!stats) return;
          stats.totalCalls++;
          if (c.appointment_created) stats.appointmentsCreated++;
        });

        const perfUsers = allUsers.map(u => {
          const stats = userPerfMap.get(u.id)!;
          return {
            userId: u.id,
            name: u.name || u.email,
            leadsRequested: stats.leadsRequested,
            leadsCompleted: stats.leadsCompleted,
            completionRate: stats.leadsRequested > 0 ? Math.round((stats.leadsCompleted / stats.leadsRequested) * 100) : 0,
            totalCalls: stats.totalCalls,
            appointmentsCreated: stats.appointmentsCreated,
          };
        }).sort((a, b) => b.totalCalls - a.totalCalls);

        return new Response(
          JSON.stringify({ users: perfUsers }),
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
