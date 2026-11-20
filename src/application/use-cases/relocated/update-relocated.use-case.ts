import { toRelocatedResponse, type Actor, type RelocatedResponseDto, type UpdateRelocatedInputDto } from "@/application/dtos/relocated.dto.js";
import { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";
import { AppError, ForbiddenError, NotFoundError } from "@/shared/errors/app-error.js";
import { canAccessRelocated } from "./get-relocated.use-case.js";

export interface IUpdateRelocatedUseCase {
  execute(actor: Actor, id: string, input: UpdateRelocatedInputDto): Promise<RelocatedResponseDto>;
}

export class UpdateRelocatedUseCase implements IUpdateRelocatedUseCase {
  constructor(
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly relocatedRepository: RelocatedRepositoryPort
  ) {}

  async execute(actor: Actor, id: string, input: UpdateRelocatedInputDto): Promise<RelocatedResponseDto> {
    if (actor.role === "RELOCATED") {
      throw new ForbiddenError();
    }

    const existing = await this.relocatedRepository.findById(id);
    if (!existing || !(await canAccessRelocated(actor, existing, this.recruiterRepository))) {
      throw new NotFoundError("Relocated");
    }

    let responsibleRecruiterId = existing.responsibleRecruiterId;
    if (input.responsibleRecruiterId && input.responsibleRecruiterId !== responsibleRecruiterId) {
      if (actor.role !== "ADMIN") {
        throw new ForbiddenError("Only an admin can change the responsible recruiter");
      }
      const next = await this.recruiterRepository.findById(input.responsibleRecruiterId);
      if (!next) throw new NotFoundError("Recruiter");
      if (!next.profile.active) throw new AppError("Responsible recruiter is inactive", 422);
      responsibleRecruiterId = next.profile.id;
    }

    const relocationEndDate =
      input.relocationEndDate === undefined
        ? existing.relocationEndDate
        : input.relocationEndDate === null
          ? null
          : new Date(`${input.relocationEndDate}T00:00:00.000Z`);

    if (relocationEndDate && relocationEndDate < existing.relocationStartDate) {
      throw new AppError("relocationEndDate cannot be before relocationStartDate", 422);
    }

    const updated = new RelocatedProfile(
      existing.id,
      existing.userId,
      responsibleRecruiterId,
      input.name ? UserName.create(input.name) : existing.name,
      input.seniority ?? existing.seniority,
      input.description !== undefined ? input.description : existing.description,
      existing.relocationStartDate,
      relocationEndDate,
      input.status ?? existing.status,
      existing.createdAt
    );

    return toRelocatedResponse(await this.relocatedRepository.update(updated));
  }
}
