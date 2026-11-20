import type { PrismaClient } from "@prisma/client";
import type { RecruiterRepositoryPort, RecruiterWithUser } from "@/domain/ports/recruiter-repository.port.js";
import { PrismaRecruiterMapper } from "@/infrastructure/database/prisma/mappers/prisma-recruiter.mapper.js";

export class PrismaRecruiterRepository implements RecruiterRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  async createWithUser({ user, profile }: RecruiterWithUser): Promise<RecruiterWithUser> {
    const created = await this.prisma.recruiterProfile.create({
      data: {
        id: profile.id,
        team: profile.team,
        position: profile.position,
        active: profile.active,
        createdAt: profile.createdAt,
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
      },
      include: { user: true },
    });

    return PrismaRecruiterMapper.toDomain(created);
  }

  async findById(profileId: string): Promise<RecruiterWithUser | null> {
    const row = await this.prisma.recruiterProfile.findUnique({ where: { id: profileId }, include: { user: true } });
    return row ? PrismaRecruiterMapper.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<RecruiterWithUser | null> {
    const row = await this.prisma.recruiterProfile.findUnique({ where: { userId }, include: { user: true } });
    return row ? PrismaRecruiterMapper.toDomain(row) : null;
  }

  async findAll(page: number, limit: number): Promise<{ recruiters: RecruiterWithUser[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.recruiterProfile.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
      this.prisma.recruiterProfile.count(),
    ]);

    return { recruiters: rows.map(PrismaRecruiterMapper.toDomain), total };
  }

  async update({ user, profile }: RecruiterWithUser): Promise<RecruiterWithUser> {
    const updated = await this.prisma.recruiterProfile.update({
      where: { id: profile.id },
      data: {
        team: profile.team,
        position: profile.position,
        active: profile.active,
        user: { update: { name: user.name.value } },
      },
      include: { user: true },
    });

    return PrismaRecruiterMapper.toDomain(updated);
  }
}
