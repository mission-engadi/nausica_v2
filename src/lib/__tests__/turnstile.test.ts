import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "../turnstile";

function siteverifyResponse(body: object, ok = true) {
  return { ok, json: async () => body } as Response;
}

const VALID = { success: true, action: "invitation", hostname: "nausicadellavalle.org" };

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
    process.env.TURNSTILE_HOSTNAMES = "nausicadellavalle.org, localhost";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_HOSTNAMES;
  });

  it("returns true for success with expected action and hostname", async () => {
    vi.mocked(fetch).mockResolvedValue(siteverifyResponse(VALID));

    expect(await verifyTurnstileToken("valid-token", "invitation")).toBe(true);
  });

  it("returns false when Cloudflare responds with success: false", async () => {
    vi.mocked(fetch).mockResolvedValue(
      siteverifyResponse({ success: false, "error-codes": ["invalid-input-response"] })
    );

    expect(await verifyTurnstileToken("bad-token", "invitation")).toBe(false);
  });

  it("returns false when the action does not match", async () => {
    vi.mocked(fetch).mockResolvedValue(siteverifyResponse({ ...VALID, action: "login" }));

    expect(await verifyTurnstileToken("token", "invitation")).toBe(false);
  });

  it("returns false when the hostname is not allowed", async () => {
    vi.mocked(fetch).mockResolvedValue(siteverifyResponse({ ...VALID, hostname: "evil.example" }));

    expect(await verifyTurnstileToken("token", "invitation")).toBe(false);
  });

  it("fails closed when no hostnames are configured", async () => {
    delete process.env.TURNSTILE_HOSTNAMES;

    expect(await verifyTurnstileToken("token", "invitation")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects empty or oversized tokens without calling Cloudflare", async () => {
    expect(await verifyTurnstileToken("", "invitation")).toBe(false);
    expect(await verifyTurnstileToken("x".repeat(2049), "invitation")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns false on a non-2xx siteverify response", async () => {
    vi.mocked(fetch).mockResolvedValue(siteverifyResponse(VALID, false));

    expect(await verifyTurnstileToken("token", "invitation")).toBe(false);
  });

  it("posts form-encoded secret, token and remote IP to siteverify", async () => {
    vi.mocked(fetch).mockResolvedValue(siteverifyResponse(VALID));

    await verifyTurnstileToken("my-token", "invitation", "203.0.113.7");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = init?.body as URLSearchParams;
    expect(body.get("secret")).toBe("test-secret-key");
    expect(body.get("response")).toBe("my-token");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("returns false if fetch throws (network error)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    expect(await verifyTurnstileToken("some-token", "invitation")).toBe(false);
  });
});
