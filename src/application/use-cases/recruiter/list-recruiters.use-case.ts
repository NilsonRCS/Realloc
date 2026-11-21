import { toRecruiterResponse, type ListRecruitersOutputDto } from "@/application/dtos/recruiter.dto.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";

export interface IListRecruitersUseCase {
  execute(input: { page: number; limit: number; active?: boolean }): Promise<ListRecruitersOutputDto>;
}

export class ListRecruitersUseCase implements IListRecruitersUseCase {
  constructor(private readonly recruiterRepository: RecruiterRepositoryPort) {}

  async execute({ page, limit, active }: { page: number; limit: number; active?: boolean }): Promise<ListRecruitersOutputDto> {
    const result = await this.recruiterRepository.findAll(page, limit, { active });
    return { recruiters: result.recruiters.map(toRecruiterResponse), total: result.total, page, limit };
  }
}
