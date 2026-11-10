# MelitoFut

A WhatsApp bot that manages attendance for amateur soccer matches. See `docs/architecture.md` for the design and `specs/` for the approved specifications.

Stack: Next.js (route handlers and dashboard) on Vercel, Supabase (Postgres, Auth), and the official WhatsApp Cloud API.

## Development

```bash
pnpm install
pnpm dev          # start the dev server
pnpm lint         # Biome
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (+ MSW for HTTP mocking)
pnpm build        # production build
```

Copy `.env.example` to `.env.local` and fill in values for local development. `.env*` files are git-ignored, except `.env.example`.

## Environment variables

Names only. Real values are stored in Vercel environment variables, never in the repository.

| Variable | Required | When checked | Purpose |
|---|---|---|---|
| `WA_ACCESS_TOKEN` | yes | at boot | WhatsApp Cloud API access token |
| `PHONE_NUMBER_ID` | yes | where used | WhatsApp sender phone number ID |
| `SUPABASE_URL` | yes | where used | Supabase project URL (server only) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | where used | Supabase service role key (server only) |
| `WA_CUSTOMER_WINDOW_MINUTES` | no | where used | Customer-service window length in minutes (default 1440) |

A missing `WA_ACCESS_TOKEN` stops the server at startup. Other variables fail with a named error only when the code that needs them runs.

## Workflow

1. Open a pull request to `main`. CI runs lint, typecheck, tests and build. The PR cannot merge unless they pass.
2. Merging to `main` runs CI again. If it passes, the deploy job triggers a production deployment on Vercel.
3. Pull requests to other branches never deploy to production.

### Manual setup (one-time)

These settings live outside the repository and cannot be checked by automated tests:

- **Vercel:** turn off automatic production deployments, so that only the CI deploy job triggers them.
- **GitHub branch protection on `main`:** require the `check` job to pass before merging.
- **GitHub Actions secret:** add `VERCEL_DEPLOY_HOOK_URL` with the deploy hook URL from the Vercel project settings.

## Testing conventions

- Tests live in `tests/` and run with Vitest. WhatsApp HTTP calls are mocked with MSW; unhandled requests fail the test.
- Assertions follow the golden rule of assertions: compare the whole actual value to the whole expected value, not individual fields. See https://www.epicweb.dev/the-golden-rule-of-assertions.
- Every acceptance criterion in `specs/*/spec.md` needs at least one test.
