import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

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
