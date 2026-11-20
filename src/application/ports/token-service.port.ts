import type { Role } from "@/domain/enums.js";

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface TokenServicePort {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
