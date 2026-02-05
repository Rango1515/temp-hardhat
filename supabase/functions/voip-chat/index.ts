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
     // Verify auth
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
       // Initialize chat - get channels and profile
       if (action === "init") {
         const { data: channels } = await supabase
           .from("voip_chat_channels")
           .select("*")
           .is("deleted_at", null)
           .order("name");
 
         const { data: profile } = await supabase
           .from("voip_chat_user_status")
           .select("*")
           .eq("user_id", user.id)
           .single();
 
         return new Response(
           JSON.stringify({ channels: channels || [], profile }),
           { headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       // Get messages for a channel
       if (action === "messages") {
         const channelId = url.searchParams.get("channelId");
         if (!channelId) {
           return new Response(JSON.stringify({ error: "Channel ID required" }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { data: messages } = await supabase
           .from("voip_chat_messages")
           .select(`
             id, channel_id, user_id, content, image_url, is_pinned, edited_at, created_at,
             voip_chat_user_status!inner(display_name, avatar_url)
           `)
           .eq("channel_id", channelId)
           .is("deleted_at", null)
           .order("created_at", { ascending: true })
           .limit(100);
 
         const formattedMessages = (messages || []).map((msg: any) => ({
           id: msg.id,
           channel_id: msg.channel_id,
           user_id: msg.user_id,
           content: msg.content,
           image_url: msg.image_url,
           is_pinned: msg.is_pinned,
           edited_at: msg.edited_at,
           created_at: msg.created_at,
           user_name: msg.voip_chat_user_status?.display_name || "Unknown",
           user_avatar: msg.voip_chat_user_status?.avatar_url,
         }));
 
         return new Response(JSON.stringify({ messages: formattedMessages }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
     }
 
     // POST actions
     if (req.method === "POST") {
       const body = await req.json();
 
       // Save profile
       if (action === "save-profile") {
         const { displayName, bio, avatarUrl } = body;
         
         if (!displayName?.trim()) {
           return new Response(JSON.stringify({ error: "Display name required" }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { data: existing } = await supabase
           .from("voip_chat_user_status")
           .select("id")
           .eq("user_id", user.id)
           .single();
 
         let profile;
         if (existing) {
           const { data } = await supabase
             .from("voip_chat_user_status")
             .update({
               display_name: displayName.trim(),
               bio: bio || null,
               avatar_url: avatarUrl || null,
               updated_at: new Date().toISOString(),
             })
             .eq("user_id", user.id)
             .select()
             .single();
           profile = data;
         } else {
           const { data } = await supabase
             .from("voip_chat_user_status")
             .insert({
               user_id: user.id,
               display_name: displayName.trim(),
               bio: bio || null,
               avatar_url: avatarUrl || null,
             })
             .select()
             .single();
           profile = data;
         }
 
         return new Response(JSON.stringify({ profile }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Send message
       if (action === "send-message") {
         const { channelId, content, imageUrl } = body;
 
         // Check if user has a profile
         const { data: profile } = await supabase
           .from("voip_chat_user_status")
           .select("*")
           .eq("user_id", user.id)
           .single();
 
         if (!profile) {
           return new Response(JSON.stringify({ error: "Profile required" }), {
             status: 400,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         if (profile.is_banned) {
           return new Response(JSON.stringify({ error: "You are banned" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         if (profile.is_muted) {
           return new Response(JSON.stringify({ error: "You are muted" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         // Check channel permissions
         const { data: channel } = await supabase
           .from("voip_chat_channels")
           .select("*")
           .eq("id", channelId)
           .single();
 
         if (!channel) {
           return new Response(JSON.stringify({ error: "Channel not found" }), {
             status: 404,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         if (channel.admin_only && user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Admin only channel" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         if (channel.is_locked) {
           return new Response(JSON.stringify({ error: "Channel is locked" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { data: message, error } = await supabase
           .from("voip_chat_messages")
           .insert({
             channel_id: channelId,
             user_id: user.id,
             content: content.trim(),
             image_url: imageUrl || null,
           })
           .select()
           .single();
 
         if (error) throw error;
 
         return new Response(JSON.stringify({ message }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Edit message
       if (action === "edit-message") {
         const { messageId, content } = body;
 
         const { data: existing } = await supabase
           .from("voip_chat_messages")
           .select("*")
           .eq("id", messageId)
           .single();
 
         if (!existing) {
           return new Response(JSON.stringify({ error: "Message not found" }), {
             status: 404,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         if (existing.user_id !== user.id && user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Unauthorized" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         await supabase
           .from("voip_chat_messages")
           .update({
             content: content.trim(),
             edited_at: new Date().toISOString(),
           })
           .eq("id", messageId);
 
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Pin/unpin message (admin only)
       if (action === "pin-message") {
         if (user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Admin only" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { messageId, pin } = body;
         await supabase
           .from("voip_chat_messages")
           .update({ is_pinned: pin })
           .eq("id", messageId);
 
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Mute/unmute user (admin only)
       if (action === "mute-user") {
         if (user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Admin only" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { userId, mute, until } = body;
         await supabase
           .from("voip_chat_user_status")
           .update({
             is_muted: mute,
             muted_until: until || null,
           })
           .eq("user_id", userId);
 
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
 
       // Ban/unban user (admin only)
       if (action === "ban-user") {
         if (user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Admin only" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         const { userId, ban } = body;
         await supabase
           .from("voip_chat_user_status")
           .update({ is_banned: ban })
           .eq("user_id", userId);
 
         return new Response(JSON.stringify({ success: true }), {
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
     }
 
     // DELETE actions
     if (req.method === "DELETE") {
       if (action === "delete-message") {
         const messageId = url.searchParams.get("messageId");
 
         const { data: existing } = await supabase
           .from("voip_chat_messages")
           .select("*")
           .eq("id", messageId)
           .single();
 
         if (!existing) {
           return new Response(JSON.stringify({ error: "Message not found" }), {
             status: 404,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         // Users can delete their own messages, admins can delete any
         if (existing.user_id !== user.id && user.role !== "admin") {
           return new Response(JSON.stringify({ error: "Unauthorized" }), {
             status: 403,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
 
         await supabase
           .from("voip_chat_messages")
           .update({ deleted_at: new Date().toISOString() })
           .eq("id", messageId);
 
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
     console.error("Chat error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });