import { randomUUID } from "node:crypto";
import { toRelocatedResponse, type Actor, type CreateRelocatedInputDto, type RelocatedResponseDto } from "@/application/dtos/relocated.dto.js";
import { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import { User } from "@/domain/entities/user.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { Email } from "@/domain/value-objects/email.value-object.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/shared/errors/app-error.js";
import { hashPassword } from "@/shared/security/password.js";

export interface ICreateRelocatedUseCase {
  execute(actor: Actor, input: CreateRelocatedInputDto): Promise<RelocatedResponseDto>;
}

export class CreateRelocatedUseCase implements ICreateRelocatedUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly relocatedRepository: RelocatedRepositoryPort
  ) {}

  async execute(actor: Actor, input: CreateRelocatedInputDto): Promise<RelocatedResponseDto> {
    if ((input.email === undefined) !== (input.password === undefined)) {
      throw new AppError("email and password must be sent together", 422);
    }

    const recruiter = await this.resolveResponsibleRecruiter(actor, input.responsibleRecruiterId);
    if (!recruiter.profile.active) {
      throw new AppError("Responsible recruiter is inactive", 422);
    }

    const name = UserName.create(input.name);
    const now = new Date();

    let user: User | undefined;
    if (input.email !== undefined && input.password !== undefined) {
      const email = Email.create(input.email);
      if (await this.userRepository.findByEmail(email.value)) {
        throw new ConflictError("User already exists");
      }
      user = new User(randomUUID(), name, email, hashPassword(input.password), "RELOCATED", now);
    }

    const profile = new RelocatedProfile(
      randomUUID(),
      user?.id ?? null,
      recruiter.profile.id,
      name,
      input.seniority,
      input.description ?? null,
      new Date(`${input.relocationStartDate}T00:00:00.000Z`),
      null,
      "ACTIVE",
      now
    );

    return toRelocatedResponse(await this.relocatedRepository.create(profile, user));
  }

  private async resolveResponsibleRecruiter(actor: Actor, responsibleRecruiterId?: string) {
    if (actor.role === "RECRUITER") {
      const own = await this.recruiterRepository.findByUserId(actor.userId);
      if (!own) {
        throw new ForbiddenError();
      }
      return own;
    }

    if (actor.role !== "ADMIN") {
      throw new ForbiddenError();
    }
    if (!responsibleRecruiterId) {
      throw new AppError("responsibleRecruiterId is required", 422);
    }
    const recruiter = await this.recruiterRepository.findById(responsibleRecruiterId);
    if (!recruiter) {
      throw new NotFoundError("Recruiter");
    }
    return recruiter;
  }
}
