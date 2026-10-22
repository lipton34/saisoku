/**
 * One-time operational utility for Issue #14. Default = read-only dry run.
 * Run only from a trusted environment with DATABASE_URL, SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY configured; never expose credentials in CI logs.
 *
 * npx tsx server/scripts/migrateDraftImagesPrivate.ts
 * npx tsx server/scripts/migrateDraftImagesPrivate.ts --apply
 *
 * --apply verifies copied bytes and moves the DB reference, but intentionally
 * does NOT remove the original public object. Removing originals is a separate
 * reviewed production action once access and rollback have been verified.
 */
import "dotenv/config";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../prisma.js";
import { buildDraftScreenshotBucket, buildScreenshotBucket } from "../services/buildImageStorage.js";

const apply = process.argv.includes("--apply");
const publicBucket = buildScreenshotBucket();
const privateBucket = buildDraftScreenshotBucket();

async function main() {
  if (publicBucket === privateBucket) throw new Error("Draft and published image buckets must differ");
  const rows = await prisma.buildDraftImage.findMany({
    where: { storageBucket: publicBucket },
    select: { id: true, storagePath: true, mimeType: true, sizeBytes: true }
  });
  console.log(`Existing public draft records: ${rows.length}; mode: ${apply ? "APPLY" : "DRY RUN"}`);
  if (!apply || rows.length === 0) return;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase Storage credentials missing");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: bucket, error: bucketError } = await client.storage.getBucket(privateBucket);
  if (bucketError || !bucket || bucket.public) {
    throw new Error("Private destination bucket must exist and be non-public before migration");
  }

  for (const row of rows) {
    const source = client.storage.from(publicBucket);
    const destination = client.storage.from(privateBucket);
    const { data: file, error: readError } = await source.download(row.storagePath);
    if (readError || !file) throw new Error(`Source image read failed for record ${row.id}`);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (row.sizeBytes !== null && bytes.length !== row.sizeBytes) {
      throw new Error(`Unexpected source byte size for record ${row.id}`);
    }
    const { error: writeError } = await destination.upload(row.storagePath, bytes, {
      contentType: row.mimeType ?? file.type ?? "application/octet-stream",
      upsert: false
    });
    if (writeError && !/already exists|duplicate/i.test(writeError.message)) {
      throw new Error(`Private copy failed for record ${row.id}: ${writeError.message}`);
    }
    const { data: verifiedFile, error: verifyError } = await destination.download(row.storagePath);
    if (verifyError || !verifiedFile) throw new Error(`Private copy readback failed for record ${row.id}`);
    const checksum = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex");
    if (checksum(bytes) !== checksum(Buffer.from(await verifiedFile.arrayBuffer()))) {
      throw new Error(`Private copy mismatch for record ${row.id}`);
    }

    // Only update if another job/user has not moved this image meanwhile.
    const update = await prisma.buildDraftImage.updateMany({
      where: { id: row.id, storageBucket: publicBucket, storagePath: row.storagePath },
      data: { storageBucket: privateBucket, publicUrl: null }
    });
    if (update.count !== 1) throw new Error(`Record changed during migration: ${row.id}`);
    console.log(`Verified private copy and DB reference: ${row.id}`);
  }

  console.log("All DB references migrated; originals remain publicly readable.");
  console.log("Verify live draft image rendering, then separately delete old public copies.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
