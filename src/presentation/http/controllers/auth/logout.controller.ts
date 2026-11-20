import type { FastifyReply, FastifyRequest } from "fastify";
import type { ILogoutUseCase } from "@/application/use-cases/auth/logout.use-case.js";
import { clearAuthCookies, REFRESH_COOKIE } from "@/presentation/http/helpers/auth-cookies.js";

export class LogoutController {
  constructor(private readonly logoutUseCase: ILogoutUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await this.logoutUseCase.execute(request.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(reply);
    await reply.status(204).send();
  }
}
