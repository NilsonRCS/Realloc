import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { CreateUserUseCase } from "../src/application/use-cases/user/create-user.use-case.js";
import { makeUserRepository } from "../src/main/factories/repositories/user-repository.factory.js";

export const PASSWORD = "secret123";

/** Creates an ADMIN straight in the repository (there is no public sign-up) and returns its token. */
export async function adminToken(app: FastifyInstance): Promise<string> {
  const email = `admin.${randomUUID()}@example.com`;
  await new CreateUserUseCase(makeUserRepository()).execute({
    name: "Admin",
    email,
    password: PASSWORD,
    role: "ADMIN",
  });
  return login(app, email);
}

export async function login(app: FastifyInstance, email: string, password = PASSWORD): Promise<string> {
  const response = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password } });
  if (response.statusCode !== 200) {
    throw new Error(`login failed for ${email}: ${response.statusCode}`);
  }
  return response.json().accessToken;
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
