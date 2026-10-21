import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../prisma.js";
import { buildScreenshotBucket } from "../services/buildImageStorage.js";

dotenv.config();

type StorageEntry = { name: string; id?: string | null; updated_at?: string | null; created_at?: string | null };

async function main() {
  const deleteRequested = process.argv.includes("--delete");
  const confirmed = process.argv.includes("--confirm-orphan-cleanup");
  if (deleteRequested && !confirmed) throw new Error("Deletion requires --confirm-orphan-cleanup");
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Storage configuration is required");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = buildScreenshotBucket();
  const [postImages, draftImages] = await Promise.all([
    prisma.buildPostImage.findMany({ select: { storageBucket: true, storagePath: true } }),
    prisma.buildDraftImage.findMany({ select: { storageBucket: true, storagePath: true } })
  ]);
  const referenced = new Set([...postImages, ...draftImages].filter((x) => x.storageBucket === bucket).map((x) => x.storagePath));
  const orphanPaths: string[] = [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const walk = async (prefix: string): Promise<void> => {
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 100, offset });
      if (error) throw new Error("Storage listing failed: " + error.message);
      for (const item of (data ?? []) as StorageEntry[]) {
        const fullPath = prefix ? prefix + "/" + item.name : item.name;
        if (!item.id) {
          await walk(fullPath);
          continue;
        }
        const timestamp = item.updated_at || item.created_at;
        // Missing timestamps are not safe to delete automatically.
        if (!timestamp || !Number.isFinite(Date.parse(timestamp))) continue;
        if (Date.parse(timestamp) < cutoff && !referenced.has(fullPath)) orphanPaths.push(fullPath);
      }
      if ((data ?? []).length < 100) break;
    }
  };
  await walk("posts");
  await walk("drafts");
  console.log(JSON.stringify({ mode: deleteRequested ? "delete" : "dry-run", bucket, candidateCount: orphanPaths.length, paths: orphanPaths }, null, 2));
  if (!deleteRequested) return;
  for (const storagePath of orphanPaths) {
    // Recheck against current DB state to avoid deleting a newly referenced image.
    const [post, draft] = await Promise.all([
      prisma.buildPostImage.count({ where: { storageBucket: bucket, storagePath } }),
      prisma.buildDraftImage.count({ where: { storageBucket: bucket, storagePath } })
    ]);
    if (post || draft) continue;
    const { error } = await client.storage.from(bucket).remove([storagePath]);
    if (error) throw new Error("Failed to delete orphan " + storagePath + ": " + error.message);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
