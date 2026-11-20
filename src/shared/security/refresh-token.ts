import { createHash, randomBytes } from "node:crypto";

/** Opaque, high-entropy token. Only its hash is persisted. */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
