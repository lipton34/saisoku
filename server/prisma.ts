import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// Prisma ORM 7 uses the PostgreSQL driver adapter instead of a Rust query engine.
// Keep runtime and migration connection URLs independent.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 5_000,
});

export const prisma = new PrismaClient({ adapter });
