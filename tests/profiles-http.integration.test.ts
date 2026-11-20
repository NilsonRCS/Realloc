import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/main/app.js";
import { adminToken, bearer, login, PASSWORD } from "./helpers.js";

process.env.USER_REPOSITORY = "inmemory";
process.env.JWT_SECRET = "test-secret-with-16-chars";

async function withApp(run: (app: FastifyInstance) => Promise<void>) {
  const app = buildApp();
  await app.ready();
  try {
    await run(app);
  } finally {
    await app.close();
  }
}

async function createRecruiter(app: FastifyInstance, admin: string, team = "Alpha") {
  const email = `recruiter.${randomUUID()}@example.com`;
  const response = await app.inject({
    method: "POST",
    url: "/api/recruiters",
    headers: bearer(admin),
    payload: { name: "Rita Recruiter", email, password: PASSWORD, team, position: "Senior recruiter" },
  });
  assert.equal(response.statusCode, 201);
  return { ...response.json(), email, token: await login(app, email) };
}

const relocatedPayload = {
  name: "Rui Realocado",
  seniority: "MID",
  description: "Back-end, 5 anos",
  relocationStartDate: "2026-12-01",
};

test("only ADMIN can create recruiters; the new recruiter gets role RECRUITER", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await createRecruiter(app, admin);

    assert.equal(recruiter.active, true);
    assert.equal(recruiter.team, "Alpha");

    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(recruiter.token) });
    assert.equal(me.json().role, "RECRUITER");

    const asRecruiter = await app.inject({
      method: "POST",
      url: "/api/recruiters",
      headers: bearer(recruiter.token),
      payload: { name: "Outro", email: "outro@example.com", password: PASSWORD },
    });
    assert.equal(asRecruiter.statusCode, 403);

    const anonymous = await app.inject({ method: "POST", url: "/api/recruiters", payload: {} });
    assert.equal(anonymous.statusCode, 401);

    const users = await app.inject({ method: "GET", url: "/api/users", headers: bearer(recruiter.token) });
    assert.equal(users.statusCode, 403);
  });
});

test("recruiter creates a relocated person (no login) and is the responsible one", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await createRecruiter(app, admin);

    const created = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(recruiter.token),
      payload: relocatedPayload,
    });
    assert.equal(created.statusCode, 201);
    const body = created.json();
    assert.equal(body.responsibleRecruiterId, recruiter.id);
    assert.equal(body.userId, null);
    assert.equal(body.status, "ACTIVE");
    assert.equal(body.relocationStartDate, "2026-12-01");

    const list = await app.inject({ method: "GET", url: "/api/relocated", headers: bearer(recruiter.token) });
    assert.equal(list.statusCode, 200);
    assert.equal(list.json().total, 1);
  });
});

test("a recruiter cannot see or edit another recruiter's relocated people", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const owner = await createRecruiter(app, admin);
    const other = await createRecruiter(app, admin, "Beta");

    const created = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(owner.token),
      payload: relocatedPayload,
    });
    const { id } = created.json();

    const get = await app.inject({ method: "GET", url: `/api/relocated/${id}`, headers: bearer(other.token) });
    assert.equal(get.statusCode, 404);

    const patch = await app.inject({
      method: "PATCH",
      url: `/api/relocated/${id}`,
      headers: bearer(other.token),
      payload: { status: "INACTIVE" },
    });
    assert.equal(patch.statusCode, 404);

    const list = await app.inject({ method: "GET", url: "/api/relocated", headers: bearer(other.token) });
    assert.equal(list.json().total, 0);

    const adminGet = await app.inject({ method: "GET", url: `/api/relocated/${id}`, headers: bearer(admin) });
    assert.equal(adminGet.statusCode, 200);
  });
});

test("relocated person with login sees only their own profile and cannot edit it", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await createRecruiter(app, admin);
    const email = `relocated.${randomUUID()}@example.com`;

    const mine = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(recruiter.token),
      payload: { ...relocatedPayload, email, password: PASSWORD },
    });
    assert.equal(mine.statusCode, 201);

    const theirs = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(recruiter.token),
      payload: relocatedPayload,
    });

    const token = await login(app, email);
    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(token) });
    assert.equal(me.json().role, "RELOCATED");

    const own = await app.inject({ method: "GET", url: `/api/relocated/${mine.json().id}`, headers: bearer(token) });
    assert.equal(own.statusCode, 200);

    const foreign = await app.inject({ method: "GET", url: `/api/relocated/${theirs.json().id}`, headers: bearer(token) });
    assert.equal(foreign.statusCode, 404);

    const list = await app.inject({ method: "GET", url: "/api/relocated", headers: bearer(token) });
    assert.equal(list.statusCode, 403);

    const patch = await app.inject({
      method: "PATCH",
      url: `/api/relocated/${mine.json().id}`,
      headers: bearer(token),
      payload: { status: "INACTIVE" },
    });
    assert.equal(patch.statusCode, 403);
  });
});

test("ADMIN must name the responsible recruiter, who must be active", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await createRecruiter(app, admin);

    const missing = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(admin),
      payload: relocatedPayload,
    });
    assert.equal(missing.statusCode, 422);

    const ok = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(admin),
      payload: { ...relocatedPayload, responsibleRecruiterId: recruiter.id },
    });
    assert.equal(ok.statusCode, 201);

    const deactivate = await app.inject({
      method: "PATCH",
      url: `/api/recruiters/${recruiter.id}`,
      headers: bearer(admin),
      payload: { active: false },
    });
    assert.equal(deactivate.json().active, false);

    const inactive = await app.inject({
      method: "POST",
      url: "/api/relocated",
      headers: bearer(admin),
      payload: { ...relocatedPayload, responsibleRecruiterId: recruiter.id },
    });
    assert.equal(inactive.statusCode, 422);
  });
});

test("validation: email without password, bad seniority, end date before start", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const recruiter = await createRecruiter(app, admin);
    const post = (payload: object) =>
      app.inject({ method: "POST", url: "/api/relocated", headers: bearer(recruiter.token), payload });

    assert.equal((await post({ ...relocatedPayload, email: "a@example.com" })).statusCode, 422);
    assert.equal((await post({ ...relocatedPayload, seniority: "INTERN" })).statusCode, 422);
    assert.equal((await post({ ...relocatedPayload, relocationStartDate: "01/12/2026" })).statusCode, 422);

    const { id } = (await post(relocatedPayload)).json();
    const patch = await app.inject({
      method: "PATCH",
      url: `/api/relocated/${id}`,
      headers: bearer(recruiter.token),
      payload: { relocationEndDate: "2026-11-30" },
    });
    assert.equal(patch.statusCode, 422);

    const closed = await app.inject({
      method: "PATCH",
      url: `/api/relocated/${id}`,
      headers: bearer(recruiter.token),
      payload: { relocationEndDate: "2027-01-31", status: "INACTIVE" },
    });
    assert.equal(closed.statusCode, 200);
    assert.equal(closed.json().status, "INACTIVE");
    assert.equal(closed.json().relocationEndDate, "2027-01-31");
  });
});
