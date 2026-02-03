import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query, execute } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "hh_";
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface ApiKey {
  id: number;
  key_name: string;
  api_key: string;
  creation_date: string;
  expiration_date: string | null;
  status: string;
  last_used: string | null;
  usage_count: number;
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
        const keys = await query<ApiKey>(
          `SELECT id, key_name, api_key, creation_date, expiration_date, 
                  status, last_used, usage_count 
           FROM api_keys 
           WHERE user_id = ? 
           ORDER BY creation_date DESC`,
          [userId]
        );

        // Mask API keys for security
        const maskedKeys = keys.map((key) => ({
          ...key,
          api_key: key.api_key.substring(0, 7) + "..." + key.api_key.substring(key.api_key.length - 4),
        }));

        return new Response(
          JSON.stringify({ keys: maskedKeys }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "POST": {
        const { keyName, expirationDays } = await req.json();

        // Check existing keys limit
        const existingKeys = await query<{ count: number }>(
          "SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND status = 'active'",
          [userId]
        );

        if (existingKeys[0]?.count >= 5) {
          return new Response(
            JSON.stringify({ error: "Maximum of 5 active API keys allowed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const apiKey = generateApiKey();
        const expirationDate = expirationDays 
          ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const result = await execute(
          `INSERT INTO api_keys (user_id, key_name, api_key, expiration_date) 
           VALUES (?, ?, ?, ?)`,
          [userId, keyName || "Default Key", apiKey, expirationDate]
        );

        // Log activity
        await execute(
          "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
          [userId, "api_key_created", "api_key", result.lastInsertId, JSON.stringify({ keyName })]
        );

        return new Response(
          JSON.stringify({
            id: result.lastInsertId,
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
        const keys = await query<{ id: number }>(
          "SELECT id FROM api_keys WHERE id = ? AND user_id = ?",
          [keyId, userId]
        );

        if (keys.length === 0) {
          return new Response(
            JSON.stringify({ error: "API key not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await execute("UPDATE api_keys SET status = 'revoked' WHERE id = ?", [keyId]);

        // Log activity
        await execute(
          "INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)",
          [userId, "api_key_revoked", "api_key", keyId]
        );

        return new Response(
          JSON.stringify({ message: "API key revoked successfully" }),
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
