export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    /** Every token descended from one login shares a family. */
    public readonly familyId: string,
    /** SHA-256 of the opaque token; the raw token is never stored. */
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
    public readonly createdAt: Date
  ) {}
}
