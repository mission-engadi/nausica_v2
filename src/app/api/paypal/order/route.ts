import { createPayPalOrder } from "@/lib/paypal";
import { readJsonBody, INVALID_BODY } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return Response.json(INVALID_BODY, { status: 400 });

  const result = await createPayPalOrder(body.amount);
  return Response.json(result, { status: result.orderId ? 200 : 400 });
}
