const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean)
  );
}

// Fails closed: any network error, non-2xx, wrong action or unexpected hostname is rejected.
export async function verifyTurnstileToken(
  token: string,
  expectedAction: string,
  remoteIp?: string
): Promise<boolean> {
  const hostnames = expectedHostnames();
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || hostnames.size === 0) {
    return false;
  }

  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY ?? "",
      response: token,
    });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean; action?: string; hostname?: string };
    return (
      data.success === true &&
      data.action === expectedAction &&
      typeof data.hostname === "string" &&
      hostnames.has(data.hostname)
    );
  } catch {
    return false;
  }
}
