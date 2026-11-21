import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { after } from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/main/app.js";
import { adminToken, bearer, PASSWORD } from "./helpers.js";

process.env.USER_REPOSITORY = "inmemory";
process.env.JWT_SECRET = "test-secret-with-16-chars";
process.env.REGISTER_RATE_LIMIT_MAX = "100";

async function withApp(run: (app: FastifyInstance) => Promise<void>) {
  const app = buildApp();
  await app.ready();
  try {
    await run(app);
  } finally {
    await app.close();
  }
}

const register = (app: FastifyInstance, payload: object) =>
  app.inject({ method: "POST", url: "/api/auth/register/recruiter", payload });

const newEmail = () => `new.${randomUUID()}@example.com`;

test("register creates an inactive recruiter, without tokens, who cannot log in yet", async () => {
  await withApp(async (app) => {
    const email = newEmail();
    const res = await register(app, { name: "Nova Recrutadora", email, password: PASSWORD, team: "Alpha" });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.equal(body.active, false);
    assert.equal(body.email, email);
    assert.equal(body.accessToken, undefined);
    assert.equal(res.cookies.length, 0);
    assert.equal("passwordHash" in body, false);

    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password: PASSWORD } });
    assert.equal(login.statusCode, 403);
  });
});

test("client cannot escalate: role and active in the payload are ignored", async () => {
  await withApp(async (app) => {
    const email = newEmail();
    const res = await register(app, { name: "Esperta", email, password: PASSWORD, role: "ADMIN", active: true });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().active, false);

    const admin = await adminToken(app);
    const recruiters = await app.inject({ method: "GET", url: "/api/recruiters?active=false", headers: bearer(admin) });
    const created = recruiters.json().recruiters.find((r: { email: string }) => r.email === email);
    assert.ok(created);
    assert.equal(created.active, false);

    const users = await app.inject({ method: "GET", url: "/api/users", headers: bearer(admin) });
    const user = users.json().users.find((u: { email: string }) => u.email === email);
    assert.equal(user.role, "RECRUITER");
  });
});

test("admin sees pending accounts, approves one, and it can then log in", async () => {
  await withApp(async (app) => {
    const email = newEmail();
    const { id } = (await register(app, { name: "Pendente", email, password: PASSWORD })).json();
    const admin = await adminToken(app);

    const pending = await app.inject({ method: "GET", url: "/api/recruiters?active=false", headers: bearer(admin) });
    assert.equal(pending.json().recruiters.some((r: { id: string }) => r.id === id), true);

    const approve = await app.inject({
      method: "PATCH",
      url: `/api/recruiters/${id}`,
      headers: bearer(admin),
      payload: { active: true },
    });
    assert.equal(approve.statusCode, 200);

    const stillPending = await app.inject({ method: "GET", url: "/api/recruiters?active=false", headers: bearer(admin) });
    assert.equal(stillPending.json().recruiters.some((r: { id: string }) => r.id === id), false);

    const login = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password: PASSWORD } });
    assert.equal(login.statusCode, 200);
  });
});

test("register validates input and rejects duplicate e-mails", async () => {
  await withApp(async (app) => {
    const email = newEmail();
    assert.equal((await register(app, { name: "A", email, password: PASSWORD })).statusCode, 422);
    assert.equal((await register(app, { name: "Ana Souza", email: "not-an-email", password: PASSWORD })).statusCode, 422);
    assert.equal((await register(app, { name: "Ana Souza", email, password: "123" })).statusCode, 422);

    assert.equal((await register(app, { name: "Ana Souza", email, password: PASSWORD })).statusCode, 201);
    assert.equal((await register(app, { name: "Ana Souza", email, password: PASSWORD })).statusCode, 409);
  });
});

test("register is rate limited per IP", async () => {
  process.env.REGISTER_RATE_LIMIT_MAX = "3";
  after(() => {
    process.env.REGISTER_RATE_LIMIT_MAX = "100";
  });
  await withApp(async (app) => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await register(app, { name: "Spam Bot", email: newEmail(), password: PASSWORD })).statusCode);
    }
    assert.deepEqual(statuses, [201, 201, 201, 429, 429]);
  });
});

test("malformed JSON is a 400, not a 500", async () => {
  await withApp(async (app) => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register/recruiter",
      headers: { "content-type": "application/json" },
      payload: "{ not json",
    });
    assert.equal(res.statusCode, 400);
  });
});
