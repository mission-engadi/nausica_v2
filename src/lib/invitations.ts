import { sendInvitationEmail } from "./email";
import { InvitationSchema, type InvitationInput } from "./invitation-schema";
import { verifyTurnstileToken } from "./turnstile";
import { claimTurnstileToken } from "./token-claim";
import { adminDb, FieldValue } from "./firebase-admin";
import { ZodError } from "zod";

export type InvitationResult = {
  success: boolean;
  error?: string;
  emailFailed?: boolean;
  status: number;
};

export async function submitInvitation(
  formData: unknown,
  turnstileToken: unknown,
  remoteIp?: string
): Promise<InvitationResult> {
  // 1. Verify Turnstile token (blocks bots before any DB or email work)
  const token = typeof turnstileToken === "string" ? turnstileToken : "";
  const isHuman =
    (await verifyTurnstileToken(token, "invitation", remoteIp)) &&
    (await claimTurnstileToken(adminDb, token));
  if (!isHuman) {
    return { success: false, error: "Verifica anti-bot fallita. Riprova.", status: 403 };
  }

  // 2. Validate fields
  let validatedData: InvitationInput;
  try {
    validatedData = InvitationSchema.parse(formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: "Dati non validi: " + error.issues.map((e: { message: string }) => e.message).join(", "),
        status: 400,
      };
    }
    return { success: false, error: "Errore di sistema, riprova più tardi", status: 500 };
  }

  // 3. Write to Firestore via Admin SDK (bypasses client security rules)
  try {
    await adminDb.collection("invitations").add({
      ...validatedData,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    return { success: false, error: "Errore di sistema, riprova più tardi", status: 500 };
  }

  // 4. Send notification email (failure is non-fatal — record is already saved)
  const emailResult = await sendInvitationEmail(validatedData);
  if (!emailResult.success) {
    console.error("Email delivery failed:", emailResult.error);
    return { success: true, emailFailed: true, status: 200 };
  }

  return { success: true, status: 200 };
}
