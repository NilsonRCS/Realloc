-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECRUITER', 'RELOCATED');
CREATE TYPE "Seniority" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'SPECIALIST');
CREATE TYPE "RelocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- Rename "User" -> users (snake_case), keeping existing rows
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "users" RENAME COLUMN "passwordHash" TO "password_hash";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";

-- Existing users predate roles: they become ADMIN (the only role that needs no profile)
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'ADMIN';
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "recruiter_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team" TEXT,
    "position" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relocated_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "responsible_recruiter_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seniority" "Seniority" NOT NULL,
    "description" TEXT,
    "relocation_start_date" DATE NOT NULL,
    "relocation_end_date" DATE,
    "status" "RelocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relocated_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_profiles_user_id_key" ON "recruiter_profiles"("user_id");
CREATE UNIQUE INDEX "relocated_profiles_user_id_key" ON "relocated_profiles"("user_id");
CREATE INDEX "relocated_profiles_responsible_recruiter_id_idx" ON "relocated_profiles"("responsible_recruiter_id");
CREATE INDEX "relocated_profiles_status_idx" ON "relocated_profiles"("status");

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relocated_profiles" ADD CONSTRAINT "relocated_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relocated_profiles" ADD CONSTRAINT "relocated_profiles_responsible_recruiter_id_fkey" FOREIGN KEY ("responsible_recruiter_id") REFERENCES "recruiter_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
