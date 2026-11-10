# FUT-02 · Base repository: Next.js + Supabase + Vercel + `specs` folder

> Status: **Approved**. All open questions answered by the organizer. Plan: `plan.md`.

## User Story
As a developer, I want a deployable boilerplate with CI so that each spec can be pushed to production seamlessly.

## Acceptance Criteria
- Given a pull request targeting `main`, when the CI pipeline runs, then linting, type checking, and tests all run, and the PR cannot be merged unless all of them pass.
- Given a merge (push) to `main`, when the CI pipeline runs and all checks pass, then the production deployment to Vercel is triggered by the pipeline; Vercel's automatic production deploys are disabled.
- Given CI runs with the test suite, when the suite contains zero tests, then the pipeline fails.
- Given the repository, when I open `specs/constitution.md`, then it exists and contains the project rules and the spec template.
- Given server-side code, when a route handler needs the database, then a Supabase client is available that uses the service role key only on the server.
- Given server-side code, when I call `sendTemplate` or `sendText` on the typed WhatsApp client, then it sends the request to the WhatsApp Cloud API and returns a typed result (success or error).
- Given `sendText` is called and the customer-service window is closed, when the client evaluates the request, then it refuses to send, does not call Meta, and returns a typed error.
- Given `WA_CUSTOMER_WINDOW_MINUTES` is set to a positive integer, when the client evaluates the window, then the window length equals that many minutes; given it is unset, the window length is 1440 minutes (24 hours).
- Given `WA_CUSTOMER_WINDOW_MINUTES` is set to a value that is not a positive integer, when the client evaluates the window, then it fails with a clear error and sends no request.
- Given the app starts without `WA_ACCESS_TOKEN` in the environment, when the server boots, then it fails to start with a clear error.
- Given a required secret other than `WA_ACCESS_TOKEN` is missing, when the code that needs it runs, then it fails with a clear error and sends no request.
- Given the constitution rule that every acceptance criterion needs a test, when this ticket is closed, then each criterion above is covered by at least one automated test, using mocked HTTP for the WhatsApp client.

## Edge Cases
- **CI with zero tests:** the pipeline fails. At least one test must exist before the pipeline can pass.
- **Missing secrets at build or runtime:** `WA_ACCESS_TOKEN` stops the server at boot. Other secrets are checked where they are used, not at boot. In both cases the app fails clearly and never sends requests with an empty credential.
- **Service role key leakage:** the key must never reach client-side bundles or be exposed through a `NEXT_PUBLIC_` variable.
- **Invalid phone number passed to the WhatsApp client:** a number that is not E.164 (e.g., `300 123 4567`) is rejected before any request is sent to Meta.
- **Meta API errors:** non-2xx responses, rate limits, and network timeouts are returned as typed errors, not thrown as untyped exceptions or silently ignored.
- **`sendText` outside the 24-hour window:** refused automatically with a typed error; no request is sent to Meta. Only `sendTemplate` (approved Utility templates) may be used outside the window.
- **Window countdown reaches zero during a send:** the window state is evaluated at call time (UTC). A request made after the window closes is refused.
- **Deployment failure:** if the Vercel deployment fails after CI passes, the failure is visible to the organizer (GitHub Actions / Vercel status), and `main` is not marked as deployed.
- **Pull requests to other branches:** CI runs, but no production deployment is triggered. Only a merge to `main` deploys.

## Out of Scope
- Database schema, migrations, and seed data (FUT-03).
- The webhook endpoint, signature validation, and `wa_events` logging (FUT-04).
- Creating or approving the `match_invitation` template (FUT-05). Only the client method is in scope.
- Any business logic: players, matches, invitations, or responses.
- Dashboard UI and login with Supabase Auth (FUT-16). The Next.js app keeps its default home page as-is.
- Production WhatsApp number (FUT-21).
- Configuring the Meta app or obtaining tokens (FUT-01). This ticket only reads them from environment variables.
- Live calls to Meta's test number. Mocked HTTP is sufficient to close this ticket.
- Creating or configuring the Vercel project. The organizer does this manually; it is not yet ready.
- Persisting inbound-message timestamps or any other storage for the window. FUT-03 and FUT-04 own that data; this ticket only defines the client's contract for it.
- WhatsApp client methods beyond `sendTemplate` and `sendText`.

## Decisions
- **Test requirement:** CI requires at least one test to exist and pass.
- **Testing stack:** Vitest for the test runner, MSW for mocking HTTP. Assertions follow the golden rule of assertions: each test asserts on the complete actual value against the complete expected value, not on fragments of it (https://www.epicweb.dev/the-golden-rule-of-assertions).
- **Linting:** Biome is the only linter and formatter. No ESLint.
- **Deployment flow:** all changes go through a PR to `main`. CI gates the merge. Vercel's automatic production deploys are turned off; production deployment is triggered by the pipeline after a merge to `main` passes.
- **WhatsApp client scope:** only `sendTemplate` and `sendText` in this ticket.
- **Graph API version:** the most widely used WhatsApp Cloud API version at implementation time. The exact version is pinned in one constant in the client module and recorded in `plan.md`.
- **Customer-service window (countdown):** the window opens when an inbound message from the player is received. Its length is read from the env variable `WA_CUSTOMER_WINDOW_MINUTES` (minutes, default 1440). The client computes the time remaining from the last inbound timestamp (UTC) on each `sendText` call and refuses when the countdown has reached zero. The source of that timestamp is a plan-level decision bounded by Out of Scope above.
- **Window length is configuration, not policy:** the env variable exists so the countdown can be adjusted without a code change. The default of 1440 matches Meta's 24-hour rule; changing it does not change Meta's rule, so it should stay at 1440 unless Meta's policy changes.
- **Startup validation:** a missing `WA_ACCESS_TOKEN` stops the server at boot. Other secrets, including `WA_CUSTOMER_WINDOW_MINUTES` when it is set to an invalid value, fail only where used.
- **Verification:** mocked HTTP in automated tests closes this ticket. A live check against Meta's test number is not required here.
- **Scaffold:** the Next.js 16 / React 19 / Tailwind v4 setup and the default home page stay as they are.

## Dependencies
- None (per `docs/backlog.md`).
- Vercel project creation and GitHub linkage: performed manually by the organizer. The deployment criterion cannot be verified end to end until this is done.
- Live testing of `sendTemplate` / `sendText` against Meta requires the credentials from FUT-01. Not required to close this ticket.

## Open Questions
None.
