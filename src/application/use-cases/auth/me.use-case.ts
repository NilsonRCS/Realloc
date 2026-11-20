import type { UserResponseDto } from "@/application/dtos/user.dto.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { AppError } from "@/shared/errors/app-error.js";

export interface IGetCurrentUserUseCase {
  execute(id: string): Promise<UserResponseDto>;
}

export class GetCurrentUserUseCase implements IGetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    return {
      id: user.id,
      name: user.name.value,
      email: user.email.value,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
