import type { FastifyReply, FastifyRequest } from "fastify";
import type { IListRecruitersUseCase } from "@/application/use-cases/recruiter/list-recruiters.use-case.js";
import { listRecruitersQuerySchema } from "@/presentation/http/schemas/recruiter.schemas.js";

export class ListRecruitersController {
  constructor(private readonly useCase: IListRecruitersUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listRecruitersQuerySchema.parse(request.query);
    await reply.send(await this.useCase.execute(query));
  }
}
