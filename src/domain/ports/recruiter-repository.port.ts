import type { RecruiterProfile } from "../entities/recruiter-profile.entity.js";
import type { User } from "../entities/user.entity.js";

export interface RecruiterWithUser {
  user: User;
  profile: RecruiterProfile;
}

export interface RecruiterRepositoryPort {
  /** Creates the login and the profile atomically. */
  createWithUser(data: RecruiterWithUser): Promise<RecruiterWithUser>;
  findById(profileId: string): Promise<RecruiterWithUser | null>;
  findByUserId(userId: string): Promise<RecruiterWithUser | null>;
  findAll(page: number, limit: number): Promise<{ recruiters: RecruiterWithUser[]; total: number }>;
  /** Persists the user name and the profile fields atomically. */
  update(data: RecruiterWithUser): Promise<RecruiterWithUser>;
}
