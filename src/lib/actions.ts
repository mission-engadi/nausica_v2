"use server";

import { sendInvitationEmail } from "./email";
import { InvitationSchema, type InvitationInput } from "./invitation-schema";
import { verifyTurnstileToken } from "./turnstile";
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { ZodError } from "zod";

export async function submitInvitationAction(
  formData: InvitationInput,
  turnstileToken: string
): Promise<{ success: boolean; error?: string; emailFailed?: boolean }> {
  // 1. Verify Turnstile token (blocks bots before any DB or email work)
  const isHuman = await verifyTurnstileToken(turnstileToken);
  if (!isHuman) {
    return { success: false, error: "Verifica anti-bot fallita. Riprova." };
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
      };
    }
    return { success: false, error: "Errore di sistema, riprova più tardi" };
  }

  // 3. Write to Firestore via Admin SDK (bypasses client security rules)
  await adminDb.collection("invitations").add({
    ...validatedData,
    timestamp: FieldValue.serverTimestamp(),
  });

  // 4. Send notification email (failure is non-fatal — record is already saved)
  const emailResult = await sendInvitationEmail(validatedData);
  if (!emailResult.success) {
    console.error("Email delivery failed:", emailResult.error);
    return { success: true, emailFailed: true };
  }

  return { success: true };
}
