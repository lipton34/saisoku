import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../prisma.js";
import { buildDraftScreenshotBucket, buildScreenshotBucket } from "../services/buildImageStorage.js";
import { buildImageReferenceKey, isRecoverableBuildImage, type OrphanCandidate } from "../services/buildImageOrphans.js";

const APPLY = process.argv.includes("--apply");
const HOURS = 48;
const PAGE_SIZE = 100;

/** List every page and folder. Fail closed if the Storage API cannot complete a scan. */
async function scanBucket(
  bucket: string,
  list: (prefix: string, options: { limit: number; offset: number }) => Promise<{ data: Array<{ name: string; id?: string | null; created_at?: string | null }> | null; error: { message: string } | null }>
): Promise<OrphanCandidate[]> {
  const pending = [""];
  const files: OrphanCandidate[] = [];
  while (pending.length) {
    const prefix = pending.shift()!;
    let offset = 0;
    while (true) {
      const { data, error } = await list(prefix, { limit: PAGE_SIZE, offset });
      if (error || !data) throw new Error(`Storage list failed for ${bucket}/${prefix}: ${error?.message ?? "no data"}`);
      for (const entry of data) {
        const path = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (!entry.id) pending.push(path);
        else files.push({ storageBucket: bucket, storagePath: path, createdAt: entry.created_at ?? null });
      }
      if (data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }
  return files;
}

async function referenceSet() {
  const [posts, drafts] = await Promise.all([
    prisma.buildPostImage.findMany({ select: { storageBucket: true, storagePath: true } }),
    prisma.buildDraftImage.findMany({ select: { storageBucket: true, storagePath: true } })
  ]);
  return new Set([...posts, ...drafts].map((ref) => buildImageReferenceKey(ref.storageBucket, ref.storagePath)));
}

async function isStillUnreferenced(candidate: OrphanCandidate) {
  const where = { storageBucket: candidate.storageBucket, storagePath: candidate.storagePath };
  const [posts, drafts] = await Promise.all([
    prisma.buildPostImage.count({ where }),
    prisma.buildDraftImage.count({ where })
  ]);
  return posts === 0 && drafts === 0;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !process.env.DATABASE_URL) throw new Error("DATABASE_URL / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are required");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const publicBucket = buildScreenshotBucket();
  const draftBucket = buildDraftScreenshotBucket();
  if (publicBucket === draftBucket) throw new Error("Public and draft buckets must be different");
  const buckets = [publicBucket, draftBucket];
  const refs = await referenceSet();
  const now = new Date();
  const candidates: OrphanCandidate[] = [];
  for (const bucket of buckets) {
    const { data: settings, error } = await client.storage.getBucket(bucket);
    if (error || !settings) throw new Error(`Could not verify bucket ${bucket}: ${error?.message ?? "not found"}`);
    if (settings.public !== (bucket === publicBucket)) throw new Error(`Unexpected bucket visibility for ${bucket}`);
    const storage = client.storage.from(bucket);
    const entries = await scanBucket(bucket, (prefix, options) => storage.list(prefix, options));
    candidates.push(...entries.filter((entry) => isRecoverableBuildImage(entry, refs, now, HOURS)));
  }

  console.log(`Found ${candidates.length} unreferenced image(s) older than ${HOURS}h; mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  for (const candidate of candidates) {
    console.log(`${candidate.storageBucket}/${candidate.storagePath}`);
    if (!APPLY) continue;
    // Check DB again immediately before each Storage removal to reduce race risk.
    if (!await isStillUnreferenced(candidate)) {
      console.log("Skipped: DB reference appeared");
      continue;
    }
    const { error } = await client.storage.from(candidate.storageBucket).remove([candidate.storagePath]);
    if (error) throw new Error(`Remove failed: ${candidate.storageBucket}/${candidate.storagePath}: ${error.message}`);
    console.log("Removed");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
