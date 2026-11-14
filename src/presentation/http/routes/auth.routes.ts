import type { FastifyInstance } from "fastify";
import type { LoginController } from "@/presentation/http/controllers/auth/login.controller.js";
import type { MeController } from "@/presentation/http/controllers/auth/me.controller.js";
import type { AuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";

interface AuthControllers {
  login: LoginController;
  me: MeController;
}

export function authRoutes(controllers: AuthControllers, authenticate: AuthenticateHook) {
  return async (app: FastifyInstance) => {
    app.post("/auth/login", (req, reply) => controllers.login.handle(req, reply));
    app.get("/auth/me", { preHandler: [authenticate] }, (req, reply) => controllers.me.handle(req, reply));
  };
}
