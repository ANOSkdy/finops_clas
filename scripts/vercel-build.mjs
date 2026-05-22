import { execSync } from "node:child_process";

const shouldRunMigrations = process.env.PRISMA_MIGRATE_ON_BUILD === "true";

if (shouldRunMigrations) {
  console.log("[build] PRISMA_MIGRATE_ON_BUILD=true, running prisma migrate deploy...");
  execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
} else {
  console.log("[build] Skipping prisma migrate deploy. Set PRISMA_MIGRATE_ON_BUILD=true to enable.");
}

console.log("[build] Running prisma generate...");
execSync("pnpm prisma generate", { stdio: "inherit" });

console.log("[build] Running next build...");
execSync("pnpm next build", { stdio: "inherit" });
