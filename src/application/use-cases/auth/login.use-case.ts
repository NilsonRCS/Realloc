import type { LoginInputDto, SessionDto } from "@/application/dtos/auth.dto.js";
import { assertAccountActive } from "@/application/services/account-status.js";
import type { SessionService } from "@/application/services/session.service.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { AppError } from "@/shared/errors/app-error.js";
import { verifyPassword } from "@/shared/security/password.js";

export interface ILoginUseCase {
  execute(input: LoginInputDto): Promise<SessionDto>;
}

export class LoginUseCase implements ILoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly sessionService: SessionService
  ) {}

  async execute(input: LoginInputDto): Promise<SessionDto> {
    const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError("Invalid credentials", 401);
    }

    await assertAccountActive(user, this.recruiterRepository);
    return this.sessionService.issue(user.id);
  }
}
