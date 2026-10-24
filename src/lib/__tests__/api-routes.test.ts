import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/invitations", () => ({ submitInvitation: vi.fn() }));
vi.mock("@/lib/paypal-config", () => ({ getPayPalConfigStatus: vi.fn(), savePayPalConfig: vi.fn() }));

import { submitInvitation } from "@/lib/invitations";
import { getPayPalConfigStatus, savePayPalConfig } from "@/lib/paypal-config";
import { POST as invitationPOST } from "@/app/api/invitation/route";
import { GET as configGET, POST as configPOST } from "@/app/api/admin/paypal-config/route";

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/invitation", () => {
  beforeEach(() => vi.mocked(submitInvitation).mockReset());

  it("passes form data, token and the first forwarded IP to submitInvitation", async () => {
    vi.mocked(submitInvitation).mockResolvedValue({ success: true, status: 200 });

    const res = await invitationPOST(
      jsonRequest("http://x/api/invitation", { formData: { name: "A" }, turnstileToken: "tok" }, {
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      })
    );

    expect(submitInvitation).toHaveBeenCalledWith({ name: "A" }, "tok", "203.0.113.7");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns the status chosen by submitInvitation (e.g. 403 for Turnstile)", async () => {
    vi.mocked(submitInvitation).mockResolvedValue({ success: false, error: "bot", status: 403 });

    const res = await invitationPOST(jsonRequest("http://x/api/invitation", { formData: {}, turnstileToken: "" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ success: false, error: "bot" });
  });

  it("rejects a non-JSON body without calling submitInvitation", async () => {
    const res = await invitationPOST(jsonRequest("http://x/api/invitation", "not json"));

    expect(res.status).toBe(400);
    expect(submitInvitation).not.toHaveBeenCalled();
  });
});

describe("/api/admin/paypal-config", () => {
  beforeEach(() => {
    vi.mocked(getPayPalConfigStatus).mockReset();
    vi.mocked(savePayPalConfig).mockReset();
  });

  it("forwards the bearer ID token on GET and returns 403 when unauthorised", async () => {
    vi.mocked(getPayPalConfigStatus).mockResolvedValue({ hasSecret: false, error: "Non autorizzato" });

    const res = await configGET(
      new Request("http://x/api/admin/paypal-config", { headers: { Authorization: "Bearer id-tok" } })
    );

    expect(getPayPalConfigStatus).toHaveBeenCalledWith("id-tok");
    expect(res.status).toBe(403);
  });

  it("never returns the secret, only whether one exists", async () => {
    vi.mocked(getPayPalConfigStatus).mockResolvedValue({ hasSecret: true });

    const res = await configGET(new Request("http://x/api/admin/paypal-config", { headers: { Authorization: "Bearer t" } }));

    expect(await res.json()).toEqual({ hasSecret: true });
  });

  it("saves client ID and secret with the caller's token on POST", async () => {
    vi.mocked(savePayPalConfig).mockResolvedValue({ success: true });

    const res = await configPOST(
      jsonRequest("http://x/api/admin/paypal-config", { clientId: "cid", secretKey: "sk" }, { Authorization: "Bearer t" })
    );

    expect(savePayPalConfig).toHaveBeenCalledWith("t", "cid", "sk");
    expect(res.status).toBe(200);
  });
});
