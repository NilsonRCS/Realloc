import { toRelocatedResponse, type Actor, type ListRelocatedInputDto, type ListRelocatedOutputDto } from "@/application/dtos/relocated.dto.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { ForbiddenError } from "@/shared/errors/app-error.js";

export interface IListRelocatedUseCase {
  execute(actor: Actor, input: ListRelocatedInputDto): Promise<ListRelocatedOutputDto>;
}

export class ListRelocatedUseCase implements IListRelocatedUseCase {
  constructor(
    private readonly recruiterRepository: RecruiterRepositoryPort,
    private readonly relocatedRepository: RelocatedRepositoryPort
  ) {}

  async execute(actor: Actor, { page, limit, status }: ListRelocatedInputDto): Promise<ListRelocatedOutputDto> {
    let responsibleRecruiterId: string | undefined;

    if (actor.role === "RECRUITER") {
      const own = await this.recruiterRepository.findByUserId(actor.userId);
      if (!own) throw new ForbiddenError();
      responsibleRecruiterId = own.profile.id;
    } else if (actor.role !== "ADMIN") {
      throw new ForbiddenError();
    }

    const result = await this.relocatedRepository.findAll(page, limit, { responsibleRecruiterId, status });
    return { relocateds: result.relocateds.map(toRelocatedResponse), total: result.total, page, limit };
  }
}
