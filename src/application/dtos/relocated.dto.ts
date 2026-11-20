import type { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { Role, RelocationStatus, Seniority } from "@/domain/enums.js";

/** The authenticated caller, as seen by the use cases. */
export interface Actor {
  userId: string;
  role: Role;
}

export interface RelocatedResponseDto {
  id: string;
  userId: string | null;
  responsibleRecruiterId: string;
  name: string;
  seniority: Seniority;
  description: string | null;
  /** YYYY-MM-DD */
  relocationStartDate: string;
  /** YYYY-MM-DD */
  relocationEndDate: string | null;
  status: RelocationStatus;
  createdAt: Date;
}

export interface CreateRelocatedInputDto {
  name: string;
  seniority: Seniority;
  description?: string;
  /** YYYY-MM-DD */
  relocationStartDate: string;
  /** Required for ADMIN; ignored for RECRUITER (who is always the responsible one). */
  responsibleRecruiterId?: string;
  /** Optional login. Both must be sent together. */
  email?: string;
  password?: string;
}

export interface UpdateRelocatedInputDto {
  name?: string;
  seniority?: Seniority;
  description?: string | null;
  relocationEndDate?: string | null;
  status?: RelocationStatus;
  /** ADMIN only. */
  responsibleRecruiterId?: string;
}

export interface ListRelocatedInputDto {
  page: number;
  limit: number;
  status?: RelocationStatus;
}

export interface ListRelocatedOutputDto {
  relocateds: RelocatedResponseDto[];
  total: number;
  page: number;
  limit: number;
}

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

export function toRelocatedResponse(profile: RelocatedProfile): RelocatedResponseDto {
  return {
    id: profile.id,
    userId: profile.userId,
    responsibleRecruiterId: profile.responsibleRecruiterId,
    name: profile.name.value,
    seniority: profile.seniority,
    description: profile.description,
    relocationStartDate: toDateOnly(profile.relocationStartDate),
    relocationEndDate: profile.relocationEndDate ? toDateOnly(profile.relocationEndDate) : null,
    status: profile.status,
    createdAt: profile.createdAt,
  };
}
