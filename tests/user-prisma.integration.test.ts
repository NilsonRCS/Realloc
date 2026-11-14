import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { buildApp } from "../src/main/app.js";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const isPostgres = DATABASE_URL.startsWith("postgresql://") || DATABASE_URL.startsWith("postgres://");

if (!isPostgres) {
  console.log("Skipping Prisma integration tests — requires PostgreSQL (run: npm run docker:dev).");
  process.exit(0);
}

let app: ReturnType<typeof buildApp>;

before(async () => {
  process.env.USER_REPOSITORY = "prisma";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const { prismaClient } = await import("../src/infrastructure/database/prisma/client.js");
  await prismaClient.user.deleteMany();

  const { buildApp } = await import("../src/main/app.js");
  app = buildApp();
  await app.ready();
});

after(async () => {
  const { prismaClient } = await import("../src/infrastructure/database/prisma/client.js");
  await prismaClient.user.deleteMany();
  await app.close();
  await prismaClient.$disconnect();
});

test("create and list users through HTTP using Prisma repository", async () => {
  const createResponse = await app.inject({
    method: "POST",
    url: "/api/users",
    payload: {
      name: "Integration Prisma",
      email: "integration.prisma@example.com",
      password: "secret123",
    },
  });

  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json();
  assert.equal(created.email, "integration.prisma@example.com");

  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "integration.prisma@example.com", password: "secret123" },
  });

  assert.equal(loginResponse.statusCode, 200);
  const { accessToken } = loginResponse.json();

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/users?page=1&limit=10",
    headers: { authorization: `Bearer ${accessToken}` },
  });

  assert.equal(listResponse.statusCode, 200);
  const list = listResponse.json();

  assert.equal(list.total, 1);
  assert.equal(list.users.length, 1);
  assert.equal(list.users[0].id, created.id);
});
