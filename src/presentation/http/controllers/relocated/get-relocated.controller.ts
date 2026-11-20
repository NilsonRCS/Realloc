import type { FastifyReply, FastifyRequest } from "fastify";
import type { IGetRelocatedUseCase } from "@/application/use-cases/relocated/get-relocated.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";
import { relocatedIdParamSchema } from "@/presentation/http/schemas/relocated.schemas.js";

export class GetRelocatedController {
  constructor(private readonly useCase: IGetRelocatedUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = relocatedIdParamSchema.parse(request.params);
    await reply.send(await this.useCase.execute(getActor(request), id));
  }
}
