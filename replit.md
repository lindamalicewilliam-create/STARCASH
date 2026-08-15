# StarCash

An affiliate earning web platform where users earn referral commissions by inviting new members using unique referral links.

## Run & Operate

- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run the API server
- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/starcash run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm run build && pnpm start` — build and run the combined production server used by Railway
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken) + bcryptjs
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle schema: users, coupons, transactions, withdrawals, referrals
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/starcash/src/` — React frontend

## Architecture decisions

- JWT stored in localStorage as `starcash_token`; custom-fetch in api-client-react adds `Authorization: Bearer <token>` header automatically
- Welcome bonus ($1) auto-credited on registration; referral bonus ($3) credited to referrer on referred user activation
- Every new user requires a valid activation coupon code
- Minimum withdrawal threshold is $6; requests stay pending until admin approves
- Super admin accounts are created by running `ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... node scripts/seed.mjs`; credentials are never stored in the repository.
- Test coupons seeded: `welcome@001`, `welcome#002`, `welcome$003`, `welcome!004`, `welcome*005`, `promo@2026a`, `promo#2026b`, `promo$2026c`, `test*coupon1`

## Product

- **User side**: Register with coupon, get $1 welcome bonus, share referral link, earn $3 per successful referral, view dashboard with wallet stats, submit withdrawals
- **Admin side**: Full user management (suspend/activate/delete/edit), coupon management (create/bulk generate/disable), withdrawal approval workflow, platform-wide analytics

## Railway deployment

- Railway deploys the repository root as one web service using `railway.json`.
- The production API serves the compiled frontend and `/api/*` from the same origin.
- Set `DATABASE_URL` from a Railway PostgreSQL service and a strong `SESSION_SECRET`.
- See `RAILWAY.md` for the deployment steps and schema initialization command.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any `lib/*` schema change, run `pnpm run typecheck:libs` before running api-server typecheck
- After changing `lib/api-spec/openapi.yaml`, always re-run codegen before using new types
- bcrypt has native build issues on this platform — use `bcryptjs` instead
- OpenAPI `format: email` causes Orval to emit `zod.email()` which fails typecheck — omit email format in the spec

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
