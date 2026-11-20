import type { RelocatedProfile as PrismaRelocatedProfile } from "@prisma/client";
import { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";

export class PrismaRelocatedMapper {
  static toDomain(row: PrismaRelocatedProfile): RelocatedProfile {
    return new RelocatedProfile(
      row.id,
      row.userId,
      row.responsibleRecruiterId,
      UserName.create(row.name),
      row.seniority,
      row.description,
      row.relocationStartDate,
      row.relocationEndDate,
      row.status,
      row.createdAt
    );
  }
}
