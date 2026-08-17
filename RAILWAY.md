# Railway deployment

StarCash is configured to deploy as one Railway web service. The production API
serves both `/api/*` and the compiled React app, so the frontend and API share
one public origin.

## Create the service

1. Create a Railway project and add a PostgreSQL service.
2. Add this repository as a service using the repository root as its root
   directory.
3. Railway will use `railway.json`:
   - Build: `pnpm run build`
   - Start: `NODE_ENV=production pnpm start`
   - Health check: `/api/healthz`
4. Add these variables to the web service:
   - `DATABASE_URL`: reference the PostgreSQL service's `DATABASE_URL`
   - `SESSION_SECRET`: a long random production secret
5. Deploy the service, then initialize the database schema from a shell with:

   ```sh
   pnpm --filter @workspace/db run push
   ```

The repository's Railway pre-deploy command runs the schema push automatically.
It also runs the idempotent seed script when all three of these variables are
set on the Railway web service:

- `DATABASE_URL`: reference the PostgreSQL service's `DATABASE_URL`
- `SESSION_SECRET`: a strong random value with at least 32 characters
- `ADMIN_EMAIL`: the Super Admin email to use in both environments
- `ADMIN_USERNAME`: the Super Admin username
- `ADMIN_PASSWORD`: the matching Super Admin password

If the `ADMIN_*` variables are not set, the deployment continues after the
schema push and logs that the Super Admin seed was skipped. Set all three
variables and redeploy, or run the seed command manually from a Railway shell.
Partial `ADMIN_*` configuration still fails the pre-deploy step so a typo does
not result in an unusable admin account.

The seed script creates or updates that Super Admin and inserts the initial
coupons without storing credentials in the repository. This is what makes the
same explicitly configured admin credentials available in the Railway database;
Replit Preview and Railway use separate databases and cannot share users unless
the account is seeded/configured in both.

Railway supplies `PORT` automatically. `BASE_PATH` is optional and defaults to
`/`. The combined service is same-origin, so `CORS_ORIGINS` can remain unset.
Set it to a comma-separated allowlist only when a separately hosted frontend or
trusted API client must call the API. Set `PUBLIC_APP_URL` when referral links
must use a custom domain. Do not commit a real `.env` file or production
credentials.

## Local production check

With `DATABASE_URL`, `SESSION_SECRET`, and the admin variables set:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Then check `http://localhost:$PORT/api/healthz`. The health check also verifies
database connectivity, so a deployment with a missing or unreachable Railway
database fails health checks instead of appearing healthy while login is broken.