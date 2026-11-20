import { CreateUserUseCase } from "@/application/use-cases/user/create-user.use-case.js";
import { makeUserRepository } from "@/main/factories/repositories/user-repository.factory.js";

// Creates the first ADMIN (there is no public sign-up). Idempotent: does nothing if it exists.
try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on process.env
}

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME).");
  process.exit(1);
}

async function main(email: string, password: string): Promise<void> {
  const repository = makeUserRepository();

  if (await repository.findByEmail(email.trim().toLowerCase())) {
    console.log(`Admin ${email} already exists — nothing to do.`);
  } else {
    await new CreateUserUseCase(repository).execute({ name, email, password, role: "ADMIN" });
    console.log(`Admin ${email} created.`);
  }
}

main(email, password).then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
