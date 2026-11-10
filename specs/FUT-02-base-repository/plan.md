# FUT-02 · Plan: Base repository

> Source of truth for behavior: `spec.md` (approved). This plan covers how, not what. Code is not included; only signatures and decisions.

## 1. Summary

Turn the existing Next.js 16 scaffold into a deployable base with:

1. A GitHub Actions pipeline (lint → typecheck → test → build) that gates PRs to `main` and triggers the production Vercel deploy after a merge.
2. Boot-time validation of `WA_ACCESS_TOKEN`, and lazy validation of every other variable where it is used.
3. A server-only Supabase client using the service role key.
4. A typed WhatsApp Cloud API client (`sendTemplate`, `sendText`) that returns `Result` values, enforces E.164, and refuses `sendText` when the customer-service window is closed.
5. Vitest + MSW test suite; every acceptance criterion maps to at least one test (section 9).

No database tables, migrations, or webhook code are created here (FUT-03 and FUT-04).

## 2. Files and paths

### New
| Path | Purpose |
|---|---|
| `.github/workflows/ci.yml` | Pipeline: `check` job on PRs and pushes to `main`; `deploy` job on push to `main` only, after `check`. |
| `src/instrumentation.ts` | Next.js hook that runs `assertBootEnv()` when the server starts. |
| `src/lib/env.ts` | Env reading and validation (`assertBootEnv`, `readRequiredEnv`, `readWindowMinutes`). |
| `src/lib/supabase/server.ts` | Server-only Supabase client factory. Imports `server-only`. |
| `src/lib/whatsapp/client.ts` | `createWhatsAppClient`, `getWhatsAppClient`, Graph API version constant. |
| `src/lib/whatsapp/types.ts` | `Result`, input/output types, template component types. |
| `src/lib/whatsapp/errors.ts` | `WhatsAppError` kinds and `mapMetaError`. |
| `src/lib/whatsapp/phone.ts` | `isE164`. |
| `src/lib/whatsapp/window.ts` | `isWindowOpen` (pure countdown function). |
| `vitest.config.ts` | Vitest config: `@/*` alias, `server-only` alias to a no-op, setup file. |
| `tests/setup/msw.ts` | MSW server lifecycle (listen / reset / close). |
| `tests/setup/server-only.ts` | Empty module used in place of `server-only` in tests. |
| `tests/**/*.test.ts` | Test files (section 9). |
| `.env.example` | Variable names with blank values. Never real values. |

### Changed
| Path | Change |
|---|---|
| `package.json` | Add scripts `test` (`vitest run`), `typecheck` (`tsc --noEmit`). Add dependencies (section 8). Keep `lint` as `biome check`. |
| `README.md` | Environment variable table, PR-to-`main` workflow, Vercel setting that must be off. |
| `.gitignore` | Confirm `.env*` is ignored except `.env.example`. |

### Unchanged
`biome.json` (Biome stays the only linter), `tsconfig.json`, `next.config.ts`, `src/app/*` (default page and Tailwind kept, per spec).

## 3. Data and migrations

- **Tables:** none. `supabase/` does not exist yet and is created by FUT-03.
- **Supabase client:** `createSupabaseServerClient()` exists so that FUT-03+ can use it. FUT-02 issues no queries; tests verify construction only.
- **Inbound timestamp (window input):** the client does not read storage. `sendText` receives `lastInboundAt` from the caller. FUT-04/FUT-09 will supply it from `wa_events`/`invitations` data. See decision D6.

## 4. External contracts (WhatsApp Cloud API)

### Endpoint
`POST https://graph.facebook.com/{GRAPH_API_VERSION}/{PHONE_NUMBER_ID}/messages`
Headers: `Authorization: Bearer <WA_ACCESS_TOKEN>`, `Content-Type: application/json`.
`GRAPH_API_VERSION` is a constant in `src/lib/whatsapp/client.ts`, provisionally `v21.0`. See risk R2.

### Request: template (`sendTemplate`)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "573001234567",
  "type": "template",
  "template": {
    "name": "<templateName>",
    "language": { "code": "<language>" },
    "components": [ "<passed through from caller>" ]
  }
}
```
Quick-reply buttons (used by FUT-05/FUT-08) travel inside `components` as `{ "type": "button", "sub_type": "quick_reply", "index": "<n>", "parameters": [{ "type": "payload", "payload": "<invitation_id>:<option>" }] }`. The client passes components through unchanged; it does not build them.

### Request: text (`sendText`)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "573001234567",
  "type": "text",
  "text": { "preview_url": false, "body": "<body>" }
}
```

### Recipient format
`to` is the E.164 number with the leading `+` removed (decision D5).

### Success response (used to build the typed result)
`{ "messaging_product": "whatsapp", "contacts": [...], "messages": [{ "id": "wamid...." }] }`
Typed result exposes `wa_message_id = messages[0].id`.

### Error response and mapping
`{ "error": { "message", "type", "code", "error_subcode?", "error_data?", "fbtrace_id" } }`

| Source | Mapped `kind` | `retryable` |
|---|---|---|
| Client-side E.164 check fails | `invalid_phone` | no (no request sent) |
| Window check fails in `sendText` | `window_closed` (no request sent) | no |
| Meta `131047` (re-engagement / window closed) | `window_closed` | no |
| Meta `130429` (rate limit) | `rate_limited` | yes |
| Meta `131026`, `132000`, `100`, other 4xx | `meta_rejected` (keep `code`) | no |
| Meta 5xx | `meta_rejected` | yes |
| Network failure | `network` | yes |
| Request exceeds timeout | `timeout` | yes |
| Missing required env at call time | `config` (no request sent) | no |

## 5. Environment variables (names only)

| Name | Required | Checked | Used by |
|---|---|---|---|
| `WA_ACCESS_TOKEN` | yes | at boot (`instrumentation.ts`) | WhatsApp client |
| `PHONE_NUMBER_ID` | yes | where used | WhatsApp client |
| `SUPABASE_URL` | yes | where used | Supabase server client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | where used | Supabase server client |
| `WA_CUSTOMER_WINDOW_MINUTES` | no (default 1440) | where used | window check |

Not used in FUT-02 (listed in architecture, added by their tickets): `WA_APP_SECRET` (FUT-04), `WA_VERIFY_TOKEN` (FUT-04), `CRON_SECRET` (FUT-11/FUT-14), `WABA_ID` (FUT-05). `SUPABASE_URL` is server-only; it is not `NEXT_PUBLIC_`.

Deploy-trigger credential (CI only): `VERCEL_DEPLOY_HOOK_URL`, stored as a GitHub Actions secret. See risk R4.

## 6. Decisions

**D1 · Test runner: Vitest.**
Chosen for native TypeScript and ESM support, which fits Next 16. *Discarded:* Jest (extra transform setup with Next and ESM), Node's built-in runner (weaker mocking and matchers).

**D2 · HTTP mocking: MSW, with native `fetch` in the client.**
The client uses global `fetch`, so MSW intercepts it without SDK coupling. *Discarded:* Meta's official SDK (another dependency and its own types; we want our typed contract), axios (unnecessary; `fetch` is native).

**D3 · Assertion style: golden rule of assertions.**
Each test asserts on the whole actual value against the whole expected value (`toEqual` on full objects and full request bodies), not on individual fields. This is a convention for `tests/`, documented in `README.md`.

**D4 · Errors as values.**
Client methods return `Promise<Result<T, WhatsAppError>>` (`{ ok: true, value } | { ok: false, error }`). *Discarded:* throwing typed errors (callers would need try/catch for expected failures like closed windows and rate limits; the spec requires typed returns).

**D5 · Phone numbers: strict validation in the client, no normalization.**
`isE164` accepts only `^\+[1-9]\d{7,14}$`. `300 123 4567` is rejected. Normalization is storage's job (FUT-06). *Discarded:* normalizing in the client by assuming country code `+57` (hides bad input and mixes responsibilities). The client removes only the leading `+` when building the request, because Meta's examples use the number without it (risk R1).

**D6 · Window state: caller supplies `lastInboundAt`; client computes the countdown.**
`isWindowOpen({ lastInboundAt, now, windowMinutes })` is pure. Window closes at `lastInboundAt + windowMinutes`. `lastInboundAt: null` means closed. *Discarded:* (a) client queries the database for the last inbound timestamp: couples FUT-02 to a schema that FUT-03 has not created; (b) an in-memory cache: not durable across Vercel serverless invocations.

**D7 · Boot-time check through `src/instrumentation.ts`.**
`register()` calls `assertBootEnv()`, which throws if `WA_ACCESS_TOKEN` is missing. Other variables are read lazily with `readRequiredEnv(name)`, which throws a named error. *Discarded:* checking in `next.config.ts` (runs at build time, and would break builds in CI and previews that have no runtime secrets).

**D8 · Env schema: `zod`.**
One schema for `WA_CUSTOMER_WINDOW_MINUTES` (positive integer, default 1440) and the required-variable checks. *Discarded:* hand-written checks (more code to test, same result).

**D9 · Server-only enforcement.**
Both `src/lib/supabase/server.ts` and `src/lib/whatsapp/client.ts` import `server-only`, so importing them into a client component fails the build. A test scans `src/` to confirm no file references a `NEXT_PUBLIC_` variable that contains `SERVICE` or `SECRET`.

**D10 · HTTP timeout: 10 seconds.**
Set with `AbortSignal.timeout`. The 2-second webhook limit belongs to FUT-04 and is not applied to outbound sends. *Discarded:* no timeout (a hung request would stall the caller indefinitely).

**D11 · Test gate: zero tests fails.**
`vitest run` without `--passWithNoTests`. Vitest exits non-zero when no test files are found. A workflow test asserts that the `test` script does not contain `passWithNoTests`.

**D12 · Production deploy: GitHub Actions gates it; deploy hook triggers it.**
`ci.yml` has a `check` job (PR and push to `main`) and a `deploy` job (push to `main` only, `needs: check`) that POSTs to `VERCEL_DEPLOY_HOOK_URL`. Vercel's automatic production deploys are turned off manually in the Vercel dashboard. *Discarded:* Vercel CLI from GitHub Actions (`vercel deploy --prod`), which reports Vercel's build result directly in GitHub but needs a Vercel token plus org and project IDs stored in GitHub, which is more credential surface. The trade-off is that the deploy hook returns before the build finishes, so build failures are visible in the Vercel dashboard rather than in the GitHub check (edge case: "visible to the organizer" is satisfied by either).

**D13 · Node 22 in CI; pnpm 9.15.0 from `packageManager`.**
Next 16 requires Node 20.9+. Node 22 is an LTS line. `pnpm install --frozen-lockfile`.

**D14 · Graph API version as a single constant.**
`GRAPH_API_VERSION = "v21.0"` (provisional, see R2). *Discarded:* env variable (the spec requires a constant; a version is not per-environment config).

**D15 · Window default: no inbound message means window closed.**
`lastInboundAt: null` → refuse `sendText`. This is the safe reading of the Meta rule (free text needs a customer-initiated message).

## 7. Technical risks

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | Meta's `to` format: payloads without `+` are used in Meta examples; not confirmed for this account. | All sends fail with `meta_rejected` if wrong. | Verify on the first live send in FUT-01/FUT-05. Mock tests assert the request body; the constant lives in one place. |
| R2 | The Graph API version is not verified. Sources disagree (v21.0 and v23.0 are mentioned), and today's date is 2026-11-10, so `v21.0` may be deprecated. | Requests to a deprecated version may fail. | Confirm the current version at `https://graph.facebook.com/versions` before merging. Pin in one constant. |
| R3 | Next 16 + Vitest + `server-only` under test. `server-only` throws outside a server bundle. | Tests fail to import server modules. | Alias `server-only` to a no-op in `vitest.config.ts`. A test confirms the real package is still imported in source. |
| R4 | The deploy hook URL is a credential, and the constitution says secrets live only as Vercel environment variables. | Possible rule conflict. | `VERCEL_DEPLOY_HOOK_URL` is CI-only, not an application secret. Flagged for organizer review before merge. |
| R5 | `next build` in CI has no runtime secrets. | Build fails if anything reads env at import. | `assertBootEnv` runs in `register()`, not at import. CI runs `pnpm build` without secrets to prove this. |
| R6 | Deploy hook returns before the Vercel build finishes (D12). | A broken production build may not show in the GitHub check. | Vercel dashboard is the source for build status; noted in README. |
| R7 | Organizer creates the Vercel project manually (spec dependency). | Deploy criterion cannot be verified end to end. | Blocked until the organizer confirms. Automated tests cover the workflow file only. |
| R8 | Graph API error codes may change. | Mapping goes stale. | Mapping is one table in `errors.ts`, covered by tests; unknown codes fall back to `meta_rejected`. |

## 8. Dependencies to add

Runtime: `zod`, `server-only`, `@supabase/supabase-js`.
Dev: `vitest`, `msw`, `yaml` (parse the workflow file in a test).
Versions are resolved at install time and locked in `pnpm-lock.yaml`. They must be at least two weeks old, per the project's version rule.

## 9. Testing strategy

Commands: `pnpm lint` (`biome check`), `pnpm typecheck` (`tsc --noEmit`), `pnpm test` (`vitest run`), `pnpm build`. All four run in `ci.yml`.

| Layer | What | Tool |
|---|---|---|
| Unit | `isE164`, `isWindowOpen` (boundaries: exactly at window end is closed, one ms before is open, `null` is closed), `readWindowMinutes` (unset → 1440; `"0"`, `"-5"`, `"1.5"`, `"abc"` → error), `mapMetaError` (table in section 4). | Vitest |
| Integration (HTTP mocked) | `sendTemplate` / `sendText`: full request body, headers, success result, each error kind, timeout, network failure. Uses MSW handlers and a request log. | Vitest + MSW |
| Guard | `sendText` with closed window and with `null` makes zero requests (MSW records none). | Vitest + MSW |
| Boot | `assertBootEnv` throws when `WA_ACCESS_TOKEN` is missing and passes when set. | Vitest |
| Config | `ci.yml` jobs and triggers (PR to `main`; deploy only on push to `main`; `deploy.needs = check`). `package.json` `test` script has no `passWithNoTests`. `specs/constitution.md` contains `## 7. Spec Template`. | Vitest + `yaml` |
| Security | Supabase client throws without the service key; no `NEXT_PUBLIC_*SERVICE*` references under `src/`. | Vitest |

Golden-rule assertions (D3) apply to every test above: full-object comparisons.

Manual checks (not automated; recorded in the PR description):
- Vercel dashboard: automatic production deployments are off.
- Vercel project exists and is linked (R7).

## 10. Traceability

| # | Criterion (spec.md) | Plan section | Automated test |
|---|---|---|---|
| AC1 | PR to `main` runs lint/typecheck/tests and cannot merge unless they pass | §2 `ci.yml`, §6 D12, §9 | `tests/config/workflow.test.ts`: `check` job runs on `pull_request` to `main`; branch protection requiring `check` is a manual repo setting (noted in README) |
| AC2 | Merge to `main` triggers production deploy after checks pass; automatic deploys off | §2 `ci.yml`, §6 D12, §9 manual check | `tests/config/workflow.test.ts`: `deploy` runs only on `push` to `main` and `needs: check`. Vercel setting is a manual check |
| AC3 | Zero tests → pipeline fails | §6 D11 | `tests/config/package.test.ts`: `test` script does not contain `passWithNoTests` |
| AC4 | `specs/constitution.md` exists with rules and template | §2 (existing file) | `tests/config/constitution.test.ts` |
| AC5 | Server Supabase client; service key only on server | §2 `supabase/server.ts`, §6 D9 | `tests/supabase/server.test.ts`: builds client; throws without key; `tests/security/no-public-service-key.test.ts` |
| AC6 | `sendTemplate` / `sendText` send to Cloud API and return typed results | §4, §2 `whatsapp/*`, §6 D2 D4 D14 | `tests/whatsapp/send-template.test.ts`, `tests/whatsapp/send-text.test.ts` |
| AC7 | `sendText` refuses when window closed, no request | §6 D6 D15, §2 `window.ts` | `tests/whatsapp/window.test.ts`; `tests/whatsapp/send-text.test.ts` (zero requests recorded) |
| AC8 | Missing `WA_ACCESS_TOKEN` stops server at boot | §6 D7, §2 `instrumentation.ts` | `tests/env/boot.test.ts` |
| AC9 | Other missing secrets fail where used, with no request | §6 D7, §5 | `tests/env/lazy.test.ts`; `tests/whatsapp/send-template.test.ts` (config kind, zero requests) |
| AC10 | `WA_CUSTOMER_WINDOW_MINUTES` set → window length equals it; unset → 1440 | §5, §6 D8, §2 `env.ts` | `tests/env/window-minutes.test.ts`; `tests/whatsapp/window.test.ts` |
| AC11 | `WA_CUSTOMER_WINDOW_MINUTES` invalid → clear error, no request | §5, §6 D8 | `tests/env/window-minutes.test.ts`; `tests/whatsapp/send-text.test.ts` (config kind) |
| AC12 | Each criterion covered by at least one automated test | §9 | Enforced in review: each row above must name a test file. AC2 and the Vercel setting are partly manual (see §9) |

Edge cases from spec.md with tests: invalid phone (`tests/whatsapp/phone.test.ts`), Meta errors (`tests/whatsapp/errors.test.ts`), key leakage (`tests/security/no-public-service-key.test.ts`), `sendText` at the window boundary (`tests/whatsapp/window.test.ts`), other branches don't deploy (`tests/config/workflow.test.ts`).

## 11. Open items before implementation

- R2: confirm the current Graph API version.
- R4: organizer reviews the deploy hook as a CI-only credential.
- R7: organizer creates and links the Vercel project.
