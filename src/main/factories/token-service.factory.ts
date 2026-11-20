import type { TokenServicePort } from "@/application/ports/token-service.port.js";
import { JwtTokenService } from "@/infrastructure/security/jwt-token.service.js";
import { getEnv } from "@/shared/config/env.js";

export function makeTokenService(): TokenServicePort {
  const env = getEnv();
  return new JwtTokenService(env.JWT_SECRET, env.ACCESS_TOKEN_TTL_SECONDS);
}
