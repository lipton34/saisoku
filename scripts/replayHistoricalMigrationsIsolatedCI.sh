#!/usr/bin/env bash
set -euo pipefail

# This is deliberately CI-only. Do NOT run it against an existing database.
[[ "${CI:-}" == "true" ]] || { echo "CI only" >&2; exit 1; }
node --input-type=module <<'JS'
for (const key of ["DATABASE_URL", "DIRECT_DATABASE_URL"]) {
  const raw = process.env[key];
  if (!raw) throw new Error(key + " missing");
  const u = new URL(raw);
  if (u.protocol !== "postgresql:" || !["localhost", "127.0.0.1"].includes(u.hostname) ||
      u.port !== "5432" || u.pathname !== "/saisoku_prisma7_test") {
    throw new Error("Non-disposable DB refused");
  }
}
JS

# Prisma filenames sort differently from the production execution chronology.
# Apply all SQL files manually in the verified dependency order, then register
# their ORIGINAL names/checksums with Prisma. Never rename checked-in migrations.
declare -a migrations=()
for dir in prisma/migrations/*/; do
  [[ -f "${dir}migration.sql" ]] || continue
  migrations+=("${dir%/}")
done
[[ "${#migrations[@]}" -eq 32 ]] || { echo "Expected exactly 32 historical migrations" >&2; exit 1; }

misordered="20260522085705_align_event_occurrence_relations"
found=0
for dir in "${migrations[@]}"; do
  [[ "${dir##*/}" == "$misordered" ]] && found=$((found+1))
done
[[ "$found" -eq 1 ]] || exit 1

declare -a ordered=()
for dir in "${migrations[@]}"; do
  [[ "${dir##*/}" == "$misordered" ]] && continue
  ordered+=("$dir")
  if [[ "${dir##*/}" == "20260522110000_add_event_occurrences" ]]; then
    ordered+=("prisma/migrations/$misordered")
  fi
done
[[ "${#ordered[@]}" -eq 32 ]] || exit 1

for dir in "${ordered[@]}"; do
  name="${dir##*/}"
  echo "Applying SQL and recording original Prisma migration: $name"
  PGPASSWORD=local-test-only psql -h localhost -U postgres -d saisoku_prisma7_test \
    -v ON_ERROR_STOP=1 -f "$dir/migration.sql"
  npx prisma migrate resolve --applied "$name"
done
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
