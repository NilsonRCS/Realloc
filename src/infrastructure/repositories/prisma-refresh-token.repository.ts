import type { PrismaClient, RefreshToken as PrismaRefreshToken } from "@prisma/client";
import { RefreshToken } from "@/domain/entities/refresh-token.entity.js";
import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";

const toDomain = (row: PrismaRefreshToken) =>
  new RefreshToken(row.id, row.userId, row.familyId, row.tokenHash, row.expiresAt, row.revokedAt, row.createdAt);

export class PrismaRefreshTokenRepository implements RefreshTokenRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: RefreshToken): Promise<RefreshToken> {
    const row = await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        familyId: token.familyId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });
    return toDomain(row);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async revokeIfActive(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now },
    });
    return count === 1;
  }

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { familyId, revokedAt: null }, data: { revokedAt: now } });
  }

  async revokeAllForUser(userId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
  }
}
