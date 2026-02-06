import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { supabase } from "../_shared/db.ts";
import { createJWT, createRefreshToken, verifyJWT, extractToken, hashPassword, verifyPassword } from "../_shared/auth.ts";

interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "client";
  status: string;
}

// Rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempts = loginAttempts.get(ip);
  if (!attempts) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (now - attempts.lastAttempt > windowMs) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempts.count >= maxAttempts) {
    return false;
  }

  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  
  console.log(`[voip-auth] ${req.method} action=${action}`);

  try {
    // Health check endpoint - test DB connectivity
    if (action === "health") {
      try {
        const { error } = await supabase.from("voip_users").select("id").limit(1);
        if (error) throw error;
        console.log("[voip-auth] Health check passed");
        return new Response(
          JSON.stringify({ ok: true, db: "connected" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("[voip-auth] Health check failed:", errMsg);
        return new Response(
          JSON.stringify({ ok: false, error: "Database connection failed", details: errMsg }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Parse JSON body with error handling
    let body: Record<string, unknown>;
    try {
      body = await req.json();
      console.log(`[voip-auth] Body keys: ${Object.keys(body).join(', ')}`);
    } catch (e) {
      console.error("[voip-auth] Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "login": {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        if (!checkRateLimit(ip)) {
          console.log(`[voip-auth] Rate limit exceeded for IP: ${ip}`);
          return new Response(
            JSON.stringify({ error: "Too many login attempts. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const email = body.email as string;
        const password = body.password as string;

        if (!email || !password) {
          console.log(`[voip-auth] Missing fields - email: ${!!email}, password: ${!!password}`);
          return new Response(
            JSON.stringify({ error: "Email and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[voip-auth] Looking up user: ${email.toLowerCase().trim()}`);
        
        const { data: users, error: userError } = await supabase
          .from("voip_users")
          .select("id, name, email, password_hash, role, status")
          .eq("email", email.toLowerCase().trim());
        
        if (userError) {
          console.error("[voip-auth] User query error:", userError);
          throw userError;
        }
        
        console.log(`[voip-auth] User query returned ${users?.length || 0} rows`);

        if (!users || users.length === 0) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = users[0] as User;

        if (user.status !== "active") {
          return new Response(
            JSON.stringify({ error: "Account is not active. Please contact support." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if user's signup token has expired (non-admin only)
        if (user.role !== "admin") {
          const { data: signupTokens } = await supabase
            .from("voip_signup_tokens")
            .select("expires_at")
            .eq("used_by", user.id)
            .limit(1);

          if (signupTokens && signupTokens.length > 0) {
            const tokenExpiry = signupTokens[0].expires_at;
            if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
              console.log(`[voip-auth] Login blocked - token expired for user ${user.id}`);
              return new Response(
                JSON.stringify({ error: "Your invite token has expired. Please contact an admin for a new invite." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }

        const passwordMatch = await verifyPassword(password, user.password_hash);
        if (!passwordMatch) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update last login
        await supabase
          .from("voip_users")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", user.id);

        const token = await createJWT(user.id, user.email, user.role, user.name);
        const refreshToken = await createRefreshToken(user.id);

        return new Response(
          JSON.stringify({
            token,
            refreshToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "signup": {
        const name = body.name as string;
        const email = body.email as string;
        const password = body.password as string;
        const inviteToken = body.inviteToken as string;

        // Validate invite token first
        if (!inviteToken) {
          return new Response(
            JSON.stringify({ error: "Invite token is required. Please contact an admin to get an invite." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if invite token exists and is valid
        const { data: invites, error: inviteError } = await supabase
          .from("voip_signup_tokens")
          .select("id, email, expires_at, used_by")
          .eq("token", inviteToken.trim());

        if (inviteError) throw inviteError;

        if (!invites || invites.length === 0) {
          return new Response(
            JSON.stringify({ error: "Invalid invite token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const invite = invites[0];

        if (invite.used_by) {
          return new Response(
            JSON.stringify({ error: "This invite token has already been used" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
          return new Response(
            JSON.stringify({ error: "This invite token has expired" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If token is email-specific, validate it matches
        if (invite.email && invite.email.toLowerCase() !== email.toLowerCase().trim()) {
          return new Response(
            JSON.stringify({ error: "This invite token was issued for a different email address" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validation
        if (!name || name.length < 2 || name.length > 100) {
          return new Response(
            JSON.stringify({ error: "Name must be between 2 and 100 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return new Response(
            JSON.stringify({ error: "Invalid email address" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!password || password.length < 8) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 8 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!/[A-Z]/.test(password)) {
          return new Response(
            JSON.stringify({ error: "Password must contain at least one uppercase letter" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!/[0-9]/.test(password)) {
          return new Response(
            JSON.stringify({ error: "Password must contain at least one number" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if email exists
        const { data: existingUsers } = await supabase
          .from("voip_users")
          .select("id")
          .eq("email", email.toLowerCase().trim());

        if (existingUsers && existingUsers.length > 0) {
          return new Response(
            JSON.stringify({ error: "An account with this email already exists" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const { data: newUser, error: createError } = await supabase
          .from("voip_users")
          .insert({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password_hash: passwordHash,
            role: "client",
            status: "active",
          })
          .select("id")
          .single();

        if (createError) throw createError;

        // Mark invite token as used
        await supabase
          .from("voip_signup_tokens")
          .update({ used_by: newUser.id, used_at: new Date().toISOString() })
          .eq("id", invite.id);

        const token = await createJWT(newUser.id, email, "client", name);
        const refreshToken = await createRefreshToken(newUser.id);

        return new Response(
          JSON.stringify({
            token,
            refreshToken,
            user: {
              id: newUser.id,
              name: name.trim(),
              email: email.toLowerCase().trim(),
              role: "client",
            },
          }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "refresh": {
        const refreshToken = body.refreshToken as string;

        if (!refreshToken) {
          return new Response(
            JSON.stringify({ error: "Refresh token is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const payload = await verifyJWT(refreshToken);
        if (!payload || (payload as unknown as { type?: string }).type !== "refresh") {
          return new Response(
            JSON.stringify({ error: "Invalid refresh token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: users } = await supabase
          .from("voip_users")
          .select("id, name, email, role, status")
          .eq("id", parseInt(payload.sub));

        if (!users || users.length === 0 || users[0].status !== "active") {
          return new Response(
            JSON.stringify({ error: "User not found or inactive" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = users[0];
        const token = await createJWT(user.id, user.email, user.role, user.name);
        const newRefreshToken = await createRefreshToken(user.id);

        return new Response(
          JSON.stringify({ token, refreshToken: newRefreshToken }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "me": {
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

        const { data: users } = await supabase
          .from("voip_users")
          .select("id, name, email, role, status, suspension_reason")
          .eq("id", parseInt(payload.sub));

        if (!users || users.length === 0) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = users[0];

        // Check if user's signup token has expired (only for non-admin users)
        let effectiveStatus = user.status;
        if (user.role !== "admin" && user.status === "active") {
          const { data: signupTokens } = await supabase
            .from("voip_signup_tokens")
            .select("expires_at")
            .eq("used_by", user.id)
            .limit(1);

          if (signupTokens && signupTokens.length > 0) {
            const tokenExpiry = signupTokens[0].expires_at;
            if (tokenExpiry && new Date(tokenExpiry) < new Date()) {
              effectiveStatus = "token_expired";
              console.log(`[voip-auth] User ${user.id} token expired at ${tokenExpiry}`);
            }
          }
        }

        return new Response(
          JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: effectiveStatus,
            suspension_reason: user.suspension_reason || null,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[voip-auth] Error:", errMsg);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
