import crypto from "crypto";

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
  const secret = process.env.QR_SIGNING_SECRET || "default-fallback-aurora-secret-32-bytes";
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
    const secret = process.env.QR_SIGNING_SECRET || "default-fallback-aurora-secret-32-bytes";
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
