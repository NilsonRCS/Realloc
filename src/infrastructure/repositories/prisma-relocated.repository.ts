import { Prisma, type PrismaClient } from "@prisma/client";
import type { RelocatedProfile } from "@/domain/entities/relocated-profile.entity.js";
import type { User } from "@/domain/entities/user.entity.js";
import type { RelocatedFilters, RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { ConflictError } from "@/shared/errors/app-error.js";
import { PrismaRelocatedMapper } from "@/infrastructure/database/prisma/mappers/prisma-relocated.mapper.js";

export class PrismaRelocatedRepository implements RelocatedRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async create(profile: RelocatedProfile, user?: User): Promise<RelocatedProfile> {
    let created;
    try {
      created = await this.prisma.relocatedProfile.create({
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
          // New login created together with the profile, or an already-registered user linked to it.
          ...(user
            ? {
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
              }
            : profile.userId
              ? { user: { connect: { id: profile.userId } } }
              : {}),
        },
      });
    } catch (error) {
      // Concurrent submit of the same form, or a login e-mail taken between the check and the insert.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Already exists");
      }
      throw error;
    }

    return PrismaRelocatedMapper.toDomain(created);
  }

  async findById(id: string): Promise<RelocatedProfile | null> {
    const row = await this.prisma.relocatedProfile.findUnique({ where: { id } });
    return row ? PrismaRelocatedMapper.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<RelocatedProfile | null> {
    const row = await this.prisma.relocatedProfile.findUnique({ where: { userId } });
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
