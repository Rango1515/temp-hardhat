import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { hash as bcryptHash, compare as bcryptCompare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const encoder = new TextEncoder();

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

export async function createJWT(
  userId: number,
  email: string,
  role: string,
  name: string,
  expiresInHours: number = 1
): Promise<string> {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const key = await getCryptoKey(secret);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: userId.toString(),
    email,
    role,
    name,
    iat: now,
    exp: getNumericDate(60 * 60 * expiresInHours),
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

export async function createRefreshToken(userId: number): Promise<string> {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const key = await getCryptoKey(secret);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: userId.toString(),
    type: "refresh",
    iat: now,
    exp: getNumericDate(60 * 60 * 24 * 7), // 7 days
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const secret = Deno.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  try {
    const key = await getCryptoKey(secret);
    const payload = await verify(token, key);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.replace("Bearer ", "");
}

// Password hashing using Web Crypto API (more reliable in Deno Deploy)
export async function hashPassword(password: string): Promise<string> {
  // Use a simple SHA-256 based hash with salt for compatibility
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const passwordWithSalt = encoder.encode(password + saltHex);
  const hashBuffer = await crypto.subtle.digest('SHA-256', passwordWithSalt);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Format: $sha256$salt$hash
  return `$sha256$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check if it's our SHA-256 format
  if (storedHash.startsWith('$sha256$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    
    const salt = parts[2];
    const expectedHash = parts[3];
    
    const passwordWithSalt = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordWithSalt);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return actualHash === expectedHash;
  }
  
  // Try bcrypt for backwards compatibility (may not work in all environments)
  try {
    return await bcryptCompare(password, storedHash);
  } catch {
    console.error("bcrypt comparison failed, trying direct comparison");
    return false;
  }
}
