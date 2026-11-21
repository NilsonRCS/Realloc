import { toAvailableRecruiter, type AvailableRecruiterDto } from "@/application/dtos/recruiter.dto.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";

export interface IListAvailableRecruitersUseCase {
  execute(input: { page: number; limit: number }): Promise<{ recruiters: AvailableRecruiterDto[]; total: number; page: number; limit: number }>;
}

/** Active recruiters, with public data only: feeds the "who is your recruiter?" field of the form. */
export class ListAvailableRecruitersUseCase implements IListAvailableRecruitersUseCase {
  constructor(private readonly recruiterRepository: RecruiterRepositoryPort) {}

  async execute({ page, limit }: { page: number; limit: number }) {
    const result = await this.recruiterRepository.findAll(page, limit, { active: true });
    return { recruiters: result.recruiters.map(toAvailableRecruiter), total: result.total, page, limit };
  }
}
