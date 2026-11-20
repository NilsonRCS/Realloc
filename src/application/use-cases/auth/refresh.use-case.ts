import type { SessionDto } from "@/application/dtos/auth.dto.js";
import { assertAccountActive } from "@/application/services/account-status.js";
import type { SessionService } from "@/application/services/session.service.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { AppError } from "@/shared/errors/app-error.js";
import { hashRefreshToken } from "@/shared/security/refresh-token.js";

export interface IRefreshUseCase {
  execute(refreshToken: string): Promise<SessionDto>;
}

/**
 * Rotates the refresh token: the presented one is consumed and a new one issued in the same family.
 * Presenting an already-used token means it leaked (or a client raced itself), so the whole
 * family is revoked and the user has to log in again.
 */
export class RefreshUseCase implements IRefreshUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly sessionService: SessionService
  ) {}

  async execute(refreshToken: string): Promise<SessionDto> {
    const now = new Date();
    const stored = await this.refreshTokenRepository.findByHash(hashRefreshToken(refreshToken));

    if (!stored) {
      throw new AppError("Unauthorized", 401);
    }

    if (stored.revokedAt) {
      await this.refreshTokenRepository.revokeFamily(stored.familyId, now);
      throw new AppError("Unauthorized", 401);
    }

    if (stored.expiresAt <= now) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }
    await assertAccountActive(user, this.recruiterRepository);

    if (!(await this.refreshTokenRepository.revokeIfActive(stored.id, now))) {
      // Lost a race with another use of the same token.
      await this.refreshTokenRepository.revokeFamily(stored.familyId, now);
      throw new AppError("Unauthorized", 401);
    }

    return this.sessionService.issue(user.id, stored.familyId);
  }
}
