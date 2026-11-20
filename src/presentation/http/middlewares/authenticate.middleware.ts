import type { FastifyReply, FastifyRequest } from "fastify";
import { assertAccountActive } from "@/application/services/account-status.js";
import type { TokenServicePort } from "@/application/ports/token-service.port.js";
import type { Role } from "@/domain/enums.js";
import type { RecruiterRepositoryPort } from "@/domain/ports/recruiter-repository.port.js";
import type { UserRepositoryPort } from "@/domain/ports/user-repository.port.js";
import { ACCESS_COOKIE } from "@/presentation/http/helpers/auth-cookies.js";
import { AppError, ForbiddenError } from "@/shared/errors/app-error.js";

export type AuthenticateHook = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

function extractToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header) {
    return header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
  }
  return request.cookies?.[ACCESS_COOKIE] ?? null;
}

/**
 * Accepts `Authorization: Bearer <jwt>` or the httpOnly access cookie. The token only proves
 * who the user is: role and account status are loaded from the database on every request.
 */
export function makeAuthenticateHook(
  tokenService: TokenServicePort,
  userRepository: UserRepositoryPort,
  recruiterRepository: RecruiterRepositoryPort
): AuthenticateHook {
  return async (request) => {
    const token = extractToken(request);
    const payload = token ? tokenService.verify(token) : null;
    if (!payload) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await userRepository.findById(payload.sub);
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }
    await assertAccountActive(user, recruiterRepository);

    request.authenticatedUser = { id: user.id, email: user.email.value, role: user.role };
  };
}

/** Must run after `authenticate`. Rejects with 403 when the user's current role is not allowed. */
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
