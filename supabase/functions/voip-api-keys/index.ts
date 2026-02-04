import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "hh_";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

  try {
    switch (req.method) {
      case "GET": {
        const { data: keys, error } = await supabase
          .from("voip_api_keys")
          .select("id, name, key_prefix, permissions, last_used_at, expires_at, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ keys }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        const { keyName, expirationDays, permissions } = await req.json();

        // Check existing keys limit
        const { count } = await supabase
          .from("voip_api_keys")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (count && count >= 5) {
          return new Response(
            JSON.stringify({ error: "Maximum of 5 API keys allowed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = generateApiKey();
        const keyPrefix = apiKey.substring(0, 7);
        
        // In production, you'd hash the API key
        const keyHash = apiKey; // For demo, storing plain (should use hashing)
        
        const expiresAt = expirationDays 
          ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { data, error } = await supabase
          .from("voip_api_keys")
          .insert({
            user_id: userId,
            name: keyName || "Default Key",
            key_hash: keyHash,
            key_prefix: keyPrefix,
            permissions: permissions || ["calls:read", "calls:write"],
            expires_at: expiresAt,
          })
          .select("id")
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            id: data.id,
            api_key: apiKey, // Only show full key on creation
            message: "API key created successfully. Save this key - it won't be shown again.",
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "DELETE": {
        const keyId = url.searchParams.get("id");
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: "Key ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: keys } = await supabase
          .from("voip_api_keys")
          .select("id")
          .eq("id", parseInt(keyId))
          .eq("user_id", userId);

        if (!keys || keys.length === 0) {
          return new Response(
            JSON.stringify({ error: "API key not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_api_keys")
          .delete()
          .eq("id", parseInt(keyId));

        if (error) throw error;

        return new Response(
          JSON.stringify({ message: "API key deleted successfully" }),
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
    console.error("API Keys error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
