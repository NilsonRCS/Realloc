import { randomUUID } from "node:crypto";
import { toRelocatedResponse, type Actor, type RelocatedResponseDto, type SubmitRelocatedFormInputDto } from "@/application/dtos/relocated.dto.js";
import { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { AppError, ConflictError, ForbiddenError, NotFoundError } from "@/shared/errors/app-error.js";

export interface ISubmitRelocatedFormUseCase {
  execute(actor: Actor, input: SubmitRelocatedFormInputDto): Promise<RelocatedResponseDto>;
}

/**
 * Only a registered relocated person can answer the form. Answering it creates their profile,
 * linked to their own login; the name comes from the account, never from the request.
 */
export class SubmitRelocatedFormUseCase implements ISubmitRelocatedFormUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly relocatedRepository: RelocatedRepositoryPort
  ) {}

  async execute(actor: Actor, input: SubmitRelocatedFormInputDto): Promise<RelocatedResponseDto> {
    if (actor.role !== "RELOCATED") {
      throw new ForbiddenError();
    }

    const user = await this.userRepository.findById(actor.userId);
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    if (await this.relocatedRepository.findByUserId(user.id)) {
      throw new ConflictError("Form already submitted");
    }

    const recruiter = await this.recruiterRepository.findById(input.responsibleRecruiterId);
    if (!recruiter) {
      throw new NotFoundError("Recruiter");
    }
    if (!recruiter.profile.active) {
      throw new AppError("Responsible recruiter is inactive", 422);
    }

    const profile = new RelocatedProfile(
      randomUUID(),
      user.id,
      recruiter.profile.id,
      user.name,
      input.seniority,
      input.description ?? null,
      new Date(`${input.relocationStartDate}T00:00:00.000Z`),
      null,
      "ACTIVE",
      new Date()
    );

    return toRelocatedResponse(await this.relocatedRepository.create(profile));
  }
}
