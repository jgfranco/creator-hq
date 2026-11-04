import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_DAYS = 7;

// The raw token only ever lives in the invite link; the database keeps its hash
export function newInviteToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteLink(token: string) {
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return new URL(`/invite/${token}`, base).toString();
}
