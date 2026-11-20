import type { FastifyReply, FastifyRequest } from "fastify";
import type { ICreateRelocatedUseCase } from "@/application/use-cases/relocated/create-relocated.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";
import { createRelocatedSchema } from "@/presentation/http/schemas/relocated.schemas.js";

export class CreateRelocatedController {
  constructor(private readonly useCase: ICreateRelocatedUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createRelocatedSchema.parse(request.body);
    await reply.status(201).send(await this.useCase.execute(getActor(request), body));
  }
}
