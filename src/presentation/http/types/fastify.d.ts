import "fastify";
import type { Role } from "@/domain/enums.js";

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser?: {
      id: string;
      email: string;
      role: Role;
    };
  }
}
