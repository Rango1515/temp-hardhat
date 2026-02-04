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
        // Admin only - handle lead file upload with duplicate detection
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
        let reviewQueueCount = 0;

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

        // Get all existing phones and their call history
        const { data: existingLeads } = await supabase
          .from("voip_leads")
          .select("id, phone, status");
        
        const existingPhoneMap = new Map<string, { id: number; status: string }>();
        if (existingLeads) {
          for (const l of existingLeads) {
            existingPhoneMap.set(l.phone, { id: l.id, status: l.status });
          }
        }

        // Get phones that have been called
        const { data: calledLeads } = await supabase
          .from("voip_calls")
          .select("lead_id")
          .not("lead_id", "is", null);
        
        const calledLeadIds = new Set((calledLeads || []).map(c => c.lead_id));

        // Process leads
        for (const lead of leads) {
          const phone = normalizePhone(lead.phone || "");
          
          if (!phone || phone.length < 10) {
            invalidCount++;
            continue;
          }

          // Check if phone exists
          const existing = existingPhoneMap.get(phone);
          
          if (existing) {
            // Check if this lead has been called
            const hasCallHistory = calledLeadIds.has(existing.id);
            
            if (hasCallHistory) {
              // Add to review queue
              await supabase.from("voip_duplicate_leads").insert({
                upload_id: upload.id,
                phone: phone,
                name: lead.name || null,
                email: lead.email?.toLowerCase() || null,
                website: lead.website || null,
                existing_lead_id: existing.id,
                reason: "has_call_history",
              });
              reviewQueueCount++;
              duplicateCount++;
              continue;
            } else {
              // Phone exists but no calls - just skip as regular duplicate
              duplicateCount++;
              continue;
            }
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
          details: { filename, importedCount, duplicateCount, invalidCount, reviewQueueCount },
        });

        return new Response(
          JSON.stringify({
            imported_count: importedCount,
            duplicate_count: duplicateCount,
            invalid_count: invalidCount,
            review_queue_count: reviewQueueCount,
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
              id: lead.out_lead_id,
              name: lead.out_name || "—",
              phone: lead.out_phone,
              email: lead.out_email || null,
              website: lead.out_website || null,
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
        const { leadId, outcome, notes, followupAt, followupPriority, followupNotes } = await req.json();

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

        // Log the call with follow-up details
        await supabase.from("voip_calls").insert({
          user_id: userId,
          lead_id: leadId,
          from_number: "system",
          to_number: lead.phone || "unknown",
          status: "completed",
          outcome: outcome,
          notes: notes || null,
          followup_at: followupAt || null,
          followup_priority: followupPriority || null,
          followup_notes: followupNotes || null,
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

      case "delete-upload": {
        // Admin only - delete an upload and its NEW leads
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { uploadId } = await req.json();
        if (!uploadId) {
          return new Response(
            JSON.stringify({ error: "uploadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Delete only NEW leads (preserve called leads)
        const { data: deletedLeads, error: deleteLeadsError } = await supabase
          .from("voip_leads")
          .delete()
          .eq("upload_id", uploadId)
          .eq("status", "NEW")
          .select("id");

        if (deleteLeadsError) throw deleteLeadsError;

        // Delete the upload record
        const { error: deleteUploadError } = await supabase
          .from("voip_lead_uploads")
          .delete()
          .eq("id", uploadId);

        if (deleteUploadError) throw deleteUploadError;

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "lead_upload_deleted",
          entity_type: "leads",
          entity_id: uploadId,
          details: { leadsRemoved: deletedLeads?.length || 0 },
        });

        return new Response(
          JSON.stringify({ deleted: true, leadsRemoved: deletedLeads?.length || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "upload-calls": {
        // Admin only - get call history for an upload
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const uploadId = url.searchParams.get("uploadId");
        if (!uploadId) {
          return new Response(
            JSON.stringify({ error: "uploadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get leads for this upload
        const { data: leads, error: leadsError } = await supabase
          .from("voip_leads")
          .select("id, name, phone")
          .eq("upload_id", parseInt(uploadId));

        if (leadsError) throw leadsError;

        if (!leads || leads.length === 0) {
          return new Response(
            JSON.stringify({ calls: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const leadIds = leads.map(l => l.id);
        const leadMap = new Map(leads.map(l => [l.id, { name: l.name, phone: l.phone }]));

        // Get calls for these leads
        const { data: calls, error: callsError } = await supabase
          .from("voip_calls")
          .select("id, lead_id, user_id, start_time, duration_seconds, outcome, notes")
          .in("lead_id", leadIds)
          .order("start_time", { ascending: false });

        if (callsError) throw callsError;

        // Get user info for callers
        const userIds = [...new Set((calls || []).map(c => c.user_id).filter(Boolean))];
        let userMap = new Map<number, string>();
        
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("voip_users")
            .select("id, email, name")
            .in("id", userIds);
          
          if (users) {
            userMap = new Map(users.map(u => [u.id, u.name || u.email]));
          }
        }

        // Combine data
        const enrichedCalls = (calls || []).map(call => ({
          id: call.id,
          lead_name: leadMap.get(call.lead_id)?.name || "Unknown",
          lead_phone: leadMap.get(call.lead_id)?.phone || "Unknown",
          caller: userMap.get(call.user_id) || "Unknown",
          start_time: call.start_time,
          duration_seconds: call.duration_seconds,
          outcome: call.outcome,
          notes: call.notes,
        }));

        return new Response(
          JSON.stringify({ calls: enrichedCalls }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "all-leads": {
        // Admin only - get all leads with user info
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: leads, error } = await supabase
          .from("voip_leads")
          .select("id, name, phone, email, website, status, attempt_count, created_at, assigned_to")
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        // Get user names for assigned leads
        const assignedUserIds = [...new Set((leads || []).map(l => l.assigned_to).filter(Boolean))];
        let userMap = new Map<number, string>();
        
        if (assignedUserIds.length > 0) {
          const { data: users } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", assignedUserIds);
          
          if (users) {
            userMap = new Map(users.map(u => [u.id, u.name || u.email]));
          }
        }

        const enrichedLeads = (leads || []).map(lead => ({
          ...lead,
          assigned_user_name: lead.assigned_to ? userMap.get(lead.assigned_to) : null,
        }));

        return new Response(
          JSON.stringify({ leads: enrichedLeads }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "lead-calls": {
        // Admin only - get call history for a specific lead
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const leadId = url.searchParams.get("leadId");
        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: calls, error } = await supabase
          .from("voip_calls")
          .select("id, start_time, duration_seconds, outcome, notes, user_id, followup_at, followup_priority, followup_notes")
          .eq("lead_id", parseInt(leadId))
          .order("start_time", { ascending: false });

        if (error) throw error;

        // Get caller names
        const userIds = [...new Set((calls || []).map(c => c.user_id).filter(Boolean))];
        let userMap = new Map<number, string>();
        
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", userIds);
          
          if (users) {
            userMap = new Map(users.map(u => [u.id, u.name || u.email]));
          }
        }

        const enrichedCalls = (calls || []).map(call => ({
          ...call,
          caller_name: call.user_id ? userMap.get(call.user_id) || "Unknown" : "Unknown",
        }));

        return new Response(
          JSON.stringify({ calls: enrichedCalls }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "followups": {
        // Admin only - get all scheduled follow-ups
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: calls, error } = await supabase
          .from("voip_calls")
          .select("id, lead_id, user_id, followup_at, followup_priority, followup_notes")
          .not("followup_at", "is", null)
          .gte("followup_at", new Date().toISOString())
          .order("followup_at", { ascending: true });

        if (error) throw error;

        if (!calls || calls.length === 0) {
          return new Response(
            JSON.stringify({ followups: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get lead info
        const leadIds = [...new Set(calls.map(c => c.lead_id).filter(Boolean))];
        const { data: leads } = await supabase
          .from("voip_leads")
          .select("id, name, phone")
          .in("id", leadIds);
        
        const leadMap = new Map((leads || []).map(l => [l.id, { name: l.name, phone: l.phone }]));

        // Get caller names
        const userIds = [...new Set(calls.map(c => c.user_id).filter(Boolean))];
        const { data: users } = await supabase
          .from("voip_users")
          .select("id, name, email")
          .in("id", userIds);
        
        const userMap = new Map((users || []).map(u => [u.id, u.name || u.email]));

        const followups = calls.map(call => ({
          id: call.id,
          lead_id: call.lead_id,
          lead_name: leadMap.get(call.lead_id)?.name || "Unknown",
          lead_phone: leadMap.get(call.lead_id)?.phone || "Unknown",
          caller_name: userMap.get(call.user_id) || "Unknown",
          followup_at: call.followup_at,
          followup_priority: call.followup_priority,
          followup_notes: call.followup_notes,
        }));

        return new Response(
          JSON.stringify({ followups }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "duplicates": {
        // Admin only - get pending duplicate leads for review
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: duplicates, error } = await supabase
          .from("voip_duplicate_leads")
          .select("id, upload_id, phone, name, email, website, existing_lead_id, reason, created_at")
          .is("reviewed_at", null)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!duplicates || duplicates.length === 0) {
          return new Response(
            JSON.stringify({ duplicates: [] }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get upload filenames
        const uploadIds = [...new Set(duplicates.map(d => d.upload_id))];
        const { data: uploads } = await supabase
          .from("voip_lead_uploads")
          .select("id, filename")
          .in("id", uploadIds);
        
        const uploadMap = new Map((uploads || []).map(u => [u.id, u.filename]));

        // Get existing lead info
        const existingLeadIds = duplicates.map(d => d.existing_lead_id).filter(Boolean) as number[];
        const { data: existingLeads } = await supabase
          .from("voip_leads")
          .select("id, status")
          .in("id", existingLeadIds);
        
        const existingLeadMap = new Map((existingLeads || []).map(l => [l.id, l.status]));

        // Get call counts
        const { data: callCounts } = await supabase
          .from("voip_calls")
          .select("lead_id")
          .in("lead_id", existingLeadIds);
        
        const callCountMap = new Map<number, number>();
        for (const c of callCounts || []) {
          if (c.lead_id) {
            callCountMap.set(c.lead_id, (callCountMap.get(c.lead_id) || 0) + 1);
          }
        }

        const enrichedDuplicates = duplicates.map(dup => ({
          ...dup,
          upload_filename: uploadMap.get(dup.upload_id),
          existing_lead_status: dup.existing_lead_id ? existingLeadMap.get(dup.existing_lead_id) : null,
          existing_call_count: dup.existing_lead_id ? callCountMap.get(dup.existing_lead_id) || 0 : 0,
        }));

        return new Response(
          JSON.stringify({ duplicates: enrichedDuplicates }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "review-duplicate": {
        // Admin only - review a single duplicate
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { duplicateId, reviewAction } = await req.json();
        
        if (!duplicateId || !["add", "skip"].includes(reviewAction)) {
          return new Response(
            JSON.stringify({ error: "duplicateId and reviewAction (add/skip) are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get duplicate info
        const { data: dup, error: dupError } = await supabase
          .from("voip_duplicate_leads")
          .select("*")
          .eq("id", duplicateId)
          .single();

        if (dupError || !dup) {
          return new Response(
            JSON.stringify({ error: "Duplicate not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If adding, create a new lead
        if (reviewAction === "add") {
          await supabase.from("voip_leads").insert({
            phone: dup.phone,
            name: dup.name,
            email: dup.email,
            website: dup.website,
            status: "NEW",
            upload_id: dup.upload_id,
          });
        }

        // Mark as reviewed
        await supabase
          .from("voip_duplicate_leads")
          .update({
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
            review_action: reviewAction === "add" ? "added" : "skipped",
          })
          .eq("id", duplicateId);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "bulk-review-duplicates": {
        // Admin only - bulk review duplicates
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { duplicateIds, reviewAction } = await req.json();
        
        if (!Array.isArray(duplicateIds) || duplicateIds.length === 0 || !["add", "skip"].includes(reviewAction)) {
          return new Response(
            JSON.stringify({ error: "duplicateIds array and reviewAction (add/skip) are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get all duplicates
        const { data: dups } = await supabase
          .from("voip_duplicate_leads")
          .select("*")
          .in("id", duplicateIds)
          .is("reviewed_at", null);

        let addedCount = 0;
        if (reviewAction === "add" && dups) {
          // Add all as new leads
          const newLeads = dups.map(dup => ({
            phone: dup.phone,
            name: dup.name,
            email: dup.email,
            website: dup.website,
            status: "NEW",
            upload_id: dup.upload_id,
          }));

          if (newLeads.length > 0) {
            const { data: inserted } = await supabase
              .from("voip_leads")
              .insert(newLeads)
              .select("id");
            addedCount = inserted?.length || 0;
          }
        }

        // Mark all as reviewed
        await supabase
          .from("voip_duplicate_leads")
          .update({
            reviewed_at: new Date().toISOString(),
            reviewed_by: userId,
            review_action: reviewAction === "add" ? "added" : "skipped",
          })
          .in("id", duplicateIds);

        return new Response(
          JSON.stringify({ success: true, count: reviewAction === "add" ? addedCount : duplicateIds.length }),
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
