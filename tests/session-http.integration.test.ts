import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { sign } from "jsonwebtoken";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { User } from "../src/domain/entities/user.entity.js";
import { makeUserRepository } from "../src/main/factories/repositories/user-repository.factory.js";
import { buildApp } from "../src/main/app.js";
import { adminToken, bearer, PASSWORD } from "./helpers.js";

process.env.USER_REPOSITORY = "inmemory";
process.env.JWT_SECRET = "test-secret-with-16-chars";
process.env.CORS_ORIGINS = "http://localhost:3001";

async function withApp(run: (app: FastifyInstance) => Promise<void>) {
  const app = buildApp();
  await app.ready();
  try {
    await run(app);
  } finally {
    await app.close();
  }
}

const cookie = (res: LightMyRequestResponse, name: string) => res.cookies.find((c) => c.name === name);

async function createAdminUser(app: FastifyInstance) {
  const email = `user.${randomUUID()}@example.com`;
  const created = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: bearer(await adminToken(app)),
    payload: { name: "Cookie User", email, password: PASSWORD },
  });
  assert.equal(created.statusCode, 201);
  return { email, id: created.json().id as string };
}

const doLogin = (app: FastifyInstance, email: string) =>
  app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password: PASSWORD } });

test("login sets httpOnly SameSite=Strict cookies and never returns the refresh token in the body", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const res = await doLogin(app, email);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(Object.keys(res.json()).sort(), ["accessToken", "expiresIn"]);

    const access = cookie(res, "access_token");
    const refresh = cookie(res, "refresh_token");
    assert.ok(access && refresh);
    for (const c of [access, refresh]) {
      assert.equal(c.httpOnly, true);
      assert.equal(c.sameSite, "Strict");
    }
    assert.equal(access.path, "/");
    assert.equal(refresh.path, "/api/auth"); // never sent to the rest of the API
    assert.equal(access.value, res.json().accessToken);
  });
});

test("the access cookie alone authenticates; a garbage cookie does not", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const login = await doLogin(app, email);

    const ok = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      cookies: { access_token: cookie(login, "access_token")!.value },
    });
    assert.equal(ok.statusCode, 200);
    assert.equal(ok.json().email, email);

    const bad = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { access_token: "garbage" } });
    assert.equal(bad.statusCode, 401);
  });
});

test("refresh rotates cookies; replaying the old refresh cookie kills the session", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const login = await doLogin(app, email);
    const oldRefresh = cookie(login, "refresh_token")!.value;

    const refreshed = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { refresh_token: oldRefresh } });
    assert.equal(refreshed.statusCode, 200);
    const newRefresh = cookie(refreshed, "refresh_token")!.value;
    assert.notEqual(newRefresh, oldRefresh);
    assert.equal(typeof refreshed.json().accessToken, "string");

    const replay = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { refresh_token: oldRefresh } });
    assert.equal(replay.statusCode, 401);
    assert.equal(cookie(replay, "refresh_token")?.value, ""); // browser told to drop it

    const descendant = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { refresh_token: newRefresh } });
    assert.equal(descendant.statusCode, 401);

    const none = await app.inject({ method: "POST", url: "/api/auth/refresh" });
    assert.equal(none.statusCode, 401);
  });
});

test("logout clears the cookies and ends the session", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const login = await doLogin(app, email);
    const refreshToken = cookie(login, "refresh_token")!.value;

    const out = await app.inject({ method: "POST", url: "/api/auth/logout", cookies: { refresh_token: refreshToken } });
    assert.equal(out.statusCode, 204);
    assert.equal(cookie(out, "access_token")?.value, "");
    assert.equal(cookie(out, "refresh_token")?.value, "");

    const after = await app.inject({ method: "POST", url: "/api/auth/refresh", cookies: { refresh_token: refreshToken } });
    assert.equal(after.statusCode, 401);
  });
});

test("logout-all needs authentication and ends every session", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const a = await doLogin(app, email);
    const b = await doLogin(app, email);

    assert.equal((await app.inject({ method: "POST", url: "/api/auth/logout-all" })).statusCode, 401);

    const res = await app.inject({ method: "POST", url: "/api/auth/logout-all", headers: bearer(a.json().accessToken) });
    assert.equal(res.statusCode, 204);

    for (const login of [a, b]) {
      const refresh = await app.inject({
        method: "POST",
        url: "/api/auth/refresh",
        cookies: { refresh_token: cookie(login, "refresh_token")!.value },
      });
      assert.equal(refresh.statusCode, 401);
    }
  });
});

test("a role change takes effect on the very next request, with the same token", async () => {
  await withApp(async (app) => {
    const { email, id } = await createAdminUser(app);
    const { accessToken } = (await doLogin(app, email)).json();

    const before = await app.inject({ method: "GET", url: "/api/users", headers: bearer(accessToken) });
    assert.equal(before.statusCode, 200);

    const users = makeUserRepository();
    const current = (await users.findById(id))!;
    await users.update(
      new User(current.id, current.name, current.email, current.passwordHash, "RELOCATED", current.createdAt)
    );

    const after = await app.inject({ method: "GET", url: "/api/users", headers: bearer(accessToken) });
    assert.equal(after.statusCode, 403);
  });
});

test("deactivating a recruiter locks them out immediately, even with a valid access token", async () => {
  await withApp(async (app) => {
    const admin = await adminToken(app);
    const email = `rita.${randomUUID()}@example.com`;
    const created = await app.inject({
      method: "POST",
      url: "/api/recruiters",
      headers: bearer(admin),
      payload: { name: "Rita", email, password: PASSWORD },
    });
    const { accessToken } = (await doLogin(app, email)).json();

    const ok = await app.inject({ method: "GET", url: "/api/recruiters", headers: bearer(accessToken) });
    assert.equal(ok.statusCode, 200);

    await app.inject({
      method: "PATCH",
      url: `/api/recruiters/${created.json().id}`,
      headers: bearer(admin),
      payload: { active: false },
    });

    const blocked = await app.inject({ method: "GET", url: "/api/recruiters", headers: bearer(accessToken) });
    assert.equal(blocked.statusCode, 403);
    assert.equal((await doLogin(app, email)).statusCode, 403);
  });
});

test("CSRF: cookie-authenticated writes from a foreign Origin are rejected", async () => {
  await withApp(async (app) => {
    const { email } = await createAdminUser(app);
    const login = await doLogin(app, email);
    const cookies = {
      access_token: cookie(login, "access_token")!.value,
      refresh_token: cookie(login, "refresh_token")!.value,
    };
    const post = (origin?: string) =>
      app.inject({
        method: "POST",
        url: "/api/auth/logout",
        cookies,
        headers: origin ? { origin } : {},
      });

    assert.equal((await post("https://evil.example")).statusCode, 403);
    assert.equal((await post("http://localhost:3001")).statusCode, 204); // allowed front
    assert.equal((await post()).statusCode, 204); // no Origin: not a browser CSRF
    assert.equal((await post("http://localhost:80")).statusCode, 204); // same origin

    // Bearer requests carry no ambient credentials, so Origin is irrelevant
    const bearerRes = await app.inject({
      method: "POST",
      url: "/api/auth/logout-all",
      headers: { ...bearer(login.json().accessToken), origin: "https://evil.example" },
    });
    assert.notEqual(bearerRes.statusCode, 403);
  });
});

test("CORS: only the configured front origin gets credentials", async () => {
  await withApp(async (app) => {
    const allowed = await app.inject({
      method: "OPTIONS",
      url: "/api/auth/refresh",
      headers: { origin: "http://localhost:3001", "access-control-request-method": "POST" },
    });
    assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:3001");
    assert.equal(allowed.headers["access-control-allow-credentials"], "true");

    const denied = await app.inject({
      method: "OPTIONS",
      url: "/api/auth/refresh",
      headers: { origin: "https://evil.example", "access-control-request-method": "POST" },
    });
    assert.equal(denied.headers["access-control-allow-origin"], undefined);
  });
});

test("a token signed with another secret is rejected", async () => {
  await withApp(async (app) => {
    const { id } = await createAdminUser(app);
    const forged = sign({}, "some-other-secret-1234567", { subject: id, expiresIn: 60 });

    const res = await app.inject({ method: "GET", url: "/api/auth/me", headers: bearer(forged) });
    assert.equal(res.statusCode, 401);
  });
});
