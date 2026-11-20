export interface LoginInputDto {
  email: string;
  password: string;
}

/** What the use cases hand to the HTTP layer; the refresh token goes out only as a cookie. */
export interface SessionDto {
  accessToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}
