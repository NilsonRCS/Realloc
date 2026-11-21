import type { FastifyReply, FastifyRequest } from "fastify";
import type { IListAvailableRecruitersUseCase } from "@/application/use-cases/recruiter/list-available-recruiters.use-case.js";
import { listRecruitersQuerySchema } from "@/presentation/http/schemas/recruiter.schemas.js";

export class ListAvailableRecruitersController {
  constructor(private readonly useCase: IListAvailableRecruitersUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit } = listRecruitersQuerySchema.parse(request.query);
    await reply.send(await this.useCase.execute({ page, limit }));
  }
}
