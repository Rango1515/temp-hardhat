import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { verifyJWT, extractToken, hashPassword } from "../_shared/auth.ts";

function sanitizeSearchPattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

function generateTokenCode(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const array = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const token = extractToken(req.headers.get("Authorization"));
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = await verifyJWT(token);
  if (!payload || payload.role !== "admin") {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminId = parseInt(payload.sub);
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    switch (action) {
      // ── List Partners ──
      case "partners": {
        if (req.method === "GET") {
          const search = url.searchParams.get("search");
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = (page - 1) * limit;

          let query = supabase
            .from("voip_users")
            .select("id, name, email, status, created_at", { count: "exact" })
            .eq("role", "partner")
            .is("deleted_at", null);

          if (search) {
            const s = sanitizeSearchPattern(search);
            query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
          }

          const { data: partners, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;

          // Enrich with stats
          const enriched = [];
          for (const p of partners || []) {
            const { count: clientCount } = await supabase
              .from("voip_users")
              .select("id", { count: "exact", head: true })
              .eq("partner_id", p.id);

            const { data: commissions } = await supabase
              .from("voip_commissions")
              .select("commission_amount")
              .eq("partner_id", p.id);

            const totalCommission = (commissions || []).reduce((s, c) => s + Number(c.commission_amount), 0);

            // Get partner profile
            const { data: profile } = await supabase
              .from("voip_partner_profiles")
              .select("phone, payout_method, status")
              .eq("user_id", p.id)
              .maybeSingle();

            enriched.push({
              ...p,
              clientCount: clientCount || 0,
              totalCommission,
              profile: profile || null,
            });
          }

          return new Response(JSON.stringify({
            partners: enriched,
            pagination: { page, limit, total: count || 0 },
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { name, phone, payoutMethod } = body;

          if (!name) {
            return new Response(JSON.stringify({ error: "Name is required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Create a placeholder partner user with a random temp email and password
          // The partner will set their real email/password during signup
          const tempId = crypto.getRandomValues(new Uint8Array(8));
          const tempEmail = `partner-pending-${Array.from(tempId).map(b => b.toString(16).padStart(2, '0')).join('')}@placeholder.local`;
          const tempPasswordHash = await hashPassword(crypto.randomUUID());

          const { data: newPartner, error: createErr } = await supabase
            .from("voip_users")
            .insert({
              name: name.trim(),
              email: tempEmail,
              password_hash: tempPasswordHash,
              role: "partner",
              status: "active",
            })
            .select("id")
            .single();

          if (createErr) throw createErr;

          // Create partner profile
          await supabase.from("voip_partner_profiles").insert({
            user_id: newPartner.id,
            phone: phone || null,
            payout_method: payoutMethod || null,
            status: "active",
          });

          // Auto-generate a partner token for signup (no expiration — valid until used)
          const tokenCode = generateTokenCode(20);

          const { data: newToken } = await supabase
            .from("voip_partner_tokens")
            .insert({
              token_code: tokenCode,
              partner_id: newPartner.id,
              max_uses: 1,
              expires_at: null,
              created_by: adminId,
            })
            .select("id")
            .single();

          // Audit log
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "partner_created",
            entity_type: "partner",
            entity_id: newPartner.id,
            details: { name, phone, payoutMethod },
          });

          console.log(`[voip-partner-admin] Partner ${newPartner.id} created with token ${tokenCode}`);

          return new Response(JSON.stringify({
            id: newPartner.id,
            tokenCode,
            tokenId: newToken?.id,
            message: "Partner created with signup token",
          }), {
            status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (req.method === "PATCH") {
          const body = await req.json();
          const { partnerId, status, phone, payoutMethod, payoutDetails } = body;

          if (!partnerId) {
            return new Response(JSON.stringify({ error: "partnerId required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Update user status if provided
          if (status) {
            await supabase.from("voip_users").update({ status }).eq("id", partnerId);
          }

          // Update profile
          const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (phone !== undefined) profileUpdates.phone = phone;
          if (payoutMethod !== undefined) profileUpdates.payout_method = payoutMethod;
          if (payoutDetails !== undefined) profileUpdates.payout_details = payoutDetails;
          if (status) profileUpdates.status = status;

          await supabase.from("voip_partner_profiles").update(profileUpdates).eq("user_id", partnerId);

          // Audit
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "partner_updated",
            entity_type: "partner",
            entity_id: partnerId,
            details: { status, phone, payoutMethod },
          });

          return new Response(JSON.stringify({ message: "Partner updated" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (req.method === "DELETE") {
          const partnerId = url.searchParams.get("partnerId");
          if (!partnerId) {
            return new Response(JSON.stringify({ error: "partnerId required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const pid = parseInt(partnerId);

          // Step 1: Immediately disable the account and set ban reason
          // This triggers the live-kick mechanism (30s status poll) to boot them if online
          await supabase.from("voip_users").update({
            status: "disabled",
            suspension_reason: "Your account has been removed by an administrator.",
          }).eq("id", pid);

          // Step 2: Delete all refresh tokens so they can't re-authenticate
          await supabase.from("voip_refresh_tokens").delete().eq("user_id", pid);

          console.log(`[voip-partner-admin] Partner ${pid} disabled and sessions invalidated`);

          // Step 3: Delete related data in order (respecting FK constraints)
          // 3a. Delete token usage records for this partner's tokens
          const { data: partnerTokens } = await supabase
            .from("voip_partner_tokens")
            .select("id")
            .eq("partner_id", pid);
          
          const tokenIds = (partnerTokens || []).map(t => t.id);
          if (tokenIds.length > 0) {
            await supabase.from("voip_partner_token_usage").delete().in("token_id", tokenIds);
          }

          // 3b. Delete partner tokens
          await supabase.from("voip_partner_tokens").delete().eq("partner_id", pid);

          // 3c. Delete commissions
          await supabase.from("voip_commissions").delete().eq("partner_id", pid);

          // 3d. Delete revenue events
          await supabase.from("voip_revenue_events").delete().eq("partner_id", pid);

          // 3e. Delete partner profile
          await supabase.from("voip_partner_profiles").delete().eq("user_id", pid);

          // 3f. Unlink any clients from this partner
          await supabase.from("voip_users").update({ partner_id: null }).eq("partner_id", pid);

          // 3g. Delete audit log entries for this partner
          await supabase.from("voip_admin_audit_log").delete().eq("entity_type", "partner").eq("entity_id", pid);

          // 3h. Soft-delete the partner user (keep record to block future logins)
          await supabase.from("voip_users").update({
            deleted_at: new Date().toISOString(),
          }).eq("id", pid).eq("role", "partner");

          // Audit the deletion itself
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "partner_deleted",
            entity_type: "partner",
            entity_id: pid,
          });

          console.log(`[voip-partner-admin] Partner ${pid} fully deleted by admin ${adminId}`);

          return new Response(JSON.stringify({ message: "Partner deleted" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      // ── Partner Tokens ──
      case "partner-tokens": {
        if (req.method === "GET") {
          const filterPartnerId = url.searchParams.get("partnerId");
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = (page - 1) * limit;

          let query = supabase
            .from("voip_partner_tokens")
            .select("id, token_code, partner_id, max_uses, uses_count, expires_at, status, created_at", { count: "exact" });

          if (filterPartnerId) query = query.eq("partner_id", parseInt(filterPartnerId));

          const { data: tokens, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;

          // Get partner names
          const partnerIds = [...new Set((tokens || []).map(t => t.partner_id))];
          let partnerMap: Record<number, string> = {};
          if (partnerIds.length > 0) {
            const { data: partners } = await supabase
              .from("voip_users")
              .select("id, name")
              .in("id", partnerIds);
            for (const p of partners || []) partnerMap[p.id] = p.name;
          }

          const enriched = (tokens || []).map(t => ({
            ...t,
            // Mask token: show first 12 chars
            token_display: t.token_code.substring(0, 12) + "...",
            partner_name: partnerMap[t.partner_id] || "Unknown",
          }));

          return new Response(JSON.stringify({
            tokens: enriched,
            pagination: { page, limit, total: count || 0 },
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { partnerId, maxUses, expiresAt } = body;

          if (!partnerId) {
            return new Response(JSON.stringify({ error: "partnerId required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Verify partner exists
          const { data: partner } = await supabase
            .from("voip_users")
            .select("id, role")
            .eq("id", partnerId)
            .eq("role", "partner")
            .maybeSingle();

          if (!partner) {
            return new Response(JSON.stringify({ error: "Partner not found" }), {
              status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const tokenCode = generateTokenCode(20);

          const { data: newToken, error: insertErr } = await supabase
            .from("voip_partner_tokens")
            .insert({
              token_code: tokenCode,
              partner_id: partnerId,
              max_uses: maxUses || null,
              expires_at: expiresAt || null,
              created_by: adminId,
            })
            .select("id")
            .single();

          if (insertErr) throw insertErr;

          // Audit
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "partner_token_created",
            entity_type: "partner_token",
            entity_id: newToken.id,
            details: { partnerId, maxUses, expiresAt },
          });

          // Return FULL token code (shown once only)
          return new Response(JSON.stringify({ tokenCode, id: newToken.id }), {
            status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (req.method === "DELETE") {
          const tokenId = url.searchParams.get("tokenId");
          const permanent = url.searchParams.get("permanent");

          if (!tokenId) {
            return new Response(JSON.stringify({ error: "tokenId required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const tid = parseInt(tokenId);

          if (permanent === "true") {
            // Permanently delete token and usage history
            await supabase.from("voip_partner_token_usage").delete().eq("token_id", tid);
            await supabase.from("voip_partner_tokens").delete().eq("id", tid);

            await supabase.from("voip_admin_audit_log").insert({
              admin_id: adminId,
              action: "partner_token_deleted",
              entity_type: "partner_token",
              entity_id: tid,
            });

            return new Response(JSON.stringify({ message: "Token deleted permanently" }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Just revoke
          await supabase
            .from("voip_partner_tokens")
            .update({ status: "revoked" })
            .eq("id", tid);

          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "partner_token_revoked",
            entity_type: "partner_token",
            entity_id: tid,
          });

          return new Response(JSON.stringify({ message: "Token revoked" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      // ── Token Usage History ──
      case "token-usage": {
        const tokenId = url.searchParams.get("tokenId");
        if (!tokenId) {
          return new Response(JSON.stringify({ error: "tokenId required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: usage, error } = await supabase
          .from("voip_partner_token_usage")
          .select("id, client_user_id, created_at")
          .eq("token_id", parseInt(tokenId))
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get client names
        const clientIds = (usage || []).map(u => u.client_user_id);
        let clientMap: Record<number, string> = {};
        if (clientIds.length > 0) {
          const { data: clients } = await supabase
            .from("voip_users")
            .select("id, name, email")
            .in("id", clientIds);
          for (const c of clients || []) clientMap[c.id] = c.name;
        }

        const enriched = (usage || []).map(u => ({
          ...u,
          client_name: clientMap[u.client_user_id] || "Unknown",
        }));

        return new Response(JSON.stringify({ usage: enriched }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Revenue Events ──
      case "revenue-events": {
        if (req.method === "GET") {
          const filterPartnerId = url.searchParams.get("partnerId");
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = (page - 1) * limit;

          let query = supabase
            .from("voip_revenue_events")
            .select("id, client_id, partner_id, amount, currency, type, description, created_at", { count: "exact" });

          if (filterPartnerId) query = query.eq("partner_id", parseInt(filterPartnerId));

          const { data: events, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;

          // Get names
          const allIds = [...new Set([
            ...(events || []).map(e => e.client_id),
            ...(events || []).map(e => e.partner_id),
          ])];

          let nameMap: Record<number, string> = {};
          if (allIds.length > 0) {
            const { data: users } = await supabase.from("voip_users").select("id, name").in("id", allIds);
            for (const u of users || []) nameMap[u.id] = u.name;
          }

          const enriched = (events || []).map(e => ({
            ...e,
            client_name: nameMap[e.client_id] || "Unknown",
            partner_name: nameMap[e.partner_id] || "Unknown",
          }));

          return new Response(JSON.stringify({
            events: enriched,
            pagination: { page, limit, total: count || 0 },
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { clientId, partnerId: eventPartnerId, amount, type, description } = body;

          if (!clientId || !eventPartnerId || !amount || !type) {
            return new Response(JSON.stringify({ error: "clientId, partnerId, amount, type required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Create revenue event
          const { data: event, error: evtErr } = await supabase
            .from("voip_revenue_events")
            .insert({
              client_id: clientId,
              partner_id: eventPartnerId,
              amount,
              type,
              description: description || null,
            })
            .select("id")
            .single();

          if (evtErr) throw evtErr;

          // Get commission rate from settings
          const { data: settings } = await supabase
            .from("voip_partner_settings")
            .select("commission_rate")
            .limit(1)
            .maybeSingle();

          const rate = settings?.commission_rate || 0.05;
          const commissionAmount = Number(amount) * Number(rate);

          // Create commission
          await supabase.from("voip_commissions").insert({
            revenue_event_id: event.id,
            partner_id: eventPartnerId,
            commission_amount: commissionAmount,
            commission_rate: rate,
            status: "pending",
          });

          // Audit
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: "revenue_event_created",
            entity_type: "revenue_event",
            entity_id: event.id,
            details: { clientId, partnerId: eventPartnerId, amount, type, commissionAmount },
          });

          return new Response(JSON.stringify({ id: event.id, commissionAmount }), {
            status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      // ── Commissions ──
      case "commissions": {
        if (req.method === "GET") {
          const filterPartnerId = url.searchParams.get("partnerId");
          const filterStatus = url.searchParams.get("status");
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = (page - 1) * limit;

          let query = supabase
            .from("voip_commissions")
            .select("id, revenue_event_id, partner_id, commission_amount, commission_rate, status, notes, paid_at, created_at", { count: "exact" });

          if (filterPartnerId) query = query.eq("partner_id", parseInt(filterPartnerId));
          if (filterStatus) query = query.eq("status", filterStatus);

          const { data: commissions, count, error } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;

          // Get partner names
          const partnerIds = [...new Set((commissions || []).map(c => c.partner_id))];
          let partnerMap: Record<number, string> = {};
          if (partnerIds.length > 0) {
            const { data: partners } = await supabase.from("voip_users").select("id, name").in("id", partnerIds);
            for (const p of partners || []) partnerMap[p.id] = p.name;
          }

          // Summary stats
          const { data: allCommissions } = await supabase
            .from("voip_commissions")
            .select("commission_amount, status");

          let totalPending = 0, totalApproved = 0, totalPaid = 0;
          for (const c of allCommissions || []) {
            const amt = Number(c.commission_amount);
            if (c.status === "pending") totalPending += amt;
            else if (c.status === "approved") totalApproved += amt;
            else if (c.status === "paid") totalPaid += amt;
          }

          const enriched = (commissions || []).map(c => ({
            ...c,
            partner_name: partnerMap[c.partner_id] || "Unknown",
          }));

          return new Response(JSON.stringify({
            commissions: enriched,
            summary: { totalPending, totalApproved, totalPaid },
            pagination: { page, limit, total: count || 0 },
          }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        if (req.method === "PATCH") {
          const body = await req.json();
          const { commissionIds, newStatus, notes } = body;

          if (!commissionIds || !newStatus || !["approved", "paid"].includes(newStatus)) {
            return new Response(JSON.stringify({ error: "commissionIds and valid newStatus required" }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const updates: Record<string, unknown> = { status: newStatus };
          if (newStatus === "paid") updates.paid_at = new Date().toISOString();
          if (notes) updates.notes = notes;

          for (const id of commissionIds) {
            await supabase.from("voip_commissions").update(updates).eq("id", id);
          }

          // Audit
          await supabase.from("voip_admin_audit_log").insert({
            admin_id: adminId,
            action: `commission_${newStatus}`,
            entity_type: "commission",
            details: { commissionIds, newStatus },
          });

          return new Response(JSON.stringify({ message: `${commissionIds.length} commission(s) updated to ${newStatus}` }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      // ── Commissions Export (CSV) ──
      case "commissions-export": {
        const filterPartnerId = url.searchParams.get("partnerId");
        const filterStatus = url.searchParams.get("status");

        let query = supabase
          .from("voip_commissions")
          .select("id, partner_id, commission_amount, commission_rate, status, paid_at, created_at");

        if (filterPartnerId) query = query.eq("partner_id", parseInt(filterPartnerId));
        if (filterStatus) query = query.eq("status", filterStatus);

        const { data: commissions, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;

        // Get partner names
        const partnerIds = [...new Set((commissions || []).map(c => c.partner_id))];
        let partnerMap: Record<number, string> = {};
        if (partnerIds.length > 0) {
          const { data: partners } = await supabase.from("voip_users").select("id, name").in("id", partnerIds);
          for (const p of partners || []) partnerMap[p.id] = p.name;
        }

        let csv = "ID,Partner,Amount,Rate,Status,Paid At,Created At\n";
        for (const c of commissions || []) {
          csv += `${c.id},"${partnerMap[c.partner_id] || 'Unknown'}",${c.commission_amount},${c.commission_rate},${c.status},${c.paid_at || ''},${c.created_at}\n`;
        }

        return new Response(csv, {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=commissions-export.csv",
          },
        });
      }

      // ── Partner Settings ──
      case "partner-settings": {
        if (req.method === "GET") {
          const { data: settings } = await supabase
            .from("voip_partner_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          return new Response(JSON.stringify(settings || {}), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (req.method === "POST") {
          const body = await req.json();
          const { commissionRate, bonusType, bonusValue, bonusEnabled, applyBonusOncePerClient } = body;

          const updates: Record<string, unknown> = {
            updated_by: adminId,
            updated_at: new Date().toISOString(),
          };

          if (commissionRate !== undefined) updates.commission_rate = commissionRate;
          if (bonusType !== undefined) updates.bonus_type = bonusType;
          if (bonusValue !== undefined) updates.bonus_value = bonusValue;
          if (bonusEnabled !== undefined) updates.bonus_enabled = bonusEnabled;
          if (applyBonusOncePerClient !== undefined) updates.apply_bonus_once_per_client = applyBonusOncePerClient;

          // Update the single settings row
          const { data: existing } = await supabase.from("voip_partner_settings").select("id").limit(1).maybeSingle();

          if (existing) {
            await supabase.from("voip_partner_settings").update(updates).eq("id", existing.id);
          } else {
            await supabase.from("voip_partner_settings").insert({ ...updates });
          }

          return new Response(JSON.stringify({ message: "Settings updated" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[voip-partner-admin] Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
