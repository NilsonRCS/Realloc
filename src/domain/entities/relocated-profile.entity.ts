import type { RelocationStatus, Seniority } from "@/domain/enums.js";
import { UserName } from "@/domain/value-objects/user-name.value-object.js";

export class RelocatedProfile {
  constructor(
    public readonly id: string,
    /** Null while the relocated person has no login yet. */
    public readonly userId: string | null,
    public readonly responsibleRecruiterId: string,
    public readonly name: UserName,
    public readonly seniority: Seniority,
    public readonly description: string | null,
    public readonly relocationStartDate: Date,
    public readonly relocationEndDate: Date | null,
    public readonly status: RelocationStatus,
    public readonly createdAt: Date
  ) {}
}
