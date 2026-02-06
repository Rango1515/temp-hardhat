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
      // ── Appointments ────────────────────────────────────
      case "create-appointment": {
        const { leadId, leadName, leadPhone, scheduledAt, notes, outcome, selectedPlan, negotiatedPrice } = await req.json();

        if (!leadPhone || !scheduledAt) {
          return new Response(
            JSON.stringify({ error: "leadPhone and scheduledAt are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: creator } = await supabase
          .from("voip_users")
          .select("name, email")
          .eq("id", userId)
          .single();

        const creatorName = creator?.name || creator?.email || "Unknown";

        const { error } = await supabase.from("voip_appointments").insert({
          lead_id: leadId || null,
          lead_name: leadName || null,
          lead_phone: leadPhone,
          scheduled_at: scheduledAt,
          notes: notes || null,
          created_by: userId,
          created_by_name: creatorName,
          outcome: outcome || "manual",
          status: "scheduled",
          selected_plan: selectedPlan || null,
          negotiated_price: negotiatedPrice || null,
        });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "appointments": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: appointments, error } = await supabase
          .from("voip_appointments")
          .select("*")
          .order("scheduled_at", { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ appointments: appointments || [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update-appointment": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { appointmentId, status } = await req.json();

        if (!appointmentId || !["completed", "cancelled", "scheduled"].includes(status)) {
          return new Response(
            JSON.stringify({ error: "appointmentId and valid status are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("voip_appointments")
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointmentId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Duplicates ──────────────────────────────────────
      case "duplicates": {
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

        const uploadIds = [...new Set(duplicates.map(d => d.upload_id))];
        const { data: uploads } = await supabase
          .from("voip_lead_uploads")
          .select("id, filename")
          .in("id", uploadIds);

        const uploadMap = new Map((uploads || []).map(u => [u.id, u.filename]));

        const existingLeadIds = duplicates.map(d => d.existing_lead_id).filter(Boolean) as number[];
        const { data: existingLeads } = await supabase
          .from("voip_leads")
          .select("id, status")
          .in("id", existingLeadIds);

        const existingLeadMap = new Map((existingLeads || []).map(l => [l.id, l.status]));

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

        const { data: dups } = await supabase
          .from("voip_duplicate_leads")
          .select("*")
          .in("id", duplicateIds)
          .is("reviewed_at", null);

        let addedCount = 0;
        if (reviewAction === "add" && dups) {
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

      // ── Trash management ────────────────────────────────
      case "trash-items": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { entityType, ids } = await req.json();
        const validEntities = ["leads", "appointments", "calls"];

        if (!validEntities.includes(entityType) || !Array.isArray(ids) || ids.length === 0) {
          return new Response(
            JSON.stringify({ error: "Invalid entityType or ids" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const tableMap: Record<string, string> = {
          leads: "voip_leads",
          appointments: "voip_appointments",
          calls: "voip_calls",
        };

        const { error } = await supabase
          .from(tableMap[entityType])
          .update({ deleted_at: new Date().toISOString() })
          .in("id", ids);

        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "trash_items",
          entity_type: entityType,
          details: { ids, count: ids.length },
        });

        return new Response(
          JSON.stringify({ success: true, count: ids.length }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "restore-items": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { entityType: restoreType, ids: restoreIds } = await req.json();
        const validRestoreEntities = ["leads", "appointments", "calls"];

        if (!validRestoreEntities.includes(restoreType) || !Array.isArray(restoreIds)) {
          return new Response(
            JSON.stringify({ error: "Invalid entityType or ids" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const restoreTableMap: Record<string, string> = {
          leads: "voip_leads",
          appointments: "voip_appointments",
          calls: "voip_calls",
        };

        const { error } = await supabase
          .from(restoreTableMap[restoreType])
          .update({ deleted_at: null })
          .in("id", restoreIds);

        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "restore_items",
          entity_type: restoreType,
          details: { ids: restoreIds, count: restoreIds.length },
        });

        return new Response(
          JSON.stringify({ success: true, count: restoreIds.length }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "permanent-delete": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { entityType: deleteType, ids: deleteIds, confirmation } = await req.json();

        if (confirmation !== "DELETE") {
          return new Response(
            JSON.stringify({ error: "Confirmation required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validDeleteEntities = ["leads", "appointments", "calls"];
        if (!validDeleteEntities.includes(deleteType) || !Array.isArray(deleteIds)) {
          return new Response(
            JSON.stringify({ error: "Invalid entityType or ids" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const deleteTableMap: Record<string, string> = {
          leads: "voip_leads",
          appointments: "voip_appointments",
          calls: "voip_calls",
        };

        const { error } = await supabase
          .from(deleteTableMap[deleteType])
          .delete()
          .in("id", deleteIds);

        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "permanent_delete",
          entity_type: deleteType,
          details: { ids: deleteIds, count: deleteIds.length },
        });

        return new Response(
          JSON.stringify({ success: true, count: deleteIds.length }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "bulk-delete": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { entityType: bulkType, bulkAction, confirmation: bulkConfirm } = await req.json();

        if (bulkConfirm !== "DELETE") {
          return new Response(
            JSON.stringify({ error: "Confirmation required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const validBulkEntities = ["leads", "appointments", "calls"];
        const validBulkActions = ["older-7", "older-30", "older-90", "all"];

        if (!validBulkEntities.includes(bulkType) || !validBulkActions.includes(bulkAction)) {
          return new Response(
            JSON.stringify({ error: "Invalid parameters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const bulkTableMap: Record<string, string> = {
          leads: "voip_leads",
          appointments: "voip_appointments",
          calls: "voip_calls",
        };

        let query = supabase.from(bulkTableMap[bulkType]).delete();

        if (bulkAction === "all") {
          query = query.not("deleted_at", "is", null);
        } else {
          const days = parseInt(bulkAction.split("-")[1]);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          query = query.lt("deleted_at", cutoffDate.toISOString());
        }

        const { error, count } = await query;
        if (error) throw error;

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: userId,
          action: "bulk_delete",
          entity_type: bulkType,
          details: { bulkAction, deletedCount: count },
        });

        return new Response(
          JSON.stringify({ success: true, count: count || 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "trashed-count": {
        if (userRole !== "admin") {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const entityType = url.searchParams.get("entityType");
        const validCountEntities = ["leads", "appointments", "calls"];

        if (!entityType || !validCountEntities.includes(entityType)) {
          return new Response(
            JSON.stringify({ error: "Invalid entityType" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const countTableMap: Record<string, string> = {
          leads: "voip_leads",
          appointments: "voip_appointments",
          calls: "voip_calls",
        };

        const { count, error } = await supabase
          .from(countTableMap[entityType])
          .select("*", { count: "exact", head: true })
          .not("deleted_at", "is", null);

        if (error) throw error;

        return new Response(
          JSON.stringify({ count: count || 0 }),
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
    console.error("Leads-ext error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
