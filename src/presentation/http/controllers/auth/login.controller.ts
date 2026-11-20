import type { FastifyReply, FastifyRequest } from "fastify";
import type { ILoginUseCase } from "@/application/use-cases/auth/login.use-case.js";
import { setAuthCookies } from "@/presentation/http/helpers/auth-cookies.js";
import { loginSchema } from "@/presentation/http/schemas/auth.schemas.js";

export class LoginController {
  constructor(private readonly loginUseCase: ILoginUseCase) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = loginSchema.parse(request.body);
    const session = await this.loginUseCase.execute(body);

    // Both tokens travel as httpOnly cookies; the access token is also in the body so
    // non-browser clients can use `Authorization: Bearer`. The refresh token is never in the body.
    setAuthCookies(reply, session);
    await reply.status(200).send({ accessToken: session.accessToken, expiresIn: session.expiresIn });
  }
}
