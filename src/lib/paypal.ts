import { adminDb, FieldValue } from "./firebase-admin";

const PAYPAL_API = "https://api-m.paypal.com";
const ORDER_ID_REGEX = /^[A-Z0-9]{10,30}$/;
const MIN_DONATION = 1;
const MAX_DONATION = 10_000;

async function getPayPalAccessToken(): Promise<string | null> {
  const configSnap = await adminDb.collection("adminConfig").doc("paypal").get();
  if (!configSnap.exists) return null;
  const { clientId, secretKey } = configSnap.data() as { clientId?: string; secretKey?: string };
  if (!clientId || !secretKey) return null;

  const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secretKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenRes.ok) {
    console.error("PayPal token request failed:", tokenRes.status);
    return null;
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  return access_token ?? null;
}

export async function createPayPalOrder(
  amount: unknown
): Promise<{ orderId?: string; error?: string }> {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < MIN_DONATION || value > MAX_DONATION) {
    return { error: `Importo non valido (min €${MIN_DONATION}, max €${MAX_DONATION})` };
  }

  try {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) return { error: "PayPal non configurato" };

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "EUR", value: value.toFixed(2) } }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!orderRes.ok) {
      console.error("PayPal order creation failed:", orderRes.status);
      return { error: "Errore nella creazione dell'ordine PayPal" };
    }
    const order = (await orderRes.json()) as { id?: string };
    if (!order.id) return { error: "Errore nella creazione dell'ordine PayPal" };
    return { orderId: order.id };
  } catch {
    return { error: "Errore nella creazione dell'ordine PayPal" };
  }
}

export async function capturePayPalOrder(
  orderId: unknown
): Promise<{ success: boolean; error?: string }> {
  if (typeof orderId !== "string" || !ORDER_ID_REGEX.test(orderId)) {
    return { success: false, error: "Ordine non valido" };
  }

  try {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) return { success: false, error: "PayPal non configurato" };

    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!captureRes.ok) {
      console.error("PayPal capture failed:", captureRes.status);
      return { success: false, error: "Errore nella cattura del pagamento" };
    }

    const result = (await captureRes.json()) as {
      status?: string;
      purchase_units?: {
        payments?: { captures?: { id?: string; amount?: { value?: string; currency_code?: string } }[] };
      }[];
    };
    if (result.status !== "COMPLETED") return { success: false };

    // Keep a server-side record of every completed donation (not readable by clients).
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    try {
      await adminDb.collection("donations").doc(orderId).set({
        orderId,
        captureId: capture?.id ?? null,
        amount: capture?.amount?.value ?? null,
        currency: capture?.amount?.currency_code ?? null,
        status: result.status,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to record donation:", orderId, err);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Errore nella cattura del pagamento" };
  }
}
