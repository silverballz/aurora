import crypto from "crypto";

const DEFAULT_SECRET = "kaltarang-2026-aurora-super-secure-signing-secret-key-32b";

function getSecret(): string {
  return process.env.QR_SIGNING_SECRET || DEFAULT_SECRET;
}

/**
 * Generates a cryptographically secure random token (e.g. for invitations or QR credentials)
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Computes a SHA-256 hash of a token for safe database indexing and lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Signs an opaque QR payload with HMAC-SHA256
 */
export function signQrToken(token: string): string {
  const secret = getSecret();
  const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${signature.slice(0, 16)}`;
}

/**
 * Verifies an opaque signed QR token and extracts the raw token
 */
export function verifyAndExtractQrToken(signedToken: string): { valid: boolean; rawToken: string } {
  try {
    const parts = signedToken.split(".");
    if (parts.length !== 2) {
      return { valid: false, rawToken: "" };
    }
    const [token, signature] = parts;
    const secret = getSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(token).digest("hex").slice(0, 16);

    const match = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );

    return { valid: match, rawToken: token };
  } catch {
    return { valid: false, rawToken: "" };
  }
}

export interface SignedQrClaims {
  id: string;
  reg: string;
  name: string;
  email: string;
  col: string;
  crs: string;
  yr: string;
}

/**
 * Creates a compact, cryptographically signed static QR credential (`KLT26.<base64url>.<hmac16>`)
 * that works across both stateful stores and stateless serverless instances.
 */
export function createSignedParticipantQr(claims: SignedQrClaims): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(`KLT26.${payload}`)
    .digest("hex")
    .slice(0, 16);
  return `KLT26.${payload}.${sig}`;
}

/**
 * Verifies a `KLT26.<base64url>.<hmac16>` signed QR credential and returns the decoded claims.
 */
export function verifySignedParticipantQr(token: string): {
  valid: boolean;
  claims?: SignedQrClaims;
} {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3 || parts[0] !== "KLT26") {
      return { valid: false };
    }
    const [, payload, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(`KLT26.${payload}`)
      .digest("hex")
      .slice(0, 16);

    if (sig.length !== expectedSig.length) {
      return { valid: false };
    }

    const match = crypto.timingSafeEqual(
      Buffer.from(sig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    if (!match) {
      return { valid: false };
    }

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SignedQrClaims;
    if (!claims?.id || !claims?.reg) {
      return { valid: false };
    }
    return { valid: true, claims };
  } catch {
    return { valid: false };
  }
}
