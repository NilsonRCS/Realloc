import { toRecruiterResponse, type RecruiterResponseDto } from "@/application/dtos/recruiter.dto.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import { NotFoundError } from "@/shared/errors/app-error.js";

export interface IGetRecruiterUseCase {
  execute(id: string): Promise<RecruiterResponseDto>;
}

export class GetRecruiterUseCase implements IGetRecruiterUseCase {
  constructor(private readonly recruiterRepository: RecruiterRepositoryPort) {}

  async execute(id: string): Promise<RecruiterResponseDto> {
    const recruiter = await this.recruiterRepository.findById(id);
    if (!recruiter) {
      throw new NotFoundError("Recruiter");
    }
    return toRecruiterResponse(recruiter);
  }
}
