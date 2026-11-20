import type { FastifyInstance } from "fastify";
import type { LoginController } from "@/presentation/http/controllers/auth/login.controller.js";
import type { LogoutAllController } from "@/presentation/http/controllers/auth/logout-all.controller.js";
import type { LogoutController } from "@/presentation/http/controllers/auth/logout.controller.js";
import type { MeController } from "@/presentation/http/controllers/auth/me.controller.js";
import type { RefreshController } from "@/presentation/http/controllers/auth/refresh.controller.js";
import type { AuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";

interface AuthControllers {
  login: LoginController;
  refresh: RefreshController;
  logout: LogoutController;
  logoutAll: LogoutAllController;
  me: MeController;
}

export function authRoutes(controllers: AuthControllers, authenticate: AuthenticateHook) {
  return async (app: FastifyInstance) => {
    app.post("/auth/login", (req, reply) => controllers.login.handle(req, reply));
    // Authenticated by the refresh cookie itself, not by the access token (which may have expired).
    app.post("/auth/refresh", (req, reply) => controllers.refresh.handle(req, reply));
    app.post("/auth/logout", (req, reply) => controllers.logout.handle(req, reply));
    app.post("/auth/logout-all", { preHandler: [authenticate] }, (req, reply) => controllers.logoutAll.handle(req, reply));
    app.get("/auth/me", { preHandler: [authenticate] }, (req, reply) => controllers.me.handle(req, reply));
  };
}
