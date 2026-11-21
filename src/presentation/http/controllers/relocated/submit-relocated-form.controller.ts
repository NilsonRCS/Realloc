import type { FastifyReply, FastifyRequest } from "fastify";
import type { ISubmitRelocatedFormUseCase } from "@/application/use-cases/relocated/submit-relocated-form.use-case.js";
import { getActor } from "@/presentation/http/helpers/actor.js";
import { submitRelocatedFormSchema } from "@/presentation/http/schemas/relocated.schemas.js";

export class SubmitRelocatedFormController {
  constructor(private readonly useCase: ISubmitRelocatedFormUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = submitRelocatedFormSchema.parse(request.body);
    await reply.status(201).send(await this.useCase.execute(getActor(request), body));
  }
}
