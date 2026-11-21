import type { FastifyReply, FastifyRequest } from "fastify";
import type { ICreateRecruiterUseCase } from "@/application/use-cases/recruiter/create-recruiter.use-case.js";
import { registerRecruiterSchema } from "@/presentation/http/schemas/auth.schemas.js";

/** Public recruiter sign-up. The account is created inactive, pending admin approval. */
export class RegisterRecruiterController {
  constructor(private readonly createRecruiter: ICreateRecruiterUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = registerRecruiterSchema.parse(request.body);
    const recruiter = await this.createRecruiter.execute({ ...body, active: false });

    // No tokens: the account cannot be used until an admin activates it.
    await reply.status(201).send({
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      active: recruiter.active,
      message: "Registration received. An admin must approve your account before you can log in.",
    });
  }
}
