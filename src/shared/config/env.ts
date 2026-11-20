import { z } from "zod";

// Treat empty strings (common in shells and CI) as "not set".
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    USER_REPOSITORY: z.enum(["inmemory", "prisma"]).default("inmemory"),
    DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    JWT_SECRET: z.string().min(16, "JWT_SECRET must have at least 16 characters"),
    // Short-lived access token; the refresh token (below) keeps the session alive.
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
    // Comma-separated browser origins allowed to call the API with cookies (e.g. the Next.js front).
    CORS_ORIGINS: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .optional()
        .transform((value) =>
          (value ?? "")
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
        )
    ),
  })
  .refine((env) => env.USER_REPOSITORY !== "prisma" || Boolean(env.DATABASE_URL), {
    message: "DATABASE_URL is required when USER_REPOSITORY=prisma",
    path: ["DATABASE_URL"],
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Parses process.env on every call so tests can change variables before
 * building the app. Throws with a readable message when something is missing.
 */
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return result.data;
}
