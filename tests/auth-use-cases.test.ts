import assert from "node:assert/strict";
import test from "node:test";
import { RefreshToken } from "../src/domain/entities/refresh-token.entity.js";
import { hashRefreshToken } from "../src/shared/security/refresh-token.js";
import { SessionService } from "../src/application/services/session.service.js";
import { CreateUserUseCase } from "../src/application/use-cases/user/create-user.use-case.js";
import { CreateRecruiterUseCase } from "../src/application/use-cases/recruiter/create-recruiter.use-case.js";
import { UpdateRecruiterUseCase } from "../src/application/use-cases/recruiter/update-recruiter.use-case.js";
import { LoginUseCase } from "../src/application/use-cases/auth/login.use-case.js";
import { LogoutAllUseCase } from "../src/application/use-cases/auth/logout-all.use-case.js";
import { LogoutUseCase } from "../src/application/use-cases/auth/logout.use-case.js";
import { GetCurrentUserUseCase } from "../src/application/use-cases/auth/me.use-case.js";
import { RefreshUseCase } from "../src/application/use-cases/auth/refresh.use-case.js";
import { InMemoryRecruiterRepository } from "../src/infrastructure/repositories/in-memory-recruiter.repository.js";
import { InMemoryRefreshTokenRepository } from "../src/infrastructure/repositories/in-memory-refresh-token.repository.js";
import { InMemoryUserRepository } from "../src/infrastructure/repositories/in-memory-user.repository.js";
import { AppError } from "../src/shared/errors/app-error.js";
import type { TokenPayload, TokenServicePort } from "../src/application/ports/token-service.port.js";

class FakeTokenService implements TokenServicePort {
  sign(payload: TokenPayload): string {
    return `token:${payload.sub}`;
  }

  verify(token: string): TokenPayload | null {
    const [prefix, sub] = token.split(":");
    return prefix === "token" && sub ? { sub } : null;
  }
}

function setup(refreshTokenTtlDays = 7) {
  const userRepository = new InMemoryUserRepository();
  const recruiterRepository = new InMemoryRecruiterRepository(userRepository);
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const sessionService = new SessionService(new FakeTokenService(), refreshTokenRepository, {
    accessTokenTtlSeconds: 900,
    refreshTokenTtlDays,
  });

  return {
    userRepository,
    recruiterRepository,
    refreshTokenRepository,
    createUser: new CreateUserUseCase(userRepository),
    login: new LoginUseCase(userRepository, recruiterRepository, sessionService),
    refresh: new RefreshUseCase(refreshTokenRepository, userRepository, recruiterRepository, sessionService),
    logout: new LogoutUseCase(refreshTokenRepository),
    logoutAll: new LogoutAllUseCase(refreshTokenRepository),
  };
}

const unauthorized = (error: unknown) => error instanceof AppError && error.statusCode === 401;
const forbidden = (error: unknown) => error instanceof AppError && error.statusCode === 403;

test("login returns access token and a refresh token with valid credentials", async () => {
  const { createUser, login } = setup();
  const created = await createUser.execute({ name: "Auth User", email: "auth@example.com", password: "secret123" });

  const session = await login.execute({ email: "auth@example.com", password: "secret123" });

  assert.equal(session.accessToken, `token:${created.id}`);
  assert.equal(session.expiresIn, 900);
  assert.equal(session.refreshToken.length >= 64, true);
  assert.equal(session.refreshTokenExpiresAt > new Date(), true);
});

test("login rejects invalid credentials", async () => {
  const { createUser, login } = setup();
  await createUser.execute({ name: "Auth User", email: "auth@example.com", password: "secret123" });

  await assert.rejects(() => login.execute({ email: "auth@example.com", password: "wrong-password" }), unauthorized);
});

test("refresh rotates the token: the old one stops working", async () => {
  const { createUser, login, refresh } = setup();
  await createUser.execute({ name: "Rot", email: "rot@example.com", password: "secret123" });
  const first = await login.execute({ email: "rot@example.com", password: "secret123" });

  const second = await refresh.execute(first.refreshToken);
  assert.notEqual(second.refreshToken, first.refreshToken);

  const third = await refresh.execute(second.refreshToken);
  assert.equal(typeof third.accessToken, "string");
});

test("reusing a rotated refresh token revokes the whole family", async () => {
  const { createUser, login, refresh } = setup();
  await createUser.execute({ name: "Theft", email: "theft@example.com", password: "secret123" });
  const first = await login.execute({ email: "theft@example.com", password: "secret123" });
  const second = await refresh.execute(first.refreshToken);

  // an attacker (or a buggy client) replays the first token...
  await assert.rejects(() => refresh.execute(first.refreshToken), unauthorized);
  // ...so the legitimate descendant is dead too
  await assert.rejects(() => refresh.execute(second.refreshToken), unauthorized);
});

test("a separate login is a separate family and survives", async () => {
  const { createUser, login, refresh } = setup();
  await createUser.execute({ name: "Two", email: "two@example.com", password: "secret123" });
  const phone = await login.execute({ email: "two@example.com", password: "secret123" });
  const laptop = await login.execute({ email: "two@example.com", password: "secret123" });

  await refresh.execute(phone.refreshToken);
  await assert.rejects(() => refresh.execute(phone.refreshToken), unauthorized);
  await refresh.execute(laptop.refreshToken);
});

test("refresh rejects unknown and expired tokens", async () => {
  const { createUser, refreshTokenRepository, refresh } = setup();
  const created = await createUser.execute({ name: "Exp", email: "exp@example.com", password: "secret123" });

  await assert.rejects(() => refresh.execute("nope"), unauthorized);

  const past = new Date(Date.now() - 1000);
  await refreshTokenRepository.create(
    new RefreshToken("id-1", created.id, "family-1", hashRefreshToken("expired-token"), past, null, past)
  );
  await assert.rejects(() => refresh.execute("expired-token"), unauthorized);
});

test("logout revokes the session; logout-all revokes every session", async () => {
  const { createUser, login, refresh, logout, logoutAll } = setup();
  const created = await createUser.execute({ name: "Out", email: "out@example.com", password: "secret123" });
  const a = await login.execute({ email: "out@example.com", password: "secret123" });
  const b = await login.execute({ email: "out@example.com", password: "secret123" });

  await logout.execute(a.refreshToken);
  await assert.rejects(() => refresh.execute(a.refreshToken), unauthorized);
  await logout.execute(undefined); // idempotent
  await logout.execute("unknown");

  await logoutAll.execute(created.id);
  await assert.rejects(() => refresh.execute(b.refreshToken), unauthorized);
});

test("a deactivated recruiter can neither log in nor refresh", async () => {
  const { userRepository, recruiterRepository, login, refresh } = setup();
  const recruiter = await new CreateRecruiterUseCase(userRepository, recruiterRepository).execute({
    name: "Rita",
    email: "rita@example.com",
    password: "secret123",
  });

  const session = await login.execute({ email: "rita@example.com", password: "secret123" });
  await new UpdateRecruiterUseCase(recruiterRepository).execute(recruiter.id, { active: false });

  await assert.rejects(() => refresh.execute(session.refreshToken), forbidden);
  await assert.rejects(() => login.execute({ email: "rita@example.com", password: "secret123" }), forbidden);
});

test("me returns current user by id", async () => {
  const repository = new InMemoryUserRepository();
  const createUser = new CreateUserUseCase(repository);
  const meUseCase = new GetCurrentUserUseCase(repository);

  const created = await createUser.execute({
    name: "Current User",
    email: "me@example.com",
    password: "secret123",
  });

  const result = await meUseCase.execute(created.id);

  assert.equal(result.id, created.id);
  assert.equal(result.email, "me@example.com");
});

test("me rejects unknown id with 401", async () => {
  const repository = new InMemoryUserRepository();
  const meUseCase = new GetCurrentUserUseCase(repository);

  await assert.rejects(
    () => meUseCase.execute("non-existent-id"),
    (error: unknown) => error instanceof AppError && error.statusCode === 401
  );
});
