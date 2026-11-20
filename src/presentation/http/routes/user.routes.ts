import type { FastifyInstance } from "fastify";
import type { CreateUserController } from "@/presentation/http/controllers/user/create-user.controller.js";
import type { ListUsersController } from "@/presentation/http/controllers/user/list-users.controller.js";
import type { GetUserController } from "@/presentation/http/controllers/user/get-user.controller.js";
import type { UpdateUserController } from "@/presentation/http/controllers/user/update-user.controller.js";
import type { DeleteUserController } from "@/presentation/http/controllers/user/delete-user.controller.js";
import { authorize, type AuthenticateHook } from "@/presentation/http/middlewares/authenticate.middleware.js";

interface UserControllers {
  createUser: CreateUserController;
  listUsers: ListUsersController;
  getUser: GetUserController;
  updateUser: UpdateUserController;
  deleteUser: DeleteUserController;
}

export function userRoutes(controllers: UserControllers, authenticate: AuthenticateHook) {
  return async (app: FastifyInstance) => {
    // User management is admin-only. Recruiters and relocated people get their login
    // through /recruiters and /relocated.
    const adminOnly = [authenticate, authorize("ADMIN")];

    app.post("/users", { preHandler: adminOnly }, (req, reply) => controllers.createUser.handle(req, reply));
    app.get("/users", { preHandler: adminOnly }, (req, reply) => controllers.listUsers.handle(req, reply));
    app.get("/users/:id", { preHandler: adminOnly }, (req, reply) => controllers.getUser.handle(req, reply));
    app.patch("/users/:id", { preHandler: adminOnly }, (req, reply) => controllers.updateUser.handle(req, reply));
    app.delete("/users/:id", { preHandler: adminOnly }, (req, reply) => controllers.deleteUser.handle(req, reply));
  };
}
