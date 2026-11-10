# FUT-02 · Tasks: Base repository

> Sources: `spec.md` (approved), `plan.md`, `specs/constitution.md`.
> Each task is one commit. Order: types and setup → failing tests → implementation → deployment → closing.
> FUT-02 has no migrations (FUT-03 creates the schema), so the first phase covers types and setup only.
> Criterion numbers match `plan.md` §10 (AC1–AC12).

## Phase 1 · Types and setup

### [x] T1 · Install dependencies and scripts
- **Covers:** criterion 12 (test infrastructure)
- **Work:** add runtime dependencies `zod`, `server-only`, `@supabase/supabase-js`; dev dependencies `vitest`, `msw`, `yaml`. Add scripts `test` (`vitest run`, without `passWithNoTests`) and `typecheck` (`tsc --noEmit`). Update `pnpm-lock.yaml`.
- **Verifies:** `pnpm install --frozen-lockfile` succeeds; `pnpm typecheck` passes; `pnpm test` fails with "no test files found" (expected until T4).

### [x] T2 · Vitest config and support files
- **Covers:** criterion 12
- **Work:** create `vitest.config.ts` (`@/*` alias; `server-only` aliased to a no-op module), `tests/setup/server-only.ts`, and `tests/setup/msw.ts` (MSW server lifecycle, with unhandled requests reported as errors).
- **Verifies:** `pnpm typecheck` passes; `pnpm test` still fails only because no tests exist yet.

### [x] T3 · Shared WhatsApp types
- **Covers:** criterion 6 (typed results)
- **Work:** create `src/lib/whatsapp/types.ts` (`Result`, `SendTemplateInput`, `SendTextInput`, `SendResult`, template component types) and `src/lib/whatsapp/errors.ts` (type `WhatsAppError` with `kind` and `retryable` only; no logic).
- **Verifies:** `pnpm typecheck` passes under `strict`.

## Phase 2 · Failing tests

### [x] T4 · Repository configuration tests
- **Covers:** criteria 1, 2, 3, 4
- **Work:** create `tests/config/workflow.test.ts` (parses `.github/workflows/ci.yml` with `yaml`: `check` job runs on `pull_request` and `push` to `main`; `deploy` job runs only on `push` to `main` and has `needs: check`), `tests/config/package.test.ts` (the `test` script does not contain `passWithNoTests`), and `tests/config/constitution.test.ts` (`specs/constitution.md` contains `## 7. Spec Template`).
- **Verifies:** the workflow test fails because `ci.yml` does not exist yet; the package test passes or fails depending on T1. The constitution test passes immediately because the file already exists. That is correct and noted here.

### [x] T5 · Environment variable tests
- **Covers:** criteria 8, 9, 10, 11
- **Work:** create `tests/env/boot.test.ts` (boot fails when `WA_ACCESS_TOKEN` is missing, passes when it is set); `tests/env/lazy.test.ts` (missing `SUPABASE_URL` or other secrets throw an error naming the variable when used, not at boot); `tests/env/window-minutes.test.ts` (unset → 1440; `"1440"` → 1440; `"0"`, `"-5"`, `"1.5"`, `"abc"` → error).
- **Verifies:** all three fail because `src/lib/env.ts` does not exist.

### [x] T6 · E.164 validation tests
- **Covers:** criterion 6 (edge case: invalid phone)
- **Work:** create `tests/whatsapp/phone.test.ts`. Accept `+573001234567`. Reject `300 123 4567`, `3001234567`, `+0123`, `+57 300…`, and empty input.
- **Verifies:** fails because `phone.ts` does not exist.

### [x] T7 · Window countdown tests
- **Covers:** criteria 7, 10
- **Work:** create `tests/whatsapp/window.test.ts`: open before the limit; closed exactly at `lastInboundAt + windowMinutes`; `lastInboundAt: null` → closed; `remainingMs` is correct; custom `windowMinutes` (for example 60) is respected.
- **Verifies:** fails because `window.ts` does not exist.

### [x] T8 · Meta error mapping tests
- **Covers:** criterion 6
- **Work:** create `tests/whatsapp/errors.test.ts` covering the full table in `plan.md` §4: 131047 → `window_closed`; 130429 → `rate_limited` (retryable); 131026, 132000, 100 and other 4xx → `meta_rejected`; 5xx → retryable; unknown code → `meta_rejected`.
- **Verifies:** fails because `mapMetaError` does not exist.

### [x] T9 · `sendTemplate` tests
- **Covers:** criteria 6, 9
- **Work:** create `tests/whatsapp/send-template.test.ts` using MSW. Cover the full request body (no `+` in `to`), headers, a successful result with `wa_message_id`, a Meta error, a timeout, a network error, and a `config` error with zero requests when `PHONE_NUMBER_ID` is missing. Compare whole objects.
- **Verifies:** fails because `createWhatsAppClient` does not exist.

### [x] T10 · `sendText` tests
- **Covers:** criteria 6, 7, 11
- **Work:** create `tests/whatsapp/send-text.test.ts`: sends when the window is open; returns `window_closed` with zero requests recorded in MSW when the window is closed; same when `lastInboundAt` is `null`; returns `config` with zero requests when `WA_CUSTOMER_WINDOW_MINUTES` is invalid.
- **Verifies:** fails because `sendText` does not exist.

### [x] T11 · Supabase client and key-leak tests
- **Covers:** criterion 5 (and the service-role-key leakage edge case)
- **Work:** create `tests/supabase/server.test.ts` (builds the client with URL and key; throws without the key) and `tests/security/no-public-service-key.test.ts` (scans `src/` for `NEXT_PUBLIC_` alongside `SERVICE` or `SECRET`; confirms `src/lib/supabase/server.ts` and `src/lib/whatsapp/client.ts` import `server-only`).
- **Verifies:** fails because the modules do not exist. The leak scan may already pass, and that is recorded in the task.

## Phase 3 · Implementation

### [x] T12 · Environment module and boot check
- **Covers:** criteria 8, 9, 10, 11
- **Work:** create `src/lib/env.ts` (`assertBootEnv`, `readRequiredEnv`, `readWindowMinutes` using `zod`) and `src/instrumentation.ts` (`register()` calls `assertBootEnv`).
- **Verifies:** `tests/env/*.test.ts` pass.

### [x] T13 · E.164 validation
- **Covers:** criterion 6
- **Work:** implement `isE164` in `src/lib/whatsapp/phone.ts` with the pattern `^\+[1-9]\d{7,14}$`.
- **Verifies:** `tests/whatsapp/phone.test.ts` passes.

### [x] T14 · Window countdown
- **Covers:** criteria 7, 10
- **Work:** implement `isWindowOpen({ lastInboundAt, now, windowMinutes })` in `src/lib/whatsapp/window.ts`.
- **Verifies:** `tests/whatsapp/window.test.ts` passes.

### [ ] T15 · Meta error mapping
- **Covers:** criterion 6
- **Work:** implement `mapMetaError(status, body)` in `src/lib/whatsapp/errors.ts`.
- **Verifies:** `tests/whatsapp/errors.test.ts` passes.

### [ ] T16 · WhatsApp client: `sendTemplate`
- **Covers:** criteria 6, 9
- **Work:** implement `createWhatsAppClient(config)` in `src/lib/whatsapp/client.ts` with `GRAPH_API_VERSION = "v21.0"` (provisional, see `plan.md` R2), an injectable `fetch`, a 10-second timeout via `AbortSignal.timeout`, `import "server-only"`, and `sendTemplate`.
- **Verifies:** `tests/whatsapp/send-template.test.ts` passes.

### [ ] T17 · WhatsApp client: `sendText` with window guard
- **Covers:** criteria 6, 7, 11
- **Work:** implement `sendText` in `client.ts`. Validate E.164, evaluate the window using an injectable `now` before calling `fetch`, and return `window_closed` or `config` without sending a request.
- **Verifies:** `tests/whatsapp/send-text.test.ts` passes.

### [ ] T18 · Lazy `getWhatsAppClient`
- **Covers:** criteria 6, 9
- **Work:** add `getWhatsAppClient()`, which reads environment variables on first use, not at import time.
- **Verifies:** the `config` case in `send-template.test.ts` passes; importing the module without variables does not throw.

### [ ] T19 · Server Supabase client
- **Covers:** criterion 5
- **Work:** implement `createSupabaseServerClient()` in `src/lib/supabase/server.ts` with `import "server-only"`. It runs no queries.
- **Verifies:** `tests/supabase/server.test.ts` and `tests/security/no-public-service-key.test.ts` pass.

## Phase 4 · Deployment

### [ ] T20 · CI check job
- **Covers:** criteria 1, 3
- **Work:** create `.github/workflows/ci.yml` with triggers `pull_request` and `push` to `main`. The `check` job uses Node 22, `pnpm/action-setup` pinned to 9.15.0, `pnpm install --frozen-lockfile`, then `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Add `concurrency` to cancel superseded PR runs.
- **Verifies:** the `check` part of `tests/config/workflow.test.ts` passes; `actionlint` reports no errors if available.

### [ ] T21 · CI deploy job
- **Covers:** criterion 2
- **Work:** add a `deploy` job that runs only on `push` to `main`, has `needs: check`, and POSTs to `secrets.VERCEL_DEPLOY_HOOK_URL`.
- **Verifies:** the `deploy` part of `tests/config/workflow.test.ts` passes. The deploy job does not run on pull requests.

### [ ] T22 · Build without secrets
- **Covers:** criterion 8 (boot check does not run at build time)
- **Work:** no code change expected. Run `pnpm build` with no runtime secrets set. If it fails because something reads environment variables at import time, fix that import, keeping the check in `register()` (`plan.md` R5).
- **Verifies:** the build succeeds with an empty secret environment.

### [ ] T23 · Environment and setup documentation
- **Covers:** criteria 2, 8, 12 (manual steps documented)
- **Work:** create `.env.example` with names and blank values. Confirm `.gitignore` ignores `.env*` except `.env.example`. Update `README.md` with the variable table, the PR-to-`main` flow, the manual Vercel and branch-protection steps, and the golden rule of assertions.
- **Verifies:** `git check-ignore .env.local` reports the file as ignored; `.env.example` contains no real values.

### [ ] T24 · Vercel and branch protection (manual)
- **Covers:** criteria 1, 2
- **Work:** the organizer links the Vercel project to the repository. Turn off automatic production deployments in Vercel. In GitHub, require the `check` job before merging to `main`. Add `VERCEL_DEPLOY_HOOK_URL` as a GitHub Actions secret.
- **Verifies:** a checklist in the PR description confirms each setting. **Blocked** until the organizer creates the Vercel project (`plan.md` R7).

### [ ] T25 · First deployment from a merge to `main`
- **Covers:** criterion 2
- **Work:** open a PR to `main`, confirm `check` runs and gates the merge, merge, and confirm the `deploy` job runs only after `check` passes.
- **Verifies:** the Vercel production deployment succeeds, and the GitHub run shows `deploy` after `check`. **Blocked** by T24.

## Phase 5 · Closing (Definition of Done)

### [ ] T26 · Final verification and traceability check
- **Covers:** criterion 12 and `constitution.md` §6 (acceptance criteria covered by tests)
- **Work:**
  1. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` locally. All must pass.
  2. Confirm each criterion 1–11 has at least one test file listed in `plan.md` §10.
  3. Update `spec.md` if anything changed during implementation.
- **Verifies:** all four commands pass; every criterion maps to at least one passing test; `spec.md` matches the built behavior.

### [ ] T27 · Definition of Done sign-off
- **Covers:** criterion 12 and `constitution.md` §6 (deployed, tested with Meta's test number, board updated)
- **Work:**
  1. Confirm the production deployment from T25 is live on Vercel.
  2. Update the ticket status on the GitHub Projects board.
  3. **Open conflict:** `constitution.md` §6 requires testing "using Meta's test phone number", but the approved spec says mocked HTTP is enough. The constitution takes precedence unless it is amended first. Resolve this before closing.
- **Verifies:** the deployment is live; the board shows FUT-02 as Done; the conflict is resolved (either by a live test with Meta's test number or by amending the constitution).
- **Blocked** by T25 and the open conflict.

## Criterion coverage

| Criterion | Tasks |
|---|---|
| 1. PR to `main` runs checks and cannot merge if they fail | T4, T20, T24 |
| 2. Merge to `main` deploys after checks pass; automatic production deploys off | T4, T21, T23, T24, T25 |
| 3. Zero tests fail the pipeline | T1, T4, T20 |
| 4. `specs/constitution.md` exists with rules and template | T4 |
| 5. Server Supabase client; key used only on the server | T11, T19 |
| 6. `sendTemplate` / `sendText` return typed results | T3, T6, T8, T9, T13, T15, T16, T17 |
| 7. `sendText` refuses when the window is closed, with no request | T7, T10, T14, T17 |
| 8. Missing `WA_ACCESS_TOKEN` stops the server at boot | T5, T12, T22 |
| 9. Other missing secrets fail where used, with no request | T5, T9, T12, T16, T18 |
| 10. `WA_CUSTOMER_WINDOW_MINUTES` sets the window; unset → 1440 | T5, T7, T12, T14 |
| 11. Invalid `WA_CUSTOMER_WINDOW_MINUTES` → clear error, no request | T5, T10, T12, T17 |
| 12. Each criterion has an automated test | T1, T2, T23, T26, T27 |
