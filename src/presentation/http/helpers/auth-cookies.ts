import type { FastifyReply } from "fastify";
import type { SessionDto } from "@/application/dtos/auth.dto.js";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// The refresh cookie is only ever sent to the auth routes, never to the rest of the API.
const REFRESH_COOKIE_PATH = "/api/auth";

function baseOptions() {
  return {
    httpOnly: true,
    // Strict: the browser never attaches these cookies to cross-site requests (first CSRF layer).
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setAuthCookies(reply: FastifyReply, session: SessionDto): void {
  reply
    .setCookie(ACCESS_COOKIE, session.accessToken, { ...baseOptions(), path: "/", maxAge: session.expiresIn })
    .setCookie(REFRESH_COOKIE, session.refreshToken, {
      ...baseOptions(),
      path: REFRESH_COOKIE_PATH,
      expires: session.refreshTokenExpiresAt,
    });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply
    .clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: "/" })
    .clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_COOKIE_PATH });
}
