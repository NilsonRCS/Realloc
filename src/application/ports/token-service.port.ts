/**
 * The access token carries only the subject. Role and account status are read from the
 * database on every request, so a role change or a deactivation takes effect immediately.
 */
export interface TokenPayload {
  sub: string;
}

export interface TokenServicePort {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload | null;
}
