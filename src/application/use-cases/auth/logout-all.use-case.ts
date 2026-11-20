import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";

export interface ILogoutAllUseCase {
  execute(userId: string): Promise<void>;
}

/** Ends every session of the user (all devices). */
export class LogoutAllUseCase implements ILogoutAllUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryPort) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId, new Date());
  }
}
