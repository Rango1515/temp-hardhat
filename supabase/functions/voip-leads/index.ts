import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<number, number>();

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  // Add +1 for US numbers if no country code
  if (cleaned.length === 10) {
    cleaned = "+1" + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith("1")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
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
  const userRole = payload.role;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      case "uploads": {
        // Admin only
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: uploads, error } = await supabase
          .from("voip_lead_uploads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(
          JSON.stringify({ uploads: uploads || [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "upload": {
        // Admin only - handle lead file upload
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { filename, leads } = await req.json();

        if (!leads || !Array.isArray(leads)) {
          return new Response(
            JSON.stringify({ error: "Invalid leads data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let importedCount = 0;
        let duplicateCount = 0;
        let invalidCount = 0;

        // Create upload record
        const { data: upload, error: uploadError } = await supabase
          .from("voip_lead_uploads")
          .insert({
            admin_id: userId,
            filename: filename || "unknown.txt",
            total_lines: leads.length,
          })
          .select("id")
          .single();

        if (uploadError) throw uploadError;

        // Process leads
        for (const lead of leads) {
          const phone = normalizePhone(lead.phone || "");
          
          if (!phone || phone.length < 10) {
            invalidCount++;
            continue;
          }

          try {
            const { error: insertError } = await supabase
              .from("voip_leads")
              .insert({
                name: lead.name || null,
                phone: phone,
                email: lead.email?.toLowerCase() || null,
                website: lead.website || null,
                status: "NEW",
                upload_id: upload.id,
              });

            if (insertError) {
              if (insertError.code === "23505") {
                // Duplicate key violation
                duplicateCount++;
              } else {
                console.error("Lead insert error:", insertError);
                invalidCount++;
              }
            } else {
              importedCount++;
            }
          } catch (e) {
            console.error("Lead processing error:", e);
            invalidCount++;
          }
        }

        // Update upload record with counts
        await supabase
          .from("voip_lead_uploads")
          .update({
            imported_count: importedCount,
            duplicate_count: duplicateCount,
            invalid_count: invalidCount,
          })
          .eq("id", upload.id);

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "lead_upload",
          entity_type: "leads",
          entity_id: upload.id,
          details: { filename, importedCount, duplicateCount, invalidCount },
        });

        return new Response(
          JSON.stringify({
            imported_count: importedCount,
            duplicate_count: duplicateCount,
            invalid_count: invalidCount,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "request-next": {
        // Workers can request next lead
        // Rate limit check (5 seconds)
        const lastRequest = rateLimitStore.get(userId);
        const now = Date.now();
        if (lastRequest && now - lastRequest < 5000) {
          return new Response(
            JSON.stringify({ error: "Please wait 5 seconds between lead requests" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        rateLimitStore.set(userId, now);

        // Use the database function for atomic lead assignment
        const { data: leads, error } = await supabase
          .rpc("assign_next_lead", { p_worker_id: userId });

        if (error) throw error;

        if (!leads || leads.length === 0) {
          return new Response(
            JSON.stringify({ lead: null, message: "No leads available" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const lead = leads[0];
        return new Response(
          JSON.stringify({
            lead: {
              id: lead.lead_id,
              name: lead.name || "—",
              phone: lead.phone,
              email: lead.email || null,
              website: lead.website || null,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "current": {
        // Get current assigned lead for worker
        const { data: lead, error } = await supabase
          .from("voip_leads")
          .select("id, name, phone, email, website, status, attempt_count")
          .eq("assigned_to", userId)
          .eq("status", "ASSIGNED")
          .single();

        if (error && error.code !== "PGRST116") throw error;

        return new Response(
          JSON.stringify({
            lead: lead ? {
              id: lead.id,
              name: lead.name || "—",
              phone: lead.phone,
              email: lead.email || null,
              website: lead.website || null,
              attempt_count: lead.attempt_count,
            } : null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete": {
        // Complete a lead with outcome
        const { leadId, outcome, notes, followupAt } = await req.json();

        if (!leadId || !outcome) {
          return new Response(
            JSON.stringify({ error: "leadId and outcome are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify ownership
        const { data: lead } = await supabase
          .from("voip_leads")
          .select("id, assigned_to, attempt_count, phone")
          .eq("id", leadId)
          .single();

        if (!lead || lead.assigned_to !== userId) {
          return new Response(
            JSON.stringify({ error: "Lead not found or not assigned to you" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const attemptCount = (lead.attempt_count || 0) + 1;
        let newStatus = "ASSIGNED";

        // Determine new status based on outcome
        switch (outcome) {
          case "interested":
          case "not_interested":
          case "wrong_number":
            newStatus = "COMPLETED";
            break;
          case "dnc":
            newStatus = "DNC";
            break;
          case "no_answer":
            newStatus = attemptCount >= 3 ? "COMPLETED" : "ASSIGNED";
            break;
          case "voicemail":
          case "followup":
            newStatus = "ASSIGNED";
            break;
        }

        // Update lead
        const updateData: Record<string, unknown> = {
          status: newStatus,
          attempt_count: attemptCount,
          updated_at: new Date().toISOString(),
        };

        if (newStatus === "COMPLETED" || newStatus === "DNC") {
          updateData.assigned_to = null;
          updateData.assigned_at = null;
          updateData.locked_until = null;
        }

        await supabase
          .from("voip_leads")
          .update(updateData)
          .eq("id", leadId);

        // Log the call
        await supabase.from("voip_calls").insert({
          user_id: userId,
          lead_id: leadId,
          from_number: "system",
          to_number: lead.phone || "unknown",
          status: "completed",
          outcome: outcome,
          notes: notes || null,
          followup_at: followupAt || null,
        });

        return new Response(
          JSON.stringify({ success: true, newStatus }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
        // Get lead statistics (admin only)
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: leads } = await supabase
          .from("voip_leads")
          .select("status");

        const stats = {
          total: leads?.length || 0,
          new: leads?.filter(l => l.status === "NEW").length || 0,
          assigned: leads?.filter(l => l.status === "ASSIGNED").length || 0,
          completed: leads?.filter(l => l.status === "COMPLETED").length || 0,
          dnc: leads?.filter(l => l.status === "DNC").length || 0,
        };

        return new Response(
          JSON.stringify({ stats }),
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
    console.error("Leads error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
