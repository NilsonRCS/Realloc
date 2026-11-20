import { toRecruiterResponse, type RecruiterResponseDto, type UpdateRecruiterInputDto } from "@/application/dtos/recruiter.dto.js";
import { RecruiterProfile } from "@/domain/entities/recruiter-profile.entity.js";
import { User } from "@/domain/entities/user.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";
import { NotFoundError } from "@/shared/errors/app-error.js";

export interface IUpdateRecruiterUseCase {
  execute(id: string, input: UpdateRecruiterInputDto): Promise<RecruiterResponseDto>;
}

/** Recruiters are deactivated (`active: false`), never deleted: relocated people reference them. */
export class UpdateRecruiterUseCase implements IUpdateRecruiterUseCase {
  constructor(private readonly recruiterRepository: RecruiterRepositoryPort) {}

  async execute(id: string, input: UpdateRecruiterInputDto): Promise<RecruiterResponseDto> {
    const existing = await this.recruiterRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Recruiter");
    }

    const { user, profile } = existing;
    const updated = await this.recruiterRepository.update({
      user: new User(
        user.id,
        input.name ? UserName.create(input.name) : user.name,
        user.email,
        user.passwordHash,
        user.role,
        user.createdAt
      ),
      profile: new RecruiterProfile(
        profile.id,
        profile.userId,
        input.team !== undefined ? input.team : profile.team,
        input.position !== undefined ? input.position : profile.position,
        input.active ?? profile.active,
        profile.createdAt
      ),
    });

    return toRecruiterResponse(updated);
  }
}
