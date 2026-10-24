import { createHash } from "crypto";
import type { Firestore } from "firebase-admin/firestore";

// Turnstile tokens live 300s; keep the record a day so a TTL policy on expiresAt can purge it.
const RECORD_TTL_MS = 24 * 60 * 60 * 1000;
const ALREADY_EXISTS = 6;

// Enforces single use of a Turnstile token on our side, regardless of what siteverify reports.
// create() is atomic, so concurrent replays of the same token cannot both succeed.
// Fails closed: any error other than "first use" rejects the token.
export async function claimTurnstileToken(db: Firestore, token: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  try {
    await db.collection("turnstileTokens").doc(tokenHash).create({
      claimedAt: new Date(),
      expiresAt: new Date(Date.now() + RECORD_TTL_MS),
    });
    return true;
  } catch (err) {
    if ((err as { code?: number }).code !== ALREADY_EXISTS) {
      console.error("Failed to record Turnstile token:", err);
    }
    return false;
  }
}
