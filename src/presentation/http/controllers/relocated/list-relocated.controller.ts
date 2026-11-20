import type { FastifyReply, FastifyRequest } from "fastify";
import type { IListRelocatedUseCase } from "@/application/use-cases/relocated/list-relocated.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";
import { listRelocatedQuerySchema } from "@/presentation/http/schemas/relocated.schemas.js";

export class ListRelocatedController {
  constructor(private readonly useCase: IListRelocatedUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listRelocatedQuerySchema.parse(request.query);
    await reply.send(await this.useCase.execute(getActor(request), query));
  }
}
