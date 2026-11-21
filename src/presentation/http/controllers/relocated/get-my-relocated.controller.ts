import type { FastifyReply, FastifyRequest } from "fastify";
import type { IGetMyRelocatedUseCase } from "@/application/use-cases/relocated/get-my-relocated.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";

export class GetMyRelocatedController {
  constructor(private readonly useCase: IGetMyRelocatedUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    await reply.send(await this.useCase.execute(getActor(request)));
  }
}
