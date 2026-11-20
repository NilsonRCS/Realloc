import { sign, verify } from "jsonwebtoken";
import type { TokenPayload, TokenServicePort } from "@/application/ports/token-service.port.js";

export class JwtTokenService implements TokenServicePort {
  constructor(
    private readonly secret: string,
    private readonly expiresInSeconds: number
  ) {}

  sign(payload: TokenPayload): string {
    return sign({}, this.secret, { algorithm: "HS256", subject: payload.sub, expiresIn: this.expiresInSeconds });
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = verify(token, this.secret, { algorithms: ["HS256"] });
      if (typeof decoded === "string" || typeof decoded.sub !== "string") {
        return null;
      }
      return { sub: decoded.sub };
    } catch {
      return null;
    }
  }
}
