import { capturePayPalOrder } from "@/lib/paypal";
import { readJsonBody, INVALID_BODY } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return Response.json(INVALID_BODY, { status: 400 });

  const result = await capturePayPalOrder(body.orderId);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
