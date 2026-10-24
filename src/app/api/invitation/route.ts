import { submitInvitation } from "@/lib/invitations";
import { readJsonBody, clientIp, INVALID_BODY } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return Response.json(INVALID_BODY, { status: 400 });

  const { status, ...result } = await submitInvitation(body.formData, body.turnstileToken, clientIp(request));
  return Response.json(result, { status });
}
