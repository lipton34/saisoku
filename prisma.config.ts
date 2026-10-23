import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma CLI uses the direct connection for migration operations.
// Keep DATABASE_URL for application runtime (PrismaPg adapter).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL || env("DATABASE_URL"),
  },
});
