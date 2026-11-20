import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "@/shared/errors/app-error.js";
import { userRoutes } from "@/presentation/http/routes/user.routes.js";
import { authRoutes } from "@/presentation/http/routes/auth.routes.js";
import { makeAuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";
import { makeAuthControllers } from "@/main/factories/auth.factory.js";
import { makeTokenService } from "./factories/token-service.factory.js";
import { makeUserControllers } from "./factories/user.factory.js";
import { makeRecruiterControllers } from "./factories/recruiter.factory.js";
import { makeRelocatedControllers } from "./factories/relocated.factory.js";
import { recruiterRoutes } from "@/presentation/http/routes/recruiter.routes.js";
import { relocatedRoutes } from "@/presentation/http/routes/relocated.routes.js";

function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.setErrorHandler(async (error, _request, reply) => {
    if (error instanceof ZodError) {
      await reply.status(422).send({
        statusCode: 422,
        error: "Validation Error",
        issues: error.issues,
      });
      return;
    }

    if (error instanceof AppError) {
      await reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.message,
      });
      return;
    }

    app.log.error(error);
    await reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    void reply.status(404).send({ statusCode: 404, error: "Route not found" });
  });

  app.get("/health", async () => ({ status: "tá vivo" }));

  const authenticate = makeAuthenticateHook(makeTokenService());

  void app.register(userRoutes(makeUserControllers(), authenticate), { prefix: "/api" });
  void app.register(recruiterRoutes(makeRecruiterControllers(), authenticate), { prefix: "/api" });
  void app.register(relocatedRoutes(makeRelocatedControllers(), authenticate), { prefix: "/api" });
  void app.register(authRoutes(makeAuthControllers(), authenticate), { prefix: "/api" });

  return app;
}

export { buildApp };