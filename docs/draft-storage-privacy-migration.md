# Issue #14: Draft image Storage privacy migration

## What this change does
- Newly uploaded draft images are stored in a **private** Supabase Storage bucket: `SUPABASE_BUILD_DRAFT_BUCKET`, or `SUPABASE_BUILD_SCREENSHOT_BUCKET + "-drafts"` when unset.
- The existing published-image bucket remains public.
- Draft endpoints generate 1-hour signed URLs **only after checking draft ownership**.
- Publishing a draft copies private image bytes into the public post bucket.
- A public draft bucket is explicitly rejected if configured as the private draft bucket.

## Existing images remain exposed until migrated
The database contains stored `storageBucket` and `storagePath` values. Existing draft images located in the old public bucket are still publicly accessible via previously known public links. Returning a signed URL in new API responses **does not revoke those public URLs**. Do not claim the entire security issue is resolved until those objects have been migrated and old copies removed.

## Production rollout and migration checklist
1. Confirm the private bucket name differs from the published-images bucket. Do not set `SUPABASE_BUILD_DRAFT_BUCKET` to the existing public bucket.
2. Confirm/prepare a private bucket (no anonymous public reads) and that the service-role credentials are server-side only. The application attempts to create the private bucket on first draft upload, and rejects a bucket with the wrong visibility.
3. Deploy the application code, verify new draft upload, owned draft edit/list view, and publish-to-public-image flow.
4. Inventory existing `BuildDraftImage` rows whose `storageBucket` identifies the old public bucket. For each row: **copy object bytes** into the private draft bucket at the appropriate path, **verify destination accessibility and content**, update the associated database bucket reference, recheck authenticated draft visibility, and **only then remove the public object**. Implement this as an audited, retryable migration with resumability and rollback/backup; do not perform blind bulk deletion.
5. Validate that old public object URLs now fail, newly generated signed URLs expire, unrelated users cannot fetch the draft API, and published post images still load.
6. Recheck all environments' bucket access settings and live status. Do not close Issue #14 until migration and production verification are complete.

## Follow-up limitation
Signed URLs have a one-hour lifetime. Drafts left open in the browser longer than that may need a reload to obtain fresh links. An authenticated image streaming route would avoid expiring client URLs but requires separate design and tests.


## Auditable one-time helper

From a trusted deployment environment that has the same database and service-role credentials as production:

```bash
npx tsx server/scripts/migrateDraftImagesPrivate.ts
npx tsx server/scripts/migrateDraftImagesPrivate.ts --apply
```

The default command is read-only. `--apply` requires the destination private bucket to **already exist**, verifies the downloaded source size and copied SHA-256 bytes, then updates the row's bucket reference only when it still points to the public source. It intentionally **does not delete the old public object**. After verifying the live site and backups, separately remove the known original object paths. Re-run the dry run to verify zero public draft DB references, and separately audit the storage bucket for leftover public `drafts/` objects. Do not use `--apply` before private-bucket creation and Render readiness checks.
