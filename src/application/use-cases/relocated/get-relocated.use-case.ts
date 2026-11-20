import { toRelocatedResponse, type Actor, type RelocatedResponseDto } from "@/application/dtos/relocated.dto.js";
import type { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { NotFoundError } from "@/shared/errors/app-error.js";

export interface IGetRelocatedUseCase {
  execute(actor: Actor, id: string): Promise<RelocatedResponseDto>;
}

/** Who may see a relocated profile: ADMIN, its responsible recruiter, or the person themself. */
export async function canAccessRelocated(
  actor: Actor,
  profile: RelocatedProfile,
  recruiterRepository: RecruiterRepositoryPort
): Promise<boolean> {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "RELOCATED") return profile.userId === actor.userId;
  const recruiter = await recruiterRepository.findByUserId(actor.userId);
  return recruiter?.profile.id === profile.responsibleRecruiterId;
}

export class GetRelocatedUseCase implements IGetRelocatedUseCase {
  constructor(
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly relocatedRepository: RelocatedRepositoryPort
  ) {}

  async execute(actor: Actor, id: string): Promise<RelocatedResponseDto> {
    const profile = await this.relocatedRepository.findById(id);
    // 404 (not 403) when the caller has no access, so ids cannot be probed.
    if (!profile || !(await canAccessRelocated(actor, profile, this.recruiterRepository))) {
      throw new NotFoundError("Relocated");
    }
    return toRelocatedResponse(profile);
  }
}
