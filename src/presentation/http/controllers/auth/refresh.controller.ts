import type { FastifyReply, FastifyRequest } from "fastify";
import type { IRefreshUseCase } from "@/application/use-cases/auth/refresh.use-case.js";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "@/presentation/http/helpers/auth-cookies.js";
import { AppError } from "@/shared/errors/app-error.js";

export class RefreshController {
  constructor(private readonly refreshUseCase: IRefreshUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = request.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new AppError("Unauthorized", 401);
    }

    try {
      const session = await this.refreshUseCase.execute(refreshToken);
      setAuthCookies(reply, session);
      await reply.status(200).send({ accessToken: session.accessToken, expiresIn: session.expiresIn });
    } catch (error) {
      // A rejected refresh token is useless: stop the browser from sending it again.
      clearAuthCookies(reply);
      throw error;
    }
  }
}
