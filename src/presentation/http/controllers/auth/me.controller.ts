import type { FastifyReply, FastifyRequest } from "fastify";
import type { IGetCurrentUserUseCase } from "@/application/use-cases/auth/me.use-case.js";

export class MeController {
  constructor(private readonly getCurrentUserUseCase: IGetCurrentUserUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authenticatedUser is guaranteed by the authenticate preHandler
    const { id } = request.authenticatedUser!;
    const result = await this.getCurrentUserUseCase.execute(id);
    await reply.status(200).send(result);
  }
}
