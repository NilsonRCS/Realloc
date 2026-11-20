import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";
import { hashRefreshToken } from "@/shared/security/refresh-token.js";

export interface ILogoutUseCase {
  /** Ends this session (the whole token family). Idempotent: unknown tokens are ignored. */
  execute(refreshToken: string | undefined): Promise<void>;
}

export class LogoutUseCase implements ILogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryPort) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    const stored = await this.refreshTokenRepository.findByHash(hashRefreshToken(refreshToken));
    if (stored) {
      await this.refreshTokenRepository.revokeFamily(stored.familyId, new Date());
    }
  }
}
