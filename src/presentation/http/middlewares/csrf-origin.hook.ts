import type { FastifyRequest } from "fastify";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/presentation/http/helpers/auth-cookies.js";
import { ForbiddenError } from "@/shared/errors/app-error.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Second CSRF layer, on top of SameSite=Strict. For state-changing requests that carry our auth
 * cookies (and no Bearer header), a browser-supplied `Origin` must be the API's own origin or one
 * of CORS_ORIGINS. Requests without `Origin` (curl, server-to-server) are not browser CSRF.
 * Register as a global `preHandler` so the cookies have already been parsed.
 */
export function makeCsrfOriginHook(allowedOrigins: string[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (SAFE_METHODS.has(request.method) || request.headers.authorization) return;
    if (!request.cookies?.[ACCESS_COOKIE] && !request.cookies?.[REFRESH_COOKIE]) return;

    const origin = request.headers.origin;
    if (!origin) return;

    const sameOrigin = origin === `${request.protocol}://${request.host}`;
    if (!sameOrigin && !allowedOrigins.includes(origin)) {
      throw new ForbiddenError("Origin not allowed");
    }
  };
}
