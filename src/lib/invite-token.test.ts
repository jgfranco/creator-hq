import { describe, expect, it } from "vitest";
import { hashInviteToken, inviteLink, newInviteToken } from "./invite-token";

describe("invite tokens", () => {
  it("creates a random URL-safe token and stores only its hash", () => {
    const a = newInviteToken();
    const b = newInviteToken();
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashInviteToken(a.token));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).not.toContain(a.token);
  });

  it("builds the link from the app URL", () => {
    expect(inviteLink("abc")).toMatch(/\/invite\/abc$/);
  });
});
