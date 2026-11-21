import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

// Deliberately has no `role` or `active`: unknown keys are stripped, so a client cannot
// escalate privileges or self-approve.
export const registerRecruiterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  team: z.string().min(1).max(100).optional(),
  position: z.string().min(1).max(100).optional(),
});

// Same rule as above: no `role` accepted. The relocated person gets an active login right away;
// the profile only exists once they answer the form (POST /relocated/me).
export const registerRelocatedSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});
