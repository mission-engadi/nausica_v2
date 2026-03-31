import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "../turnstile";

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("returns true when Cloudflare responds with success: true", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);

    const result = await verifyTurnstileToken("valid-token");

    expect(result).toBe(true);
  });

  it("returns false when Cloudflare responds with success: false", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    } as Response);

    const result = await verifyTurnstileToken("bad-token");

    expect(result).toBe(false);
  });

  it("calls the Cloudflare siteverify endpoint with the correct body", async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);

    await verifyTurnstileToken("my-token");

    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: "test-secret-key",
          response: "my-token",
        }),
      }
    );
  });

  it("returns false if fetch throws (network error)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    const result = await verifyTurnstileToken("some-token");

    expect(result).toBe(false);
  });
});
