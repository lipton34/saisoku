import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";

// Run ONLY with DATABASE_URL pointing to a disposable PostgreSQL database.
// This creates and removes one temporary user and exercises Prisma 7 operations.
async function main() {
  if (process.env.CI !== "true" || !process.env.DATABASE_URL?.includes("saisoku_prisma7_test")) {
    throw new Error("Refusing database writes outside the named isolated CI database.");
  }

  const id = randomUUID();
  const username = `prisma7-ci-${id}`;
  try {
    const created = await prisma.user.create({
      data: { username, passwordHash: "isolated-test-not-a-real-password" },
    });
    assert.equal(created.username, username);

    const found = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
    assert.equal(found.id, created.id);

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: created.id },
        data: { displayName: "Prisma 7 verified" },
      });
      return tx.user.findUniqueOrThrow({ where: { id: created.id } });
    });
    assert.equal(result.displayName, "Prisma 7 verified");
    console.log("Prisma 7 isolated CRUD and interactive transaction: PASS");
  } finally {
    await prisma.user.deleteMany({ where: { username } });
    const count = await prisma.user.count({ where: { username } });
    assert.equal(count, 0, "Temporary test row cleanup failed");
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
