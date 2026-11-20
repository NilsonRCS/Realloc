import type { RecruiterProfile as PrismaRecruiterProfile, User as PrismaUser } from "@prisma/client";
import { RecruiterProfile } from "@/domain/entities/recruiter-profile.entity.js";
import type { RecruiterWithUser } from "@/domain/ports/recruiter-repository.port.js";
import { PrismaUserMapper } from "./prisma-user.mapper.js";

export type PrismaRecruiterWithUser = PrismaRecruiterProfile & { user: PrismaUser };

export class PrismaRecruiterMapper {
  static toDomain(row: PrismaRecruiterWithUser): RecruiterWithUser {
    return {
      user: PrismaUserMapper.toDomain(row.user),
      profile: new RecruiterProfile(row.id, row.userId, row.team, row.position, row.active, row.createdAt),
    };
  }
}
