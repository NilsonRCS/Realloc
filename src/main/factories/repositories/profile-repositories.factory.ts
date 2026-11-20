import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { RefreshTokenRepositoryPort } from "@/domain/ports/refresh-token-repository.port.js";
import type { RelocatedRepositoryPort } from "@/domain/ports/relocated-repository.port.js";
import { prismaClient } from "@/infrastructure/database/prisma/client.js";
import { InMemoryRecruiterRepository } from "@/infrastructure/repositories/in-memory-recruiter.repository.js";
import { InMemoryRefreshTokenRepository } from "@/infrastructure/repositories/in-memory-refresh-token.repository.js";
import { InMemoryRelocatedRepository } from "@/infrastructure/repositories/in-memory-relocated.repository.js";
import type { InMemoryUserRepository } from "@/infrastructure/repositories/in-memory-user.repository.js";
import { PrismaRecruiterRepository } from "@/infrastructure/repositories/prisma-recruiter.repository.js";
import { PrismaRefreshTokenRepository } from "@/infrastructure/repositories/prisma-refresh-token.repository.js";
import { PrismaRelocatedRepository } from "@/infrastructure/repositories/prisma-relocated.repository.js";
import { getEnv } from "@/shared/config/env.js";
import { makeUserRepository } from "./user-repository.factory.js";

let recruiterRepository: RecruiterRepositoryPort | null = null;
let relocatedRepository: RelocatedRepositoryPort | null = null;

export function makeRecruiterRepository(): RecruiterRepositoryPort {
  recruiterRepository ??=
    getEnv().USER_REPOSITORY === "prisma"
      ? new PrismaRecruiterRepository(prismaClient)
      : new InMemoryRecruiterRepository(makeUserRepository() as InMemoryUserRepository);
  return recruiterRepository;
}

export function makeRelocatedRepository(): RelocatedRepositoryPort {
  relocatedRepository ??=
    getEnv().USER_REPOSITORY === "prisma"
      ? new PrismaRelocatedRepository(prismaClient)
      : new InMemoryRelocatedRepository(makeUserRepository() as InMemoryUserRepository);
  return relocatedRepository;
}

let refreshTokenRepository: RefreshTokenRepositoryPort | null = null;

export function makeRefreshTokenRepository(): RefreshTokenRepositoryPort {
  refreshTokenRepository ??=
    getEnv().USER_REPOSITORY === "prisma"
      ? new PrismaRefreshTokenRepository(prismaClient)
      : new InMemoryRefreshTokenRepository();
  return refreshTokenRepository;
}
