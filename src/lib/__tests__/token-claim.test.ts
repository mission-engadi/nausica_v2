import { describe, it, expect, vi } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { claimTurnstileToken } from "../token-claim";

// Minimal in-memory stand-in for Firestore's create() semantics.
function fakeDb(failWith?: { code?: number }) {
  const docs = new Map<string, unknown>();
  const create = vi.fn(async (id: string, data: unknown) => {
    if (failWith) throw failWith;
    if (docs.has(id)) throw Object.assign(new Error("ALREADY_EXISTS"), { code: 6 });
    docs.set(id, data);
  });
  const db = {
    collection: () => ({ doc: (id: string) => ({ create: (data: unknown) => create(id, data) }) }),
  } as unknown as Firestore;
  return { db, docs, create };
}

describe("claimTurnstileToken", () => {
  it("accepts the first use of a token", async () => {
    const { db } = fakeDb();

    expect(await claimTurnstileToken(db, "token-a")).toBe(true);
  });

  it("rejects a replay of the same token", async () => {
    const { db } = fakeDb();

    await claimTurnstileToken(db, "token-a");
    expect(await claimTurnstileToken(db, "token-a")).toBe(false);
  });

  it("allows different tokens independently", async () => {
    const { db } = fakeDb();

    expect(await claimTurnstileToken(db, "token-a")).toBe(true);
    expect(await claimTurnstileToken(db, "token-b")).toBe(true);
  });

  it("stores a SHA-256 hash, never the raw token", async () => {
    const { db, docs } = fakeDb();

    await claimTurnstileToken(db, "secret-token-value");
    const [id] = [...docs.keys()];
    expect(id).toMatch(/^[0-9a-f]{64}$/);
    expect(id).not.toContain("secret-token-value");
  });

  it("fails closed when Firestore errors", async () => {
    const { db } = fakeDb({ code: 14 });
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await claimTurnstileToken(db, "token-a")).toBe(false);
  });
});
