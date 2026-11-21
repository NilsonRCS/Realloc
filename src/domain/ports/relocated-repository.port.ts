import type { RelocatedProfile } from "../entities/relocated-profile.entity.js";
import type { User } from "../entities/user.entity.js";
import type { RelocationStatus } from "../enums.js";

export interface RelocatedFilters {
  responsibleRecruiterId?: string;
  status?: RelocationStatus;
}

export interface RelocatedRepositoryPort {
  /** When `user` is given, the login and the profile are created atomically. */
  create(profile: RelocatedProfile, user?: User): Promise<RelocatedProfile>;
  findById(id: string): Promise<RelocatedProfile | null>;
  findByUserId(userId: string): Promise<RelocatedProfile | null>;
  findAll(
    page: number,
    limit: number,
    filters: RelocatedFilters
  ): Promise<{ relocateds: RelocatedProfile[]; total: number }>;
  update(profile: RelocatedProfile): Promise<RelocatedProfile>;
}
