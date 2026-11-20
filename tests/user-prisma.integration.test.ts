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
  await prismaClient.relocatedProfile.deleteMany();
  await prismaClient.recruiterProfile.deleteMany();
  await prismaClient.user.deleteMany();

  const { buildApp } = await import("../src/main/app.js");
  app = buildApp();
  await app.ready();
});

after(async () => {
  const { prismaClient } = await import("../src/infrastructure/database/prisma/client.js");
  await prismaClient.relocatedProfile.deleteMany();
  await prismaClient.recruiterProfile.deleteMany();
  await prismaClient.user.deleteMany();
  await app.close();
  await prismaClient.$disconnect();
});

test("create and list users through HTTP using Prisma repository", async () => {
  const { adminToken, bearer } = await import("./helpers.js");
  const createResponse = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: bearer(await adminToken(app)),
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

  assert.equal(list.total, 2); // the admin that made the request + the created user
  assert.equal(list.users.some((u: { id: string }) => u.id === created.id), true);
});

test("recruiter + relocated flow persists through Prisma (atomic user+profile creation)", async () => {
  const { adminToken, bearer, login, PASSWORD } = await import("./helpers.js");
  const admin = await adminToken(app);

  const recruiterRes = await app.inject({
    method: "POST",
    url: "/api/recruiters",
    headers: bearer(admin),
    payload: { name: "Rita Prisma", email: "rita.prisma@example.com", password: PASSWORD, team: "Alpha" },
  });
  assert.equal(recruiterRes.statusCode, 201);
  const recruiter = recruiterRes.json();

  // duplicate e-mail must not leave an orphan profile behind
  const duplicate = await app.inject({
    method: "POST",
    url: "/api/recruiters",
    headers: bearer(admin),
    payload: { name: "Rita Dup", email: "rita.prisma@example.com", password: PASSWORD },
  });
  assert.equal(duplicate.statusCode, 409);

  const recruiterToken = await login(app, "rita.prisma@example.com");
  const relocatedRes = await app.inject({
    method: "POST",
    url: "/api/relocated",
    headers: bearer(recruiterToken),
    payload: {
      name: "Rui Prisma",
      seniority: "SENIOR",
      relocationStartDate: "2026-12-01",
      email: "rui.prisma@example.com",
      password: PASSWORD,
    },
  });
  assert.equal(relocatedRes.statusCode, 201);
  const relocated = relocatedRes.json();
  assert.equal(relocated.responsibleRecruiterId, recruiter.id);
  assert.equal(relocated.relocationStartDate, "2026-12-01");
  assert.notEqual(relocated.userId, null);

  const relocatedToken = await login(app, "rui.prisma@example.com");
  const own = await app.inject({ method: "GET", url: `/api/relocated/${relocated.id}`, headers: bearer(relocatedToken) });
  assert.equal(own.statusCode, 200);

  const list = await app.inject({ method: "GET", url: "/api/relocated?status=ACTIVE", headers: bearer(recruiterToken) });
  assert.equal(list.json().total, 1);
});

test("refresh tokens are stored hashed, rotate atomically and die on reuse (Prisma)", async () => {
  const { adminToken, bearer, PASSWORD } = await import("./helpers.js");
  const { prismaClient } = await import("../src/infrastructure/database/prisma/client.js");
  const admin = await adminToken(app);

  await app.inject({
    method: "POST",
    url: "/api/users",
    headers: bearer(admin),
    payload: { name: "Session User", email: "session.prisma@example.com", password: PASSWORD },
  });

  const login = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "session.prisma@example.com", password: PASSWORD },
  });
  const first = login.cookies.find((c) => c.name === "refresh_token")!.value;

  const stored = await prismaClient.refreshToken.findMany({ where: { user: { email: "session.prisma@example.com" } } });
  assert.equal(stored.length, 1);
  assert.notEqual(stored[0].tokenHash, first); // raw token is never persisted
  assert.equal(stored[0].tokenHash.length, 64);

  // two concurrent refreshes with the same token: exactly one may win
  const [r1, r2] = await Promise.all(
    [0, 1].map(() => app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { refresh_token: first } }))
  );
  const codes = [r1.statusCode, r2.statusCode].sort();
  assert.deepEqual(codes, [200, 401]);

  // the race loser triggers family revocation: every token of the family is now revoked
  const family = await prismaClient.refreshToken.findMany({ where: { familyId: stored[0].familyId } });
  assert.equal(family.every((t) => t.revokedAt !== null), true);
});
