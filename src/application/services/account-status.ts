import type { User } from "@/domain/entities/user.entity.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import { ForbiddenError } from "@/shared/errors/app-error.js";

/** A deactivated recruiter keeps their row (relocated people point to it) but loses access. */
export async function assertAccountActive(user: User, recruiterRepository: RecruiterRepositoryPort): Promise<void> {
  if (user.role !== "RECRUITER") return;

  const recruiter = await recruiterRepository.findByUserId(user.id);
  if (!recruiter?.profile.active) {
    throw new ForbiddenError("Account is inactive");
  }
}
