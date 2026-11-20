import type { Role } from "@/domain/enums.js";

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface CreateUserInputDto {
  name: string;
  email: string;
  password: string;
  /** Defaults to ADMIN: recruiters and relocated people are created through their own use cases. */
  role?: Role;
}

export interface UpdateUserInputDto {
  name?: string;
  email?: string;
}

export interface ListUsersInputDto {
  page: number;
  limit: number;
}

export interface ListUsersOutputDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
}
