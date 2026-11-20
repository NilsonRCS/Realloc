import type { PrismaClient } from "@prisma/client";
import type { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { User } from "@/domain/entities/user.entity.js";
import type { RelocatedFilters, RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { PrismaRelocatedMapper } from "@/infrastructure/database/prisma/mappers/prisma-relocated.mapper.js";

export class PrismaRelocatedRepository implements RelocatedRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(profile: RelocatedProfile, user?: User): Promise<RelocatedProfile> {
    const created = await this.prisma.relocatedProfile.create({
      data: {
        id: profile.id,
        name: profile.name.value,
        seniority: profile.seniority,
        description: profile.description,
        relocationStartDate: profile.relocationStartDate,
        relocationEndDate: profile.relocationEndDate,
        status: profile.status,
        createdAt: profile.createdAt,
        responsibleRecruiter: { connect: { id: profile.responsibleRecruiterId } },
        ...(user && {
          user: {
            create: {
              id: user.id,
              name: user.name.value,
              email: user.email.value,
              passwordHash: user.passwordHash,
              role: user.role,
              createdAt: user.createdAt,
            },
          },
        }),
      },
    });

    return PrismaRelocatedMapper.toDomain(created);
  }

  async findById(id: string): Promise<RelocatedProfile | null> {
    const row = await this.prisma.relocatedProfile.findUnique({ where: { id } });
    return row ? PrismaRelocatedMapper.toDomain(row) : null;
  }

  async findAll(
    page: number,
    limit: number,
    filters: RelocatedFilters
  ): Promise<{ relocateds: RelocatedProfile[]; total: number }> {
    const where = {
      ...(filters.responsibleRecruiterId && { responsibleRecruiterId: filters.responsibleRecruiterId }),
      ...(filters.status && { status: filters.status }),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.relocatedProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.relocatedProfile.count({ where }),
    ]);

    return { relocateds: rows.map(PrismaRelocatedMapper.toDomain), total };
  }

  async update(profile: RelocatedProfile): Promise<RelocatedProfile> {
    const updated = await this.prisma.relocatedProfile.update({
      where: { id: profile.id },
      data: {
        responsibleRecruiterId: profile.responsibleRecruiterId,
        name: profile.name.value,
        seniority: profile.seniority,
        description: profile.description,
        relocationEndDate: profile.relocationEndDate,
        status: profile.status,
      },
    });

    return PrismaRelocatedMapper.toDomain(updated);
  }
}
