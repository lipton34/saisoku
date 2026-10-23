import "dotenv/config";
import { defineConfig } from "prisma/config";

// Generating the client does not require a database connection.
// For migration commands set DIRECT_DATABASE_URL (preferred) or DATABASE_URL.
const migrationUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
