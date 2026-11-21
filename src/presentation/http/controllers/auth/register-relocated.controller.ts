import type { FastifyReply, FastifyRequest } from "fastify";
import type { ICreateUserUseCase } from "@/application/use-cases/user/create-user.use-case.js";
import { registerRelocatedSchema } from "@/presentation/http/schemas/auth.schemas.js";

/** Public sign-up of a relocated person. They then log in and answer the form to create their profile. */
export class RegisterRelocatedController {
  constructor(private readonly createUser: ICreateUserUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = registerRelocatedSchema.parse(request.body);
    const user = await this.createUser.execute({ ...body, role: "RELOCATED" });

    await reply.status(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: "Registration complete. Log in and answer the form to finish your profile.",
    });
  }
}
