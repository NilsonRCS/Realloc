import type { FastifyReply, FastifyRequest } from "fastify";
import type { ILogoutAllUseCase } from "@/application/use-cases/auth/logout-all.use-case.js";
import { clearAuthCookies } from "@/presentation/http/helpers/auth-cookies.js";

export class LogoutAllController {
  constructor(private readonly logoutAllUseCase: ILogoutAllUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authenticatedUser is guaranteed by the authenticate preHandler
    await this.logoutAllUseCase.execute(request.authenticatedUser!.id);
    clearAuthCookies(reply);
    await reply.status(204).send();
  }
}
