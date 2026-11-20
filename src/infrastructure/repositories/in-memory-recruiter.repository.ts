import type { RecruiterRepositoryPort, RecruiterWithUser } from "../../domain/ports/recruiter-repository.port.js";
import { User } from "../../domain/entities/user.entity.js";
import type { InMemoryUserRepository } from "./in-memory-user.repository.js";

export class InMemoryRecruiterRepository implements RecruiterRepositoryPort {
  private recruiters: RecruiterWithUser[] = [];

  constructor(private readonly userRepository: InMemoryUserRepository) {}

  async createWithUser(data: RecruiterWithUser): Promise<RecruiterWithUser> {
    await this.userRepository.create(data.user);
    this.recruiters.push(data);
    return data;
  }

  async findById(profileId: string): Promise<RecruiterWithUser | null> {
    return this.recruiters.find((r) => r.profile.id === profileId) ?? null;
  }

  async findByUserId(userId: string): Promise<RecruiterWithUser | null> {
    return this.recruiters.find((r) => r.profile.userId === userId) ?? null;
  }

  async findAll(page: number, limit: number): Promise<{ recruiters: RecruiterWithUser[]; total: number }> {
    const start = (page - 1) * limit;
    return { recruiters: this.recruiters.slice(start, start + limit), total: this.recruiters.length };
  }

  async update(data: RecruiterWithUser): Promise<RecruiterWithUser> {
    const user = new User(
      data.user.id,
      data.user.name,
      data.user.email,
      data.user.passwordHash,
      data.user.role,
      data.user.createdAt
    );
    await this.userRepository.update(user);
    this.recruiters = this.recruiters.map((r) => (r.profile.id === data.profile.id ? { ...data, user } : r));
    return data;
  }
}
