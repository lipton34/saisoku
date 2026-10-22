export type OrphanCandidate = {
  storageBucket: string;
  storagePath: string;
  createdAt: string | null;
};
export function buildImageReferenceKey(bucket: string, path: string): string {
  return JSON.stringify([bucket, path]);
}
/** Only inspect app-owned paths; never infer ownership of other Storage objects. */
export function isRecoverableBuildImage(candidate: OrphanCandidate, referenced: Set<string>, now: Date, minAgeHours = 48): boolean {
  if (!/^(posts|drafts)\/[^/]+\/[^/]+\.(png|jpe?g|webp)$/i.test(candidate.storagePath)) return false;
  if (!candidate.createdAt) return false; // never delete files with unknown age
  const created = Date.parse(candidate.createdAt);
  if (!Number.isFinite(created)) return false;
  if (created > now.getTime() - minAgeHours * 60 * 60 * 1000) return false;
  return !referenced.has(buildImageReferenceKey(candidate.storageBucket, candidate.storagePath));
}
