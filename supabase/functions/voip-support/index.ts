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

    // GET actions
    if (req.method === "GET") {
      if (action === "ticket-count") {
        if (user.role === "admin") {
          const { count } = await supabase
            .from("voip_support_tickets")
            .select("*", { count: "exact", head: true })
            .in("status", ["open", "in_progress"]);

          return new Response(JSON.stringify({ count: count || 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const { count } = await supabase
            .from("voip_support_tickets")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("has_new_reply", true);

          return new Response(JSON.stringify({ count: count || 0 }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (action === "my-tickets") {
        const { data: tickets } = await supabase
          .from("voip_support_tickets")
          .select(`*, assigned_user:voip_users!voip_support_tickets_assigned_to_fkey(name, email)`)
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        return new Response(JSON.stringify({ tickets: tickets || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "all-tickets") {
        if (user.role !== "admin") {
          return new Response(JSON.stringify({ error: "Admin only" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: tickets } = await supabase
          .from("voip_support_tickets")
          .select(`*, user:voip_users!voip_support_tickets_user_id_fkey(name, email), assigned_user:voip_users!voip_support_tickets_assigned_to_fkey(name, email)`)
          .order("updated_at", { ascending: false });

        return new Response(JSON.stringify({ tickets: tickets || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "ticket-messages") {
        const ticketId = url.searchParams.get("ticketId");
        if (!ticketId) {
          return new Response(JSON.stringify({ error: "Ticket ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: ticket } = await supabase
          .from("voip_support_tickets")
          .select("*")
          .eq("id", ticketId)
          .single();

        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (ticket.user_id !== user.id && user.role !== "admin") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (ticket.user_id === user.id && ticket.has_new_reply) {
          await supabase
            .from("voip_support_tickets")
            .update({ has_new_reply: false })
            .eq("id", ticketId);
        }

        const { data: messages } = await supabase
          .from("voip_support_ticket_messages")
          .select(`*, user:voip_users!voip_support_ticket_messages_user_id_fkey(name, email)`)
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true });

        return new Response(JSON.stringify({ ticket: { ...ticket, has_new_reply: false }, messages: messages || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();

      if (action === "create-ticket") {
        const { subject, content, category, priority, attachmentUrl } = body;

        if (!subject?.trim() || !content?.trim()) {
          return new Response(JSON.stringify({ error: "Subject and message required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: ticket, error: ticketError } = await supabase
          .from("voip_support_tickets")
          .insert({
            user_id: user.id,
            subject: subject.trim(),
            category: category || "other",
            priority: priority || "medium",
          })
          .select()
          .single();

        if (ticketError) throw ticketError;

        await supabase.from("voip_support_ticket_messages").insert({
          ticket_id: ticket.id,
          user_id: user.id,
          content: content.trim(),
          attachment_url: attachmentUrl || null,
          is_admin_reply: false,
        });

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: user.id,
          action: "create_ticket",
          entity_type: "ticket",
          entity_id: ticket.id,
          details: { subject: ticket.subject, category: ticket.category },
        });

        return new Response(JSON.stringify({ ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "reply-ticket") {
        const { ticketId, content, attachmentUrl } = body;

        if (!ticketId || !content?.trim()) {
          return new Response(JSON.stringify({ error: "Ticket ID and content required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: ticket } = await supabase
          .from("voip_support_tickets")
          .select("*")
          .eq("id", ticketId)
          .single();

        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (ticket.user_id !== user.id && user.role !== "admin") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const isAdminReply = user.role === "admin";

        await supabase.from("voip_support_ticket_messages").insert({
          ticket_id: ticketId,
          user_id: user.id,
          content: content.trim(),
          attachment_url: attachmentUrl || null,
          is_admin_reply: isAdminReply,
        });

        const ticketUpdates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (isAdminReply) {
          ticketUpdates.has_new_reply = true;
        }

        await supabase
          .from("voip_support_tickets")
          .update(ticketUpdates)
          .eq("id", ticketId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "update-ticket") {
        const { ticketId, status, priority, assignedTo } = body;

        if (!ticketId) {
          return new Response(JSON.stringify({ error: "Ticket ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (user.role !== "admin") {
          return new Response(JSON.stringify({ error: "Admin only" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: ticket } = await supabase
          .from("voip_support_tickets")
          .select("*")
          .eq("id", ticketId)
          .single();

        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assignedTo !== undefined) updates.assigned_to = assignedTo;
        if (status === "closed" || status === "resolved") {
          updates.closed_at = new Date().toISOString();
        }

        await supabase.from("voip_support_tickets").update(updates).eq("id", ticketId);

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: user.id,
          action: "update_ticket",
          entity_type: "ticket",
          entity_id: ticketId,
          details: { status, priority, previous_status: ticket.status },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete-ticket") {
        const { ticketId } = body;

        if (!ticketId) {
          return new Response(JSON.stringify({ error: "Ticket ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (user.role !== "admin") {
          return new Response(JSON.stringify({ error: "Admin only" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: ticket } = await supabase
          .from("voip_support_tickets")
          .select("*")
          .eq("id", ticketId)
          .maybeSingle();

        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await supabase
          .from("voip_support_ticket_messages")
          .delete()
          .eq("ticket_id", ticketId);

        await supabase
          .from("voip_support_tickets")
          .delete()
          .eq("id", ticketId);

        await supabase.from("voip_admin_audit_log").insert({
          admin_id: user.id,
          action: "delete_ticket",
          entity_type: "ticket",
          entity_id: ticketId,
          details: { subject: ticket.subject, user_id: ticket.user_id },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Support error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});