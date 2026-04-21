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
  try {
    await adminDb.collection("invitations").add({
      ...validatedData,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    return { success: false, error: "Errore di sistema, riprova più tardi" };
  }

  // 4. Send notification email (failure is non-fatal — record is already saved)
  const emailResult = await sendInvitationEmail(validatedData);
  if (!emailResult.success) {
    console.error("Email delivery failed:", emailResult.error);
    return { success: true, emailFailed: true };
  }

  return { success: true };
}

export async function createPayPalOrder(
  amount: string
): Promise<{ orderId?: string; error?: string }> {
  try {
    const configSnap = await adminDb.collection("adminConfig").doc("paypal").get();
    if (!configSnap.exists) return { error: "PayPal non configurato" };
    const { clientId, secretKey } = configSnap.data() as { clientId: string; secretKey: string };

    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secretKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const orderRes = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "EUR", value: parseFloat(amount).toFixed(2) } }],
      }),
    });
    const order = (await orderRes.json()) as { id: string };
    return { orderId: order.id };
  } catch {
    return { error: "Errore nella creazione dell'ordine PayPal" };
  }
}

export async function capturePayPalOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const configSnap = await adminDb.collection("adminConfig").doc("paypal").get();
    if (!configSnap.exists) return { success: false, error: "PayPal non configurato" };
    const { clientId, secretKey } = configSnap.data() as { clientId: string; secretKey: string };

    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secretKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const captureRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result = (await captureRes.json()) as { status: string };
    return { success: result.status === "COMPLETED" };
  } catch {
    return { success: false, error: "Errore nella cattura del pagamento" };
  }
}
