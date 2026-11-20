import { randomUUID } from "node:crypto";
import { toRecruiterResponse, type CreateRecruiterInputDto, type RecruiterResponseDto } from "@/application/dtos/recruiter.dto.js";
import { RecruiterProfile } from "@/domain/entities/recruiter-profile.entity.js";
import { User } from "@/domain/entities/user.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { Email } from "@/domain/value-objects/email.value-object.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";
import { ConflictError } from "@/shared/errors/app-error.js";
import { hashPassword } from "@/shared/security/password.js";

export interface ICreateRecruiterUseCase {
  execute(input: CreateRecruiterInputDto): Promise<RecruiterResponseDto>;
}

export class CreateRecruiterUseCase implements ICreateRecruiterUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly recruiterRepository: RecruiterRepositoryPort
  ) {}

  async execute(input: CreateRecruiterInputDto): Promise<RecruiterResponseDto> {
    const email = Email.create(input.email);
    if (await this.userRepository.findByEmail(email.value)) {
      throw new ConflictError("User already exists");
    }

    const now = new Date();
    const user = new User(randomUUID(), UserName.create(input.name), email, hashPassword(input.password), "RECRUITER", now);
    const profile = new RecruiterProfile(randomUUID(), user.id, input.team ?? null, input.position ?? null, true, now);

    return toRecruiterResponse(await this.recruiterRepository.createWithUser({ user, profile }));
  }
}
