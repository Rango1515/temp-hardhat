import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// TwiML to properly connect a call between the caller and recipient
function generateCallTwiML(toNumber: string, callerId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call. Please hold.</Say>
  <Dial callerId="${callerId}" timeout="30">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Handle TwiML webhook callback from Twilio (no auth required)
  if (action === "twiml") {
    try {
      // Parse form data from Twilio webhook
      const formData = await req.formData();
      const to = formData.get("To") as string;
      const from = formData.get("From") as string;
      
      console.log(`[twiml] Generating TwiML for call from ${from} to ${to}`);
      
      const twiml = generateCallTwiML(to, from);
      
      return new Response(twiml, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml",
        },
      });
    } catch (e) {
      console.error("[twiml] Error generating TwiML:", e);
      // Return a fallback TwiML that says there was an error
      return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, there was an error connecting your call. Please try again.</Say>
  <Hangup/>
</Response>`, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      });
    }
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
  const userName = payload.name || "Unknown";

  try {
    // Worker action: make-call (available to all authenticated users)
    if (action === "make-call") {
      const { toNumber, leadId } = await req.json();

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
          JSON.stringify({ error: "Twilio is not configured or enabled. Contact admin." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Make Twilio API call
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.account_sid}/Calls.json`;
        const auth = btoa(`${config.account_sid}:${config.auth_token}`);

        // Get the edge function URL for TwiML webhook
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const twimlUrl = `${supabaseUrl}/functions/v1/voip-twilio?action=twiml`;

        const formData = new URLSearchParams();
        formData.append("To", toNumber);
        formData.append("From", config.outbound_number);
        // Use our custom TwiML endpoint that properly connects calls
        formData.append("Url", twimlUrl);
        formData.append("Method", "POST");

        console.log(`[make-call] User ${userId} (${userName}) calling ${toNumber} via ${twimlUrl}`);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error("[make-call] Twilio error:", responseData);
          return new Response(
            JSON.stringify({ error: responseData.message || "Twilio API error" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log the call in the database
        const callSid = responseData.sid;
        await supabase.from("voip_calls").insert({
          user_id: userId,
          lead_id: leadId || null,
          from_number: config.outbound_number,
          to_number: toNumber,
          status: "initiated",
          direction: "outbound",
          start_time: new Date().toISOString(),
        });

        console.log(`[make-call] Call initiated: ${callSid}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Call initiated",
            callSid: callSid,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("[make-call] Error:", e);
        return new Response(
          JSON.stringify({ error: "Failed to initiate call" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Admin only actions below
    if (userRole !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

          // Get the edge function URL for TwiML webhook
          const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
          const twimlUrl = `${supabaseUrl}/functions/v1/voip-twilio?action=twiml`;

          const formData = new URLSearchParams();
          formData.append("To", toNumber);
          formData.append("From", config.outbound_number);
          formData.append("Url", twimlUrl);
          formData.append("Method", "POST");

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
