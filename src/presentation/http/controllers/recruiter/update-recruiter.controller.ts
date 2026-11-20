import type { FastifyReply, FastifyRequest } from "fastify";
import type { IUpdateRecruiterUseCase } from "@/application/use-cases/recruiter/update-recruiter.use-case.js";
import { recruiterIdParamSchema, updateRecruiterSchema } from "@/presentation/http/schemas/recruiter.schemas.js";

export class UpdateRecruiterController {
  constructor(private readonly useCase: IUpdateRecruiterUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = recruiterIdParamSchema.parse(request.params);
    const body = updateRecruiterSchema.parse(request.body);
    await reply.send(await this.useCase.execute(id, body));
  }
}
