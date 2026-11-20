import type { FastifyInstance } from "fastify";
import type { CreateRelocatedController } from "@/presentation/http/controllers/relocated/create-relocated.controller.js";
import type { GetRelocatedController } from "@/presentation/http/controllers/relocated/get-relocated.controller.js";
import type { ListRelocatedController } from "@/presentation/http/controllers/relocated/list-relocated.controller.js";
import type { UpdateRelocatedController } from "@/presentation/http/controllers/relocated/update-relocated.controller.js";
import { authorize, type AuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";

interface RelocatedControllers {
  createRelocated: CreateRelocatedController;
  listRelocated: ListRelocatedController;
  getRelocated: GetRelocatedController;
  updateRelocated: UpdateRelocatedController;
}

export function relocatedRoutes(controllers: RelocatedControllers, authenticate: AuthenticateHook) {
  return async (app: FastifyInstance) => {
    const staff = [authenticate, authorize("ADMIN", "RECRUITER")];

    app.post("/relocated", { preHandler: staff }, (req, reply) => controllers.createRelocated.handle(req, reply));
    app.get("/relocated", { preHandler: staff }, (req, reply) => controllers.listRelocated.handle(req, reply));
    // Any authenticated role: the use case restricts a RELOCATED person to their own profile.
    app.get("/relocated/:id", { preHandler: [authenticate] }, (req, reply) => controllers.getRelocated.handle(req, reply));
    app.patch("/relocated/:id", { preHandler: staff }, (req, reply) => controllers.updateRelocated.handle(req, reply));
  };
}
