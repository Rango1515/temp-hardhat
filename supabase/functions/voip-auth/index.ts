import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { query, execute } from "../_shared/db.ts";
import { createJWT, createRefreshToken, verifyJWT, extractToken } from "../_shared/auth.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

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
  // Handle CORS preflight
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
        const testResult = await query("SELECT 1 as test");
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

        const users = await query<User>(
          "SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?",
          [email.toLowerCase().trim()]
        );

        if (users.length === 0) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = users[0];

        if (user.status !== "active") {
          return new Response(
            JSON.stringify({ error: "Account is not active. Please contact support." }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
          return new Response(
            JSON.stringify({ error: "Invalid email or password" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update last login
        await execute("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        // Log activity
        await execute(
          "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
          [user.id, "login", JSON.stringify({ email: user.email }), ip]
        );

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
        const invites = await query<{ id: number; email: string | null; expires_at: string | null; used: number }>(
          "SELECT id, email, expires_at, used FROM signup_tokens WHERE token = ?",
          [inviteToken.trim()]
        );

        if (invites.length === 0) {
          return new Response(
            JSON.stringify({ error: "Invalid invite token" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const invite = invites[0];

        if (invite.used) {
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
        const existingUsers = await query<{ id: number }>(
          "SELECT id FROM users WHERE email = ?",
          [email.toLowerCase().trim()]
        );

        if (existingUsers.length > 0) {
          return new Response(
            JSON.stringify({ error: "An account with this email already exists" }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await execute(
          "INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'client', 'active')",
          [name.trim(), email.toLowerCase().trim(), passwordHash]
        );

        // Mark invite token as used
        await execute(
          "UPDATE signup_tokens SET used = 1, used_by = ?, used_at = NOW() WHERE id = ?",
          [result.lastInsertId, invite.id]
        );

        // Create analytics entry
        await execute(
          "INSERT INTO user_analytics (user_id) VALUES (?)",
          [result.lastInsertId]
        );

        // Log activity
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        await execute(
          "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
          [result.lastInsertId, "signup", JSON.stringify({ email, inviteTokenId: invite.id }), ip]
        );

        const token = await createJWT(result.lastInsertId, email, "client", name);
        const refreshToken = await createRefreshToken(result.lastInsertId);

        return new Response(
          JSON.stringify({
            token,
            refreshToken,
            user: {
              id: result.lastInsertId,
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

        const users = await query<User>(
          "SELECT id, name, email, role, status FROM users WHERE id = ?",
          [parseInt(payload.sub)]
        );

        if (users.length === 0 || users[0].status !== "active") {
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

        const users = await query<User>(
          "SELECT id, name, email, role, status FROM users WHERE id = ?",
          [parseInt(payload.sub)]
        );

        if (users.length === 0) {
          return new Response(
            JSON.stringify({ error: "User not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const user = users[0];
        return new Response(
          JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
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
    const isDbError = errMsg.includes("lookup address") || 
                     errMsg.includes("connection") ||
                     errMsg.includes("MARIADB");
    return new Response(
      JSON.stringify({ 
        error: isDbError 
          ? "Database connection failed. Please try again later." 
          : "Internal server error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
