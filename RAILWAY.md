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
   - Start: `pnpm start`
   - Health check: `/api/healthz`
4. Add these variables to the web service:
   - `DATABASE_URL`: reference the PostgreSQL service's `DATABASE_URL`
   - `SESSION_SECRET`: a long random production secret
5. Deploy the service, then initialize the database schema from a shell with:

   ```sh
   pnpm --filter @workspace/db run push
   ```

Railway supplies `PORT` automatically. `BASE_PATH` is optional and defaults to
`/`. Do not commit a real `.env` file or production credentials.

## Local production check

With `DATABASE_URL` and `SESSION_SECRET` set:

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm start
```

Then check `http://localhost:$PORT/api/healthz`.