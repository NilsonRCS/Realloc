import type { RecruiterWithUser } from "@/domain/ports/recruiter-repository.port.js";

export interface RecruiterResponseDto {
  id: string;
  userId: string;
  name: string;
  email: string;
  team: string | null;
  position: string | null;
  active: boolean;
  createdAt: Date;
}

export interface CreateRecruiterInputDto {
  name: string;
  email: string;
  password: string;
  team?: string;
  position?: string;
}

export interface UpdateRecruiterInputDto {
  name?: string;
  team?: string | null;
  position?: string | null;
  active?: boolean;
}

export interface ListRecruitersOutputDto {
  recruiters: RecruiterResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export function toRecruiterResponse({ user, profile }: RecruiterWithUser): RecruiterResponseDto {
  return {
    id: profile.id,
    userId: user.id,
    name: user.name.value,
    email: user.email.value,
    team: profile.team,
    position: profile.position,
    active: profile.active,
    createdAt: profile.createdAt,
  };
}
