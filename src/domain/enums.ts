export const ROLES = ["ADMIN", "RECRUITER", "RELOCATED"] as const;
export type Role = (typeof ROLES)[number];

export const SENIORITIES = ["JUNIOR", "MID", "SENIOR", "SPECIALIST"] as const;
export type Seniority = (typeof SENIORITIES)[number];

export const RELOCATION_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type RelocationStatus = (typeof RELOCATION_STATUSES)[number];
