import { toRelocatedResponse, type Actor, type RelocatedResponseDto } from "@/application/dtos/relocated.dto.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { ForbiddenError, NotFoundError } from "@/shared/errors/app-error.js";

export interface IGetMyRelocatedUseCase {
  execute(actor: Actor): Promise<RelocatedResponseDto>;
}

/** 404 means "registered but the form is not answered yet": the front shows the form. */
export class GetMyRelocatedUseCase implements IGetMyRelocatedUseCase {
  constructor(private readonly relocatedRepository: RelocatedRepositoryPort) {}

  async execute(actor: Actor): Promise<RelocatedResponseDto> {
    if (actor.role !== "RELOCATED") {
      throw new ForbiddenError();
    }
    const profile = await this.relocatedRepository.findByUserId(actor.userId);
    if (!profile) {
      throw new NotFoundError("Relocated profile");
    }
    return toRelocatedResponse(profile);
  }
}
