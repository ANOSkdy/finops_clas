import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Prisma CLI uses this config for migrate/introspect/etc.
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // For Prisma Migrate / CLI
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/finops_clas",
    // Optional (only if you explicitly use a separate shadow DB):
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
