export class RecruiterProfile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly team: string | null,
    public readonly position: string | null,
    public readonly active: boolean,
    public readonly createdAt: Date
  ) {}
}
