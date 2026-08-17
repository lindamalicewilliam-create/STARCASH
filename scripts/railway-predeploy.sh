#!/usr/bin/env sh
set -eu

pnpm --filter @workspace/db run push

admin_variables=0
[ -n "${ADMIN_EMAIL:-}" ] && admin_variables=$((admin_variables + 1))
[ -n "${ADMIN_USERNAME:-}" ] && admin_variables=$((admin_variables + 1))
[ -n "${ADMIN_PASSWORD:-}" ] && admin_variables=$((admin_variables + 1))

if [ "$admin_variables" -eq 3 ]; then
  pnpm run db:seed
elif [ "$admin_variables" -eq 0 ]; then
  echo "Skipping Super Admin seed: ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD are not set."
  echo "Set all three Railway variables and redeploy, or run pnpm run db:seed manually."
else
  echo "ADMIN_EMAIL, ADMIN_USERNAME, and ADMIN_PASSWORD must be set together." >&2
  exit 1
fi