import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/main/app.js";
import { adminToken, bearer } from "./helpers.js";

test("POST /api/auth/login returns access token", async () => {
  process.env.USER_REPOSITORY = "inmemory";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const app = buildApp();
  await app.ready();

  try {
    const create = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: bearer(await adminToken(app)),
      payload: {
        name: "Http Auth",
        email: "http.auth@example.com",
        password: "secret123",
      },
    });

    assert.equal(create.statusCode, 201);

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "http.auth@example.com",
        password: "secret123",
      },
    });

    assert.equal(login.statusCode, 200);
    const body = login.json();
    assert.equal(typeof body.accessToken, "string");
    assert.equal(body.accessToken.length > 0, true);
  } finally {
    await app.close();
  }
});

test("GET /api/auth/me returns current user with bearer token", async () => {
  process.env.USER_REPOSITORY = "inmemory";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const app = buildApp();
  await app.ready();

  try {
    const create = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: bearer(await adminToken(app)),
      payload: {
        name: "Http Me",
        email: "http.me@example.com",
        password: "secret123",
      },
    });

    assert.equal(create.statusCode, 201);

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "http.me@example.com",
        password: "secret123",
      },
    });

    assert.equal(login.statusCode, 200);
    const loginBody = login.json();

    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    assert.equal(me.statusCode, 200);
    const meBody = me.json();
    assert.equal(meBody.email, "http.me@example.com");
  } finally {
    await app.close();
  }
});

test("GET /api/auth/me returns 401 without bearer token", async () => {
  process.env.USER_REPOSITORY = "inmemory";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const app = buildApp();
  await app.ready();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    assert.equal(response.statusCode, 401);
  } finally {
    await app.close();
  }
});

test("GET /api/users returns 401 without bearer token", async () => {
  process.env.USER_REPOSITORY = "inmemory";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const app = buildApp();
  await app.ready();

  try {
    const response = await app.inject({ method: "GET", url: "/api/users" });
    assert.equal(response.statusCode, 401);
  } finally {
    await app.close();
  }
});

test("GET /api/users returns 200 with valid bearer token", async () => {
  process.env.USER_REPOSITORY = "inmemory";
  process.env.JWT_SECRET = "test-secret-with-16-chars";

  const app = buildApp();
  await app.ready();

  try {
    await app.inject({
      method: "POST",
      url: "/api/users",
      headers: bearer(await adminToken(app)),
      payload: { name: "List User", email: "list.user@example.com", password: "secret123" },
    });

    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "list.user@example.com", password: "secret123" },
    });

    const { accessToken } = login.json();

    const response = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().total >= 1, true);
  } finally {
    await app.close();
  }
});
