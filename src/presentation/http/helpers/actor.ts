import type { FastifyRequest } from "fastify";
import type { Actor } from "@/application/dtos/relocated.dto.js";
import { AppError } from "@/shared/errors/app-error.js";

export function getActor(request: FastifyRequest): Actor {
  const user = request.authenticatedUser;
  if (!user) {
    throw new AppError("Unauthorized", 401);
  }
  return { userId: user.id, role: user.role };
}
