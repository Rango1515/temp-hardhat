
# Fix VoIP Auth Login Flow

## Problem Summary

Based on the edge function logs, the login is failing because:

1. **MariaDB connection cannot be established** - The logs show `"connecting MariaDB server host:3306"` followed by `"failed to lookup address information: Name or service not known"`. This means the `MARIADB_HOST` secret is set to an invalid value (likely just "host" as a placeholder).

2. **No detailed error logging** - When the database connection fails, the error is caught but the generic "Internal server error" message is returned, hiding the real issue.

3. **Duplicate login requests** - The frontend makes two API calls on login (one that's ignored).

## Files to Modify

### 1. Edge Function: `supabase/functions/voip-auth/index.ts`
Add detailed logging for debugging and better error handling:

- Log incoming request details (method, action, body fields present)
- Wrap `req.json()` in try/catch to handle malformed JSON
- Add specific error logging for database connection failures
- Add a health check action to verify DB connectivity without login
- Include request validation details in error responses for debugging

**Changes:**
- Add debug logging at the start of each action handler
- Add JSON parse error handling with specific 400 response
- Add `action=health` endpoint to test DB connectivity
- Log which specific field validation failed

### 2. Auth Context: `src/contexts/VoipAuthContext.tsx`
Fix duplicate API calls and add frontend logging:

- Remove the unused `supabase.functions.invoke` call (lines 53-57)
- Add console.log for the request payload being sent
- Add console.log for the full response (status + body)
- Handle and display specific error messages from the backend

### 3. Database Helper: `supabase/functions/_shared/db.ts`
Add a health check function and improve error logging:

- Add `testConnection()` function for health checks
- Log connection parameters (without password) for debugging
- Add better error messages for connection failures

---

## What You Need to Fix Manually

**CRITICAL**: The `MARIADB_HOST` secret must be updated with your actual MariaDB server address. Based on the logs showing `"connecting MariaDB server host:3306"`, the current value is likely just `host` which is invalid.

You need to:
1. Update `MARIADB_HOST` to your actual server hostname or IP (e.g., `db.yourserver.com` or `192.168.1.100`)
2. Ensure the Edge Functions can reach that host (not `localhost` unless MariaDB is on the same network)
3. Verify firewall rules allow connections from Supabase Edge Functions

---

## Technical Changes

### Edge Function Changes (`voip-auth/index.ts`)

```typescript
// Add at the beginning of the serve handler, after OPTIONS check:
console.log(`[voip-auth] ${req.method} action=${action}`);

// Wrap req.json() in try/catch:
let body;
try {
  body = await req.json();
  console.log(`[voip-auth] Body keys: ${Object.keys(body).join(', ')}`);
} catch (e) {
  return new Response(
    JSON.stringify({ error: "Invalid JSON body" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Add health check action:
case "health": {
  try {
    const testResult = await query("SELECT 1 as test");
    return new Response(
      JSON.stringify({ ok: true, db: "connected" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: "Database connection failed" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Improve error logging in catch block:
catch (error) {
  console.error("[voip-auth] Error:", error.message);
  const isDbError = error.message?.includes("lookup address") || 
                   error.message?.includes("connection");
  return new Response(
    JSON.stringify({ 
      error: isDbError 
        ? "Database connection failed. Please try again later." 
        : "Internal server error"
    }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Auth Context Changes (`VoipAuthContext.tsx`)

```typescript
const login = useCallback(async (email: string, password: string) => {
  try {
    const payload = { email, password };
    console.log("[VoipAuth] Login request payload:", { email, password: "***" });

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voip-auth?action=login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("[VoipAuth] Login response:", { status: response.status, result });

    if (!response.ok) {
      return { success: false, error: result.error || "Login failed" };
    }
    // ... rest of the function
  } catch (error) {
    console.error("[VoipAuth] Login error:", error);
    return { success: false, error: "Connection error. Please try again." };
  }
}, []);
```

### Database Helper Changes (`_shared/db.ts`)

```typescript
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = await getDBClient();
    await db.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// In getDBClient(), add logging:
console.log(`[DB] Connecting to MariaDB at ${host}:${port || 3306}`);
```

---

## Expected Request Schema

**Login Request (POST voip-auth?action=login):**
```json
{
  "email": "user@example.com",  // required, string
  "password": "password123"     // required, string
}
```

**Headers:**
```
Content-Type: application/json
```
No Authorization header required for login.

---

## Verification Steps

After fixes are applied:

1. **Test Health Endpoint**: Call `GET /voip-auth?action=health` to verify DB connectivity
2. **Check Browser Console**: Look for `[VoipAuth]` logs showing request/response
3. **Check Edge Function Logs**: Look for `[voip-auth]` logs in Supabase logs
4. **Update MARIADB_HOST**: This is the most critical fix - ensure it's a valid, reachable hostname

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/voip-auth/index.ts` | Add debug logging, JSON parse error handling, health check endpoint, better error messages |
| `src/contexts/VoipAuthContext.tsx` | Remove duplicate API call, add request/response logging |
| `supabase/functions/_shared/db.ts` | Add connection logging, testConnection() function |

All changes are minimal, non-destructive to the database schema, and can be easily reverted by removing the console.log statements.
