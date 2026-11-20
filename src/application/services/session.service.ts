import { randomUUID } from "node:crypto";
import type { SessionDto } from "@/application/dtos/auth.dto.js";
import type { TokenServicePort } from "@/application/ports/token-service.port.js";
import { RefreshToken } from "@/domain/entities/refresh-token.entity.js";
import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";
import { generateRefreshToken, hashRefreshToken } from "@/shared/security/refresh-token.js";

export interface SessionConfig {
  accessTokenTtlSeconds: number;
  refreshTokenTtlDays: number;
}

/** Issues an access token plus a stored refresh token. */
export class SessionService {
  constructor(
    private readonly tokenService: TokenServicePort,
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly config: SessionConfig
  ) {}

  /** Pass `familyId` when rotating so the new token stays in the same family. */
  async issue(userId: string, familyId: string = randomUUID()): Promise<SessionDto> {
    const now = new Date();
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(now.getTime() + this.config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepository.create(
      new RefreshToken(randomUUID(), userId, familyId, hashRefreshToken(refreshToken), expiresAt, null, now)
    );

    return {
      accessToken: this.tokenService.sign({ sub: userId }),
      expiresIn: this.config.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }
}
