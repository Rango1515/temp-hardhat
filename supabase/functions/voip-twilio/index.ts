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

  // Admin only
  if (userRole !== "admin") {
    return new Response(
      JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "config": {
        if (req.method === "GET") {
          // Get config (mask sensitive values)
          const { data: config } = await supabase
            .from("voip_twilio_config")
            .select("*")
            .limit(1)
            .single();

          if (!config) {
            return new Response(
              JSON.stringify({
                config: {
                  account_sid: "",
                  auth_token: "",
                  outbound_number: "",
                  is_active: false,
                },
              }),
              { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          // Mask auth token
          const maskedConfig = {
            ...config,
            auth_token: config.auth_token ? "••••••••" + config.auth_token.slice(-4) : "",
          };

          return new Response(
            JSON.stringify({ config: maskedConfig }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (req.method === "POST") {
          const { account_sid, auth_token, outbound_number, is_active } = await req.json();

          // Check if config exists
          const { data: existing } = await supabase
            .from("voip_twilio_config")
            .select("id, auth_token")
            .limit(1)
            .single();

          const configData: Record<string, unknown> = {
            account_sid: account_sid || "",
            outbound_number: outbound_number || "",
            is_active: is_active ?? false,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          };

          // Only update auth_token if a new value is provided (not masked)
          if (auth_token && !auth_token.startsWith("••••")) {
            configData.auth_token = auth_token;
          } else if (existing) {
            configData.auth_token = existing.auth_token;
          }

          let error;
          if (existing) {
            ({ error } = await supabase
              .from("voip_twilio_config")
              .update(configData)
              .eq("id", existing.id));
          } else {
            ({ error } = await supabase
              .from("voip_twilio_config")
              .insert(configData));
          }

          if (error) throw error;

          // Audit log
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: userId,
            action: "twilio_config_update",
            entity_type: "twilio",
            details: { is_active, has_sid: !!account_sid, has_token: !!auth_token },
          });

          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      case "test-call": {
        const { toNumber } = await req.json();

        if (!toNumber) {
          return new Response(
            JSON.stringify({ error: "Phone number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get Twilio config
        const { data: config } = await supabase
          .from("voip_twilio_config")
          .select("*")
          .limit(1)
          .single();

        if (!config || !config.is_active || !config.account_sid || !config.auth_token) {
          return new Response(
            JSON.stringify({ error: "Twilio is not configured or enabled" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Make Twilio API call
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Calls.json`;
          const auth = btoa(`${config.account_sid}:${config.auth_token}`);

          const formData = new URLSearchParams();
          formData.append("To", toNumber);
          formData.append("From", config.outbound_number);
          formData.append("Url", "http://demo.twilio.com/docs/voice.xml"); // Test TwiML

          const response = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          if (!response.ok) {
            const errorData = await response.json();
            return new Response(
              JSON.stringify({ error: errorData.message || "Twilio API error" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: "Test call initiated" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.error("Twilio test call error:", e);
          return new Response(
            JSON.stringify({ error: "Failed to initiate test call" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Twilio error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
