import type { RelocatedProfile } from "../../domain/entities/relocated-profile.entity.js";
import type { User } from "../../domain/entities/user.entity.js";
import type { RelocatedFilters, RelocatedRepositoryPort } from "../../domain/ports/relocated-repository.port.js";
import type { InMemoryUserRepository } from "./in-memory-user.repository.js";

export class InMemoryRelocatedRepository implements RelocatedRepositoryPort {
  private relocateds: RelocatedProfile[] = [];

  constructor(private readonly userRepository: InMemoryUserRepository) {}

  async create(profile: RelocatedProfile, user?: User): Promise<RelocatedProfile> {
    if (user) {
      await this.userRepository.create(user);
    }
    this.relocateds.push(profile);
    return profile;
  }

  async findById(id: string): Promise<RelocatedProfile | null> {
    return this.relocateds.find((r) => r.id === id) ?? null;
  }

  async findByUserId(userId: string): Promise<RelocatedProfile | null> {
    return this.relocateds.find((r) => r.userId === userId) ?? null;
  }

  async findAll(
    page: number,
    limit: number,
    filters: RelocatedFilters
  ): Promise<{ relocateds: RelocatedProfile[]; total: number }> {
    const filtered = this.relocateds.filter(
      (r) =>
        (!filters.responsibleRecruiterId || r.responsibleRecruiterId === filters.responsibleRecruiterId) &&
        (!filters.status || r.status === filters.status)
    );
    const start = (page - 1) * limit;
    return { relocateds: filtered.slice(start, start + limit), total: filtered.length };
  }

  async update(profile: RelocatedProfile): Promise<RelocatedProfile> {
    this.relocateds = this.relocateds.map((r) => (r.id === profile.id ? profile : r));
    return profile;
  }
}
