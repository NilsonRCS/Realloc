import type { FastifyInstance } from "fastify";
import type { CreateRecruiterController } from "@/presentation/http/controllers/recruiter/create-recruiter.controller.js";
import type { GetRecruiterController } from "@/presentation/http/controllers/recruiter/get-recruiter.controller.js";
import type { ListRecruitersController } from "@/presentation/http/controllers/recruiter/list-recruiters.controller.js";
import type { UpdateRecruiterController } from "@/presentation/http/controllers/recruiter/update-recruiter.controller.js";
import { authorize, type AuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";

interface RecruiterControllers {
  createRecruiter: CreateRecruiterController;
  listRecruiters: ListRecruitersController;
  getRecruiter: GetRecruiterController;
  updateRecruiter: UpdateRecruiterController;
}

export function recruiterRoutes(controllers: RecruiterControllers, authenticate: AuthenticateHook) {
  return async (app: FastifyInstance) => {
    const adminOnly = [authenticate, authorize("ADMIN")];
    const staff = [authenticate, authorize("ADMIN", "RECRUITER")];

    app.post("/recruiters", { preHandler: adminOnly }, (req, reply) => controllers.createRecruiter.handle(req, reply));
    app.get("/recruiters", { preHandler: staff }, (req, reply) => controllers.listRecruiters.handle(req, reply));
    app.get("/recruiters/:id", { preHandler: staff }, (req, reply) => controllers.getRecruiter.handle(req, reply));
    app.patch("/recruiters/:id", { preHandler: adminOnly }, (req, reply) => controllers.updateRecruiter.handle(req, reply));
  };
}
