import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Prisma CLI uses this config for migrate/introspect/etc.
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // For Prisma Migrate / CLI
    url: env("DATABASE_URL"),
    // For direct connection (recommended when DATABASE_URL points to a pooler)
    directUrl: env("DIRECT_URL"),
    // Optional (only if you explicitly use a separate shadow DB):
    // shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
