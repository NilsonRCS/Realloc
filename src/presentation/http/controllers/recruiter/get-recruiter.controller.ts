import type { FastifyReply, FastifyRequest } from "fastify";
import type { IGetRecruiterUseCase } from "@/application/use-cases/recruiter/get-recruiter.use-case.js";
import { recruiterIdParamSchema } from "@/presentation/http/schemas/recruiter.schemas.js";

export class GetRecruiterController {
  constructor(private readonly useCase: IGetRecruiterUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = recruiterIdParamSchema.parse(request.params);
    await reply.send(await this.useCase.execute(id));
  }
}
