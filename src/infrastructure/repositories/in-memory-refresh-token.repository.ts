import { RefreshToken } from "../../domain/entities/refresh-token.entity.js";
import type { RefreshTokenRepositoryPort } from "../../domain/ports/refresh-token-repository.port.js";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryPort {
  private tokens: RefreshToken[] = [];

  async create(token: RefreshToken): Promise<RefreshToken> {
    this.tokens.push(token);
    return token;
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
  }

  async revokeIfActive(id: string, now: Date): Promise<boolean> {
    const current = this.tokens.find((t) => t.id === id);
    if (!current || current.revokedAt) return false;
    this.replace(current, now);
    return true;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    this.tokens.filter((t) => t.familyId === familyId && !t.revokedAt).forEach((t) => this.replace(t, now));
  }

  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    this.tokens.filter((t) => t.userId === userId && !t.revokedAt).forEach((t) => this.replace(t, now));
  }

  private replace(token: RefreshToken, revokedAt: Date): void {
    const revoked = new RefreshToken(
      token.id,
      token.userId,
      token.familyId,
      token.tokenHash,
      token.expiresAt,
      revokedAt,
      token.createdAt
    );
    this.tokens = this.tokens.map((t) => (t.id === token.id ? revoked : t));
  }
}
