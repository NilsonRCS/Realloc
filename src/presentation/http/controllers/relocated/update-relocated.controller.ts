import type { FastifyReply, FastifyRequest } from "fastify";
import type { IUpdateRelocatedUseCase } from "@/application/use-cases/relocated/update-relocated.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";
import { relocatedIdParamSchema, updateRelocatedSchema } from "@/presentation/http/schemas/relocated.schemas.js";

export class UpdateRelocatedController {
  constructor(private readonly useCase: IUpdateRelocatedUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = relocatedIdParamSchema.parse(request.params);
    const body = updateRelocatedSchema.parse(request.body);
    await reply.send(await this.useCase.execute(getActor(request), id, body));
  }
}
