import type { RefreshToken } from "../entities/refresh-token.entity.js";

export interface RefreshTokenRepositoryPort {
  create(token: RefreshToken): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  /**
   * Atomically revokes the token only if it is still active.
   * Returns false when someone else got there first (concurrent use of the same token).
   */
  revokeIfActive(id: string, now: Date): Promise<boolean>;
  revokeFamily(familyId: string, now: Date): Promise<void>;
  revokeAllForUser(userId: string, now: Date): Promise<void>;
}
