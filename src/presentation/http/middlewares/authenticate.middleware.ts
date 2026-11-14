import type { FastifyReply, FastifyRequest } from "fastify";
import type { TokenServicePort } from "@/application/ports/token-service.port.js";
import { AppError } from "@/shared/errors/app-error.js";

export type AuthenticateHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export function makeAuthenticateHook(tokenService: TokenServicePort): AuthenticateHook {
  return async (request) => {
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = header.slice("Bearer ".length).trim();
    const payload = tokenService.verify(token);

    if (!payload) {
      throw new AppError("Unauthorized", 401);
    }

    request.authenticatedUser = { id: payload.sub, email: payload.email };
  };
}
