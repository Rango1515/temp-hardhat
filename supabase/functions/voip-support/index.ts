 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { verifyJWT, extractToken } from "../_shared/auth.ts";
 import { corsHeaders } from "../_shared/cors.ts";
 
 const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
 const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 const supabase = createClient(supabaseUrl, supabaseServiceKey);
 
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
       // Get user's tickets
       if (action === "my-tickets") {
         const { data: tickets } = await supabase
           .from("voip_support_tickets")
           .select(`
             *,
             assigned_user:voip_users!voip_support_tickets_assigned_to_fkey(name, email)
           `)
           .eq("user_id", user.id)
           .order("created_at", { ascending: false });
 
         return new Response(JSON.stringify({ tickets: tickets || [] }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Get all tickets (admin only)
       if (action === "all-tickets") {
         if (user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Admin only" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { data: tickets } = await supabase
           .from("voip_support_tickets")
           .select(`
             *,
             user:voip_users!voip_support_tickets_user_id_fkey(name, email),
             assigned_user:voip_users!voip_support_tickets_assigned_to_fkey(name, email)
           `)
           .order("created_at", { ascending: false });
 
         return new Response(JSON.stringify({ tickets: tickets || [] }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Get ticket messages
       if (action === "ticket-messages") {
         const ticketId = url.searchParams.get("ticketId");
         if (!ticketId) {
           return new Response(JSON.stringify({ error: "Ticket ID required" }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         // Check access
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
 
         const { data: messages } = await supabase
           .from("voip_support_ticket_messages")
           .select(`
             *,
             user:voip_users!voip_support_ticket_messages_user_id_fkey(name, email)
           `)
           .eq("ticket_id", ticketId)
           .order("created_at", { ascending: true });
 
         return new Response(JSON.stringify({ ticket, messages: messages || [] }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
     }
 
     // POST actions
     if (req.method === "POST") {
       const body = await req.json();
 
       // Create ticket
       if (action === "create-ticket") {
         const { subject, content, priority, attachmentUrl } = body;
 
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
             priority: priority || "medium",
           })
           .select()
           .single();
 
         if (ticketError) throw ticketError;
 
         // Add initial message
         await supabase.from("voip_support_ticket_messages").insert({
           ticket_id: ticket.id,
           user_id: user.id,
           content: content.trim(),
           attachment_url: attachmentUrl || null,
           is_admin_reply: false,
         });
 
         return new Response(JSON.stringify({ ticket }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Reply to ticket
       if (action === "reply-ticket") {
         const { ticketId, content, attachmentUrl } = body;
 
         if (!ticketId || !content?.trim()) {
           return new Response(JSON.stringify({ error: "Ticket ID and content required" }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         // Check access
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
 
         await supabase.from("voip_support_ticket_messages").insert({
           ticket_id: ticketId,
           user_id: user.id,
           content: content.trim(),
           attachment_url: attachmentUrl || null,
           is_admin_reply: user.role === "admin",
         });
 
         // Update ticket timestamp
         await supabase
           .from("voip_support_tickets")
           .update({ updated_at: new Date().toISOString() })
           .eq("id", ticketId);
 
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Update ticket status (admin only or own ticket)
       if (action === "update-ticket") {
         const { ticketId, status, priority, assignedTo } = body;
 
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
 
         // Only admins can change status/priority/assignment
         if (user.role !== "admin" && ticket.user_id !== user.id) {
           return new Response(JSON.stringify({ error: "Unauthorized" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const updates: Record<string, unknown> = {
           updated_at: new Date().toISOString(),
         };
 
         if (status) updates.status = status;
         if (priority && user.role === "admin") updates.priority = priority;
         if (assignedTo !== undefined && user.role === "admin") updates.assigned_to = assignedTo;
         if (status === "closed" || status === "resolved") {
           updates.closed_at = new Date().toISOString();
         }
 
         await supabase.from("voip_support_tickets").update(updates).eq("id", ticketId);
 
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