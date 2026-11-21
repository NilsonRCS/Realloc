import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/main/app.js";
import { adminToken, bearer, login, PASSWORD } from "./helpers.js";

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

async function activeRecruiter(app: FastifyInstance, admin: string) {
  const email = `rec.${randomUUID()}@example.com`;
  const res = await app.inject({
    method: "POST",
    url: "/api/recruiters",
    headers: bearer(admin),
    payload: { name: "Rita Recrutadora", email, password: PASSWORD, team: "Alpha" },
  });
  return { id: res.json().id as string, email, token: await login(app, email) };
}

async function registerRelocated(app: FastifyInstance, name = "Rui Realocado") {
  const email = `rel.${randomUUID()}@example.com`;
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register/relocated",
    payload: { name, email, password: PASSWORD },
  });
  assert.equal(res.statusCode, 201);
  return { email, body: res.json(), token: await login(app, email) };
}

const form = (responsibleRecruiterId: string) => ({
  seniority: "SENIOR",
  description: "Back-end, 8 anos",
  relocationStartDate: "2026-12-01",
  responsibleRecruiterId,
});

test("registering as relocated gives an active RELOCATED login but no profile yet", async () => {
  await withApp(async (app) => {
    const { body, token } = await registerRelocated(app);
    assert.equal(body.role, "RELOCATED");
    assert.equal("passwordHash" in body, false);

    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(token) });
    assert.equal(me.json().role, "RELOCATED");

    // 404 = "form not answered yet": the front shows the form
    const profile = await app.inject({ method: "GET", url: "/api/relocated/me", headers: bearer(token) });
    assert.equal(profile.statusCode, 404);
  });
});

test("a client cannot pick the role when registering as relocated", async () => {
  await withApp(async (app) => {
    const email = `sneaky.${randomUUID()}@example.com`;
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register/relocated",
      payload: { name: "Sneaky", email, password: PASSWORD, role: "ADMIN" },
    });
    assert.equal(res.statusCode, 201);
    assert.equal(res.json().role, "RELOCATED");
  });
});

test("the recruiter picker lists only active recruiters and exposes no account data", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const active = await activeRecruiter(app, admin);
    const pendingEmail = `pending.${randomUUID()}@example.com`;
    const pending = await app.inject({
      method: "POST",
      url: "/api/auth/register/recruiter",
      payload: { name: "Pendente", email: pendingEmail, password: PASSWORD },
    });

    const { token } = await registerRelocated(app);
    const res = await app.inject({ method: "GET", url: "/api/recruiters/available", headers: bearer(token) });
    assert.equal(res.statusCode, 200);

    const ids = res.json().recruiters.map((r: { id: string }) => r.id);
    assert.equal(ids.includes(active.id), true);
    assert.equal(ids.includes(pending.json().id), false);
    assert.deepEqual(Object.keys(res.json().recruiters[0]).sort(), ["id", "name", "position", "team"]);

    const anonymous = await app.inject({ method: "GET", url: "/api/recruiters/available" });
    assert.equal(anonymous.statusCode, 401);

    // the full recruiter list stays staff-only
    const full = await app.inject({ method: "GET", url: "/api/recruiters", headers: bearer(token) });
    assert.equal(full.statusCode, 403);
  });
});

test("answering the form creates the profile linked to the account, once", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await activeRecruiter(app, admin);
    const { token, body: account } = await registerRelocated(app, "Rui Registrado");

    const submit = await app.inject({
      method: "POST",
      url: "/api/relocated/me",
      headers: bearer(token),
      payload: { ...form(recruiter.id), name: "Nome Falso", userId: "x", status: "INACTIVE" },
    });
    assert.equal(submit.statusCode, 201);
    const profile = submit.json();
    assert.equal(profile.userId, account.id);
    assert.equal(profile.name, "Rui Registrado"); // from the account, not from the request
    assert.equal(profile.status, "ACTIVE");
    assert.equal(profile.responsibleRecruiterId, recruiter.id);
    assert.equal(profile.seniority, "SENIOR");

    const mine = await app.inject({ method: "GET", url: "/api/relocated/me", headers: bearer(token) });
    assert.equal(mine.statusCode, 200);
    assert.equal(mine.json().id, profile.id);

    const again = await app.inject({ method: "POST", url: "/api/relocated/me", headers: bearer(token), payload: form(recruiter.id) });
    assert.equal(again.statusCode, 409);

    // the chosen recruiter now sees this person in their list
    const list = await app.inject({ method: "GET", url: "/api/relocated", headers: bearer(recruiter.token) });
    assert.equal(list.json().relocateds.some((r: { id: string }) => r.id === profile.id), true);
  });
});

test("the form validates the recruiter and the fields", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await activeRecruiter(app, admin);
    const { token } = await registerRelocated(app);
    const post = (payload: object) =>
      app.inject({ method: "POST", url: "/api/relocated/me", headers: bearer(token), payload });

    assert.equal((await post(form(randomUUID()))).statusCode, 404); // unknown recruiter
    assert.equal((await post({ ...form(recruiter.id), seniority: "INTERN" })).statusCode, 422);
    assert.equal((await post({ ...form(recruiter.id), relocationStartDate: "01/12/2026" })).statusCode, 422);
    assert.equal((await post({ seniority: "MID", relocationStartDate: "2026-12-01" })).statusCode, 422); // recruiter missing

    await app.inject({
      method: "PATCH",
      url: `/api/recruiters/${recruiter.id}`,
      headers: bearer(admin),
      payload: { active: false },
    });
    assert.equal((await post(form(recruiter.id))).statusCode, 422); // inactive recruiter
  });
});

test("only a registered relocated person can answer the form", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await activeRecruiter(app, admin);

    const anonymous = await app.inject({ method: "POST", url: "/api/relocated/me", payload: form(recruiter.id) });
    assert.equal(anonymous.statusCode, 401);

    for (const token of [recruiter.token, admin]) {
      const staff = await app.inject({ method: "POST", url: "/api/relocated/me", headers: bearer(token), payload: form(recruiter.id) });
      assert.equal(staff.statusCode, 403);
    }
  });
});

test("duplicate e-mail on relocated sign-up is a 409", async () => {
  await withApp(async (app) => {
    const { email } = await registerRelocated(app);
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register/relocated",
      payload: { name: "Outro Rui", email, password: PASSWORD },
    });
    assert.equal(res.statusCode, 409);
  });
});
