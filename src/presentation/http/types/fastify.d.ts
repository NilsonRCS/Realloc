import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    authenticatedUser?: {
      id: string;
      email: string;
    };
  }
}
