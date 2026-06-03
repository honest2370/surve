import crypto from "crypto";

/**
 * Generate HMAC SHA-256 signature for webhook validation.
 * Uses the SURVEY_SECRET_KEY env var to compute the signature.
 */
export function generateHmacSignature(payload: string): string {
  const secret = process.env.SURVEY_SECRET_KEY || "";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify an incoming HMAC signature against the expected one.
 */
export function verifyHmacSignature(
  payload: string,
  incomingSignature: string
): boolean {
  const expected = generateHmacSignature(payload);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(incomingSignature, "hex")
  );
}

/**
 * Convert USD reward to points (1000 points = $1.00).
 */
export function usdToPoints(usd: number): number {
  return Math.round(usd * 1000);
}

/**
 * Convert points to USD.
 */
export function pointsToUsd(points: number): number {
  return points / 1000;
}

/**
 * Generate a referral code from a user id.
 */
export function generateReferralCode(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

/**
 * Hash a password using SHA-256 (for demo; use bcrypt in production).
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password matches hash.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
