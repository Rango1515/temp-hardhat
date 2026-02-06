import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";

// Rate limiting store (in-memory for simplicity)
const rateLimitStore = new Map<number, number>();

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
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

        const uploadIds = (uploads || []).map(u => u.id);
        const calledCountMap = new Map<number, number>();

        if (uploadIds.length > 0) {
          const { data: leadsWithCalls } = await supabase
            .from("voip_leads")
            .select("id, upload_id")
            .in("upload_id", uploadIds);

          if (leadsWithCalls && leadsWithCalls.length > 0) {
            const leadIds = leadsWithCalls.map(l => l.id);
            const { data: calls } = await supabase
              .from("voip_calls")
              .select("lead_id")
              .in("lead_id", leadIds);

            const calledLeadIds = new Set((calls || []).map(c => c.lead_id));

            for (const lead of leadsWithCalls) {
              if (calledLeadIds.has(lead.id)) {
                calledCountMap.set(lead.upload_id, (calledCountMap.get(lead.upload_id) || 0) + 1);
              }
            }
          }
        }

        // Get category per upload from leads
        const categoryMap = new Map<number, string>();
        if (uploadIds.length > 0) {
          const { data: leadCats } = await supabase
            .from("voip_leads")
            .select("upload_id, category")
            .in("upload_id", uploadIds);
          if (leadCats) {
            for (const lead of leadCats) {
              if (lead.category && lead.upload_id && !categoryMap.has(lead.upload_id)) {
                categoryMap.set(lead.upload_id, lead.category);
              }
            }
          }
        }

        const enrichedUploads = (uploads || []).map(u => ({
          ...u,
          called_count: calledCountMap.get(u.id) || 0,
          category: categoryMap.get(u.id) || "uncategorized",
        }));

        return new Response(
          JSON.stringify({ uploads: enrichedUploads }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "upload": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { filename, leads, category } = await req.json();

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

        const { data: existingLeads } = await supabase
          .from("voip_leads")
          .select("id, phone, status");

        const existingPhoneMap = new Map<string, { id: number; status: string }>();
        if (existingLeads) {
          for (const l of existingLeads) {
            existingPhoneMap.set(l.phone, { id: l.id, status: l.status });
          }
        }

        const { data: calledLeads } = await supabase
          .from("voip_calls")
          .select("lead_id")
          .not("lead_id", "is", null);

        const calledLeadIds = new Set((calledLeads || []).map(c => c.lead_id));

        for (const lead of leads) {
          const phone = normalizePhone(lead.phone || "");

          if (!phone || phone.length < 10) {
            invalidCount++;
            continue;
          }

          const existing = existingPhoneMap.get(phone);

          if (existing) {
            const hasCallHistory = calledLeadIds.has(existing.id);

            if (hasCallHistory) {
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
                contact_name: lead.contact_name || null,
                status: "NEW",
                upload_id: upload.id,
                category: category || "uncategorized",
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

        await supabase
          .from("voip_lead_uploads")
          .update({
            imported_count: importedCount,
            duplicate_count: duplicateCount,
            invalid_count: invalidCount,
          })
          .eq("id", upload.id);

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "lead_upload",
          entity_type: "leads",
          entity_id: upload.id,
          details: { filename, importedCount, duplicateCount, invalidCount, reviewQueueCount, category },
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
        const lastRequest = rateLimitStore.get(userId);
        const now = Date.now();
        if (lastRequest && now - lastRequest < 5000) {
          return new Response(
            JSON.stringify({ error: "Please wait 5 seconds between lead requests" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        rateLimitStore.set(userId, now);

        const category = url.searchParams.get("category") || null;

        const rpcParams: Record<string, unknown> = { p_worker_id: userId };
        if (category) {
          rpcParams.p_category = category;
        }

        const { data: leads, error } = await supabase
          .rpc("assign_next_lead", rpcParams);

        if (error) throw error;

        if (!leads || leads.length === 0) {
          const message = category
            ? "No more leads available in this category."
            : "No leads available";
          return new Response(
            JSON.stringify({ lead: null, message }),
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
              contact_name: lead.out_contact_name || null,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "current": {
        const { data: lead, error } = await supabase
          .from("voip_leads")
          .select("id, name, phone, email, website, status, attempt_count, contact_name")
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
              contact_name: lead.contact_name || null,
              attempt_count: lead.attempt_count,
            } : null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete": {
        const { leadId, outcome, notes, followupAt, followupPriority, followupNotes, sessionDurationSeconds } = await req.json();

        if (!leadId || !outcome) {
          return new Response(
            JSON.stringify({ error: "leadId and outcome are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

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

        // Insert call record with session_duration_seconds
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
          session_duration_seconds: sessionDurationSeconds || 0,
        });

        return new Response(
          JSON.stringify({ success: true, newStatus }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "skip": {
        const { leadId } = await req.json();

        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: lead } = await supabase
          .from("voip_leads")
          .select("id, assigned_to")
          .eq("id", leadId)
          .single();

        if (!lead || lead.assigned_to !== userId) {
          return new Response(
            JSON.stringify({ error: "Lead not found or not assigned to you" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Reset lead back to NEW so it re-enters the pool
        await supabase
          .from("voip_leads")
          .update({
            status: "NEW",
            assigned_to: null,
            assigned_at: null,
            locked_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leadId);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "stats": {
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

        const { data: deletedLeads, error: deleteLeadsError } = await supabase
          .from("voip_leads")
          .delete()
          .eq("upload_id", uploadId)
          .eq("status", "NEW")
          .select("id");

        if (deleteLeadsError) throw deleteLeadsError;

        const { error: deleteUploadError } = await supabase
          .from("voip_lead_uploads")
          .delete()
          .eq("id", uploadId);

        if (deleteUploadError) throw deleteUploadError;

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

        const { data: calls, error: callsError } = await supabase
          .from("voip_calls")
          .select("id, lead_id, user_id, start_time, duration_seconds, outcome, notes")
          .in("lead_id", leadIds)
          .order("start_time", { ascending: false });

        if (callsError) throw callsError;

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
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const page = parseInt(url.searchParams.get("page") || "1");
        const pageSize = parseInt(url.searchParams.get("pageSize") || "50");
        const search = url.searchParams.get("search") || "";
        const offset = (page - 1) * pageSize;

        let countQuery = supabase
          .from("voip_leads")
          .select("*", { count: "exact", head: true });

        if (search) {
          countQuery = countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { count: totalCount } = await countQuery;

        let leadsQuery = supabase
          .from("voip_leads")
          .select("id, name, phone, email, website, status, attempt_count, created_at, assigned_to, contact_name, category");

        if (search) {
          leadsQuery = leadsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: leads, error } = await leadsQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const statusOrder: Record<string, number> = { ASSIGNED: 0, NEW: 1, COMPLETED: 2, DNC: 3 };
        const sortedLeads = (leads || []).sort((a, b) => {
          const aOrder = statusOrder[a.status] ?? 99;
          const bOrder = statusOrder[b.status] ?? 99;
          return aOrder - bOrder;
        });

        const assignedUserIds = [...new Set(sortedLeads.map(l => l.assigned_to).filter(Boolean))];
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

        const enrichedLeads = sortedLeads.map(lead => ({
          ...lead,
          assigned_user_name: lead.assigned_to ? userMap.get(lead.assigned_to) : null,
        }));

        return new Response(
          JSON.stringify({ leads: enrichedLeads, total: totalCount || 0, page, pageSize }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "lead-calls": {
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

        const leadIds = [...new Set(calls.map(c => c.lead_id).filter(Boolean))];
        const { data: leads } = await supabase
          .from("voip_leads")
          .select("id, name, phone, email, website, contact_name")
          .in("id", leadIds);

        const leadMap = new Map((leads || []).map(l => [l.id, { name: l.contact_name || l.name, phone: l.phone, company: l.name, email: l.email, website: l.website }]));

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
          lead_company: leadMap.get(call.lead_id)?.company || "Unknown",
          lead_email: leadMap.get(call.lead_id)?.email || "Unknown",
          lead_website: leadMap.get(call.lead_id)?.website || "Unknown",
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

      case "clear-all-followups": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: affectedCalls } = await supabase
          .from("voip_calls")
          .select("id")
          .not("followup_at", "is", null)
          .gte("followup_at", new Date().toISOString());

        const affectedCount = affectedCalls?.length || 0;

        if (affectedCount > 0) {
          const ids = affectedCalls!.map(c => c.id);
          const { error: updateError } = await supabase
            .from("voip_calls")
            .update({
              followup_at: null,
              followup_priority: null,
              followup_notes: null,
            })
            .in("id", ids);

          if (updateError) throw updateError;
        }

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "clear_all_followups",
          entity_type: "calls",
          details: { clearedCount: affectedCount },
        });

        console.log(`Admin ${userId} cleared all ${affectedCount} follow-ups`);

        return new Response(
          JSON.stringify({ success: true, clearedCount: affectedCount }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-lead": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { leadId } = await req.json();
        if (!leadId) {
          return new Response(
            JSON.stringify({ error: "leadId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("voip_calls").update({ lead_id: null }).eq("lead_id", leadId);
        await supabase.from("voip_worker_lead_history").delete().eq("lead_id", leadId);
        await supabase.from("voip_activity_events").update({ lead_id: null }).eq("lead_id", leadId);

        const { error } = await supabase.from("voip_leads").delete().eq("id", leadId);
        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "lead_deleted",
          entity_type: "leads",
          entity_id: leadId,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "master-clear-leads": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { confirmation, clearHistory } = await req.json();

        if (confirmation !== "DELETE ALL LEADS") {
          return new Response(
            JSON.stringify({ error: "Invalid confirmation. Type exactly: DELETE ALL LEADS" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { count: leadCount } = await supabase
          .from("voip_leads")
          .select("*", { count: "exact", head: true });

        await supabase.from("voip_calls").update({ lead_id: null }).neq("id", 0);
        await supabase.from("voip_activity_events").update({ lead_id: null }).neq("id", 0);
        await supabase.from("voip_worker_lead_history").delete().neq("id", 0);
        await supabase.from("voip_duplicate_leads").delete().neq("id", 0);
        await supabase.from("voip_leads").delete().neq("id", 0);

        if (clearHistory) {
          await supabase.from("voip_lead_uploads").delete().neq("id", 0);
        }

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "master_clear_leads",
          entity_type: "leads",
          details: { leadsDeleted: leadCount || 0, historyCleared: clearHistory || false },
        });

        return new Response(
          JSON.stringify({ success: true, leadsDeleted: leadCount || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-followup": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { callId } = await req.json();
        if (!callId) {
          return new Response(
            JSON.stringify({ error: "callId is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: updateError } = await supabase
          .from("voip_calls")
          .update({
            followup_at: null,
            followup_priority: null,
            followup_notes: null,
          })
          .eq("id", callId);

        if (updateError) throw updateError;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "followup_deleted",
          entity_type: "calls",
          entity_id: callId,
        });

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "category-counts": {
        // Return ALL distinct categories from the DB with counts of NEW (available) leads
        // Only count non-deleted leads
        const { data: allCategories, error: catError } = await supabase
          .from("voip_leads")
          .select("category")
          .is("deleted_at", null);

        if (catError) throw catError;

        // Count NEW leads per category
        const { data: newLeads, error: newError } = await supabase
          .from("voip_leads")
          .select("category")
          .eq("status", "NEW")
          .is("deleted_at", null);

        if (newError) throw newError;

        const counts: Record<string, number> = {};
        // Initialize all known categories with 0
        const allCats = new Set<string>();
        for (const lead of (allCategories || [])) {
          const cat = lead.category || "uncategorized";
          allCats.add(cat);
        }
        for (const cat of allCats) {
          counts[cat] = 0;
        }
        // Fill in actual NEW counts
        for (const lead of (newLeads || [])) {
          const cat = lead.category || "uncategorized";
          counts[cat] = (counts[cat] || 0) + 1;
        }

        return new Response(
          JSON.stringify({ counts }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "hide-category": {
        // Admin-only: soft-delete all leads in a category (removes it from dialer dropdown)
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const body = await req.json();
        const categoryToHide = body.category;
        if (!categoryToHide) {
          return new Response(
            JSON.stringify({ error: "Category is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get count of leads that will be affected
        const { data: affectedLeads, error: countErr } = await supabase
          .from("voip_leads")
          .select("id")
          .eq("category", categoryToHide)
          .is("deleted_at", null);

        if (countErr) throw countErr;

        const affectedCount = affectedLeads?.length || 0;

        // Soft-delete all leads in this category
        const { error: hideErr } = await supabase
          .from("voip_leads")
          .update({ deleted_at: new Date().toISOString() })
          .eq("category", categoryToHide)
          .is("deleted_at", null);

        if (hideErr) throw hideErr;

        // Audit log
        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "hide_category",
          entity_type: "lead_category",
          details: { category: categoryToHide, leadsHidden: affectedCount },
        });

        console.log(`Admin ${userId} hid category "${categoryToHide}" affecting ${affectedCount} leads`);

        return new Response(
          JSON.stringify({ success: true, leadsHidden: affectedCount }),
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
