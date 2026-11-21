import { z } from "zod";
import { RELOCATION_STATUSES, SENIORITIES } from "@/domain/enums.js";

const dateOnly = z.iso.date();

export const createRelocatedSchema = z.object({
  name: z.string().min(2).max(100),
  seniority: z.enum(SENIORITIES),
  description: z.string().max(2000).optional(),
  relocationStartDate: dateOnly,
  responsibleRecruiterId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
});

export const updateRelocatedSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    seniority: z.enum(SENIORITIES).optional(),
    description: z.string().max(2000).nullable().optional(),
    relocationEndDate: dateOnly.nullable().optional(),
    status: z.enum(RELOCATION_STATUSES).optional(),
    responsibleRecruiterId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const relocatedIdParamSchema = z.object({ id: z.string().uuid() });

export const listRelocatedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(RELOCATION_STATUSES).optional(),
});

export const submitRelocatedFormSchema = z.object({
  seniority: z.enum(SENIORITIES),
  description: z.string().max(2000).optional(),
  relocationStartDate: dateOnly,
  responsibleRecruiterId: z.string().uuid(),
});
