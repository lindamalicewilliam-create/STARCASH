---
name: StarCash database seeding
description: How to seed the StarCash database with admin user and coupons
---

# StarCash Database Seeding

The database starts empty after `pnpm --filter @workspace/db run push`. A seed script exists at `scripts/seed.mjs`.

Run with: `node scripts/seed.mjs`

**Why:** There is no Drizzle seed command configured, and the app requires an admin user + valid coupons to function at all (registration requires a coupon; admin login requires the seeded user).

**How to apply:** Run after any fresh schema push or if the database is wiped. The script uses ON CONFLICT DO NOTHING so it is safe to re-run.

Seeds:
- Admin: `admin@starcash.com` / `password123`
- Coupons: `WELCOME001`–`WELCOME005`, `PROMO2026A`–`PROMO2026C`, `TESTCOUPON`
