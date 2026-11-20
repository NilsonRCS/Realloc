import type { FastifyReply, FastifyRequest } from "fastify";
import type { TokenServicePort } from "@/application/ports/token-service.port.js";
import type { Role } from "@/domain/enums.js";
import { AppError, ForbiddenError } from "@/shared/errors/app-error.js";

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

    request.authenticatedUser = { id: payload.sub, email: payload.email, role: payload.role };
  };
}

/** Must run after `authenticate`. Rejects with 403 when the token's role is not allowed. */
export function authorize(...roles: Role[]): AuthenticateHook {
  return async (request) => {
    const user = request.authenticatedUser;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }
    if (!roles.includes(user.role)) {
      throw new ForbiddenError();
    }
  };
}
