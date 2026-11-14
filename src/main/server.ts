import { buildApp } from "./index";
import { getEnv } from "../shared/config/env";

// Load .env when present (local dev). In Docker the variables come from the environment.
try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on process.env
}

async function start(): Promise<void> {
  const env = getEnv();
  const app = buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
