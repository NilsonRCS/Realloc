import { z } from "zod";

export const createRecruiterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  team: z.string().min(1).max(100).optional(),
  position: z.string().min(1).max(100).optional(),
});

export const updateRecruiterSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    team: z.string().min(1).max(100).nullable().optional(),
    position: z.string().min(1).max(100).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" });

export const recruiterIdParamSchema = z.object({ id: z.string().uuid() });

export const listRecruitersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
