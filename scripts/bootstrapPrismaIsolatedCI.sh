#!/usr/bin/env bash
set -euo pipefail

# Deliberately restricted to disposable GitHub Actions PostgreSQL.
# NEVER use this script with a Supabase, Render, or other shared database.
if [[ "${CI:-}" != "true" ]]; then
  echo "Refusing bootstrap outside CI." >&2
  exit 1
fi

node --input-type=module <<'JS'
const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Disposable database URL is missing.");
const target = new URL(url);
if (
  target.protocol !== "postgresql:" ||
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  target.port !== "5432" ||
  target.pathname !== "/saisoku_prisma7_test"
) {
  throw new Error("Refusing bootstrap: only local disposable saisoku_prisma7_test is allowed.");
}
JS

echo "Initializing current Prisma schema in disposable PostgreSQL 17..."
npx prisma db push

count=0
for dir in prisma/migrations/*/; do
  [[ -f "${dir}migration.sql" ]] || continue
  npx prisma migrate resolve --applied "$(basename "$dir")"
  count=$((count + 1))
done
echo "Recorded $count historical migration entries as baselined in disposable DB."

# A future deploy must work from this known baseline without replaying legacy SQL.
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
