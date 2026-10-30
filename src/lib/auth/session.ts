export const SESSION_COOKIE_NAME = "aurora_session";

const AUTH_SECRET =
  process.env.QR_SIGNING_SECRET || "kaltarang-2026-aurora-super-secure-signing-secret-key-32b";

export const ADMIN_CREDENTIALS = {
  email: (process.env.ADMIN_EMAIL || "24mc3008@rgipt.ac.in").toLowerCase(),
  password: process.env.ADMIN_PASSWORD || "Kaltarang@2026",
};

export const COHEAD_CREDENTIALS = {
  // Single common login ID for Technical Co-Heads (+ their individual RGIPT emails also accepted with the same password)
  id: (process.env.COHEAD_EMAIL || "cohead@rgipt.ac.in").toLowerCase(),
  aliases: [
    "cohead@rgipt.ac.in",
    "cohead",
    "tech@rgipt.ac.in",
    "25cd3014@rgipt.ac.in", // Karan Sharma
    "25ec3055@rgipt.ac.in", // Yashveer Nenava
    "25ev3009@rgipt.ac.in", // Ayush Sharma
    "25cd3041@rgipt.ac.in", // Samarth Patil
    "25it3022@rgipt.ac.in", // Harsh Vardhan Tiwari
  ],
  password: process.env.COHEAD_PASSWORD || "CoHead@2026",
};

export const GUARD_CREDENTIALS = {
  username: (process.env.GUARD_USERNAME || "security@rgipt.ac.in").toLowerCase(),
  password: process.env.GUARD_PASSWORD || "Guard@2026",
};

export function isValidAdminOrCohead(identifier: string, password: string): boolean {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // Super Coordinator (Anurag Sharma)
  if (cleanId === ADMIN_CREDENTIALS.email && cleanPass === ADMIN_CREDENTIALS.password) {
    return true;
  }

  // Technical Co-Heads single common login
  if (
    COHEAD_CREDENTIALS.aliases.includes(cleanId) &&
    (cleanPass === COHEAD_CREDENTIALS.password || cleanPass === ADMIN_CREDENTIALS.password)
  ) {
    return true;
  }

  return false;
}

export interface SessionPayload {
  sub: string;
  role: "ADMIN" | "GUARD";
  gate?: string;
  exp: number;
}

async function hmacSignEdge(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function toBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf8").toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64url").toString("utf8");
  }
  const pad = b64.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad);
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const encoded = toBase64Url(JSON.stringify(full));
  const sig = await hmacSignEdge(encoded);
  return `${encoded}.${sig}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const expectedSig = await hmacSignEdge(encoded);
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(fromBase64Url(encoded)) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
