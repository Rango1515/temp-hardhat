import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const token = extractToken(authHeader);
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = {
      id: parseInt(payload.sub),
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // GET preferences
    if (req.method === "GET" && action === "get") {
      const { data: prefs } = await supabase
        .from("voip_user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const preferences = prefs || {
        theme: "dark",
        accent_color: "orange",
        notifications_enabled: true,
        sound_enabled: true,
      };

      return new Response(JSON.stringify({ preferences }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SAVE preferences
    if (req.method === "POST" && action === "save") {
      const body = await req.json();
      const { theme, accentColor, notificationsEnabled, soundEnabled } = body;

      const { data: existing } = await supabase
        .from("voip_user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const prefsData = {
        theme: theme || "dark",
        accent_color: accentColor || "orange",
        notifications_enabled: notificationsEnabled ?? true,
        sound_enabled: soundEnabled ?? true,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase
          .from("voip_user_preferences")
          .update(prefsData)
          .eq("user_id", user.id);
      } else {
        await supabase.from("voip_user_preferences").insert({
          user_id: user.id,
          ...prefsData,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Preferences error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});