import { SessionService } from "@/application/services/session.service.js";
import { LoginUseCase } from "@/application/use-cases/auth/login.use-case.js";
import { LogoutAllUseCase } from "@/application/use-cases/auth/logout-all.use-case.js";
import { LogoutUseCase } from "@/application/use-cases/auth/logout.use-case.js";
import { GetCurrentUserUseCase } from "@/application/use-cases/auth/me.use-case.js";
import { RefreshUseCase } from "@/application/use-cases/auth/refresh.use-case.js";
import { LoginController } from "@/presentation/http/controllers/auth/login.controller.js";
import { LogoutAllController } from "@/presentation/http/controllers/auth/logout-all.controller.js";
import { LogoutController } from "@/presentation/http/controllers/auth/logout.controller.js";
import { MeController } from "@/presentation/http/controllers/auth/me.controller.js";
import { RefreshController } from "@/presentation/http/controllers/auth/refresh.controller.js";
import { getEnv } from "@/shared/config/env.js";
import { makeTokenService } from "@/main/factories/token-service.factory.js";
import { makeRecruiterRepository, makeRefreshTokenRepository } from "./repositories/profile-repositories.factory.js";
import { makeUserRepository } from "./repositories/user-repository.factory.js";

export function makeAuthControllers() {
  const env = getEnv();
  const userRepository = makeUserRepository();
  const recruiterRepository = makeRecruiterRepository();
  const refreshTokenRepository = makeRefreshTokenRepository();
  const sessionService = new SessionService(makeTokenService(), refreshTokenRepository, {
    accessTokenTtlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
  });

  return {
    login: new LoginController(new LoginUseCase(userRepository, recruiterRepository, sessionService)),
    refresh: new RefreshController(
      new RefreshUseCase(refreshTokenRepository, userRepository, recruiterRepository, sessionService)
    ),
    logout: new LogoutController(new LogoutUseCase(refreshTokenRepository)),
    logoutAll: new LogoutAllController(new LogoutAllUseCase(refreshTokenRepository)),
    me: new MeController(new GetCurrentUserUseCase(userRepository)),
  };
}
