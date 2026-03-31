import { describe, it, expect } from "vitest";
import { InvitationSchema } from "../invitation-schema";

const valid = {
  name: "Mario Rossi",
  email: "mario@esempio.it",
  church: "Chiesa Esempio",
  startDate: "2026-05-01",
  endDate: "2026-05-03",
  location: "Roma",
};

describe("InvitationSchema", () => {
  it("accepts a valid invitation payload", () => {
    expect(() => InvitationSchema.parse(valid)).not.toThrow();
  });

  it("rejects name shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects name longer than 100 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, name: "A".repeat(101) })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, email: "not-an-email" })
    ).toThrow();
  });

  it("rejects email longer than 254 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, email: "a".repeat(250) + "@b.it" })
    ).toThrow();
  });

  it("rejects church shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, church: "X" })).toThrow();
  });

  it("rejects church longer than 200 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, church: "A".repeat(201) })
    ).toThrow();
  });

  it("rejects startDate not in YYYY-MM-DD format", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, startDate: "01/05/2026" })
    ).toThrow();
  });

  it("rejects endDate not in YYYY-MM-DD format", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, endDate: "2026/05/03" })
    ).toThrow();
  });

  it("rejects location shorter than 2 chars", () => {
    expect(() => InvitationSchema.parse({ ...valid, location: "X" })).toThrow();
  });

  it("rejects location longer than 200 chars", () => {
    expect(() =>
      InvitationSchema.parse({ ...valid, location: "A".repeat(201) })
    ).toThrow();
  });
});
