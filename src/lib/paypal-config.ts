import { adminDb, isAdminToken } from "./firebase-admin";

// The PayPal secret is only ever handled server-side: the admin panel can see
// whether one is stored, and replace it, but never read it back.

export async function getPayPalConfigStatus(
  idToken: string
): Promise<{ hasSecret: boolean; error?: string }> {
  if (!(await isAdminToken(idToken))) return { hasSecret: false, error: "Non autorizzato" };
  const snap = await adminDb.collection("adminConfig").doc("paypal").get();
  return { hasSecret: Boolean(snap.exists && snap.data()?.secretKey) };
}

export async function savePayPalConfig(
  idToken: string,
  clientId: unknown,
  secretKey?: unknown
): Promise<{ success: boolean; error?: string }> {
  if (!(await isAdminToken(idToken))) return { success: false, error: "Non autorizzato" };
  if (typeof clientId !== "string") return { success: false, error: "Client ID non valido" };

  // Client ID is always kept in sync with the public donation config; the secret only when replaced.
  const update: { clientId: string; secretKey?: string } = { clientId: clientId.trim() };
  if (typeof secretKey === "string" && secretKey.trim()) update.secretKey = secretKey.trim();

  try {
    await adminDb.collection("adminConfig").doc("paypal").set(update, { merge: true });
    return { success: true };
  } catch {
    return { success: false, error: "Errore nel salvataggio della configurazione PayPal" };
  }
}
