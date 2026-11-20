import type { FastifyReply, FastifyRequest } from "fastify";
import type { ICreateRecruiterUseCase } from "@/application/use-cases/recruiter/create-recruiter.use-case.js";
import { createRecruiterSchema } from "@/presentation/http/schemas/recruiter.schemas.js";

export class CreateRecruiterController {
  constructor(private readonly useCase: ICreateRecruiterUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createRecruiterSchema.parse(request.body);
    await reply.status(201).send(await this.useCase.execute(body));
  }
}
