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

// Password hashing using Web Crypto API (more reliable in Deno Deploy)
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `$pbkdf2$100000$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('$pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 5) return false;
    
    const iterations = parseInt(parts[2]);
    const saltHex = parts[3];
    const expectedHash = parts[4];
    
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return actualHash === expectedHash;
  }
  
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
  
  console.error("Unknown password hash format:", storedHash.substring(0, 10));
  return false;
}