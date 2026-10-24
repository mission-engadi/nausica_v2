import { getPayPalConfigStatus, savePayPalConfig } from "@/lib/paypal-config";
import { readJsonBody, bearerToken, INVALID_BODY } from "@/lib/http";

export const dynamic = "force-dynamic";

// Requires "Authorization: Bearer <Firebase ID token>" of a user listed in /admins.

export async function GET(request: Request) {
  const result = await getPayPalConfigStatus(bearerToken(request));
  return Response.json(result, { status: result.error ? 403 : 200 });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return Response.json(INVALID_BODY, { status: 400 });

  const result = await savePayPalConfig(bearerToken(request), body.clientId, body.secretKey);
  const status = result.success ? 200 : result.error === "Non autorizzato" ? 403 : 400;
  return Response.json(result, { status });
}
