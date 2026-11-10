# MelitoFut Project Constitution

Fixed rules. If a specification contradicts these, this constitution takes precedence (or must be amended here first).

## 1. Code

- TypeScript in strict mode; no implicit `any`.
- CI on every push to `main`: linting, type checking, and tests must pass before deployment.
- Every acceptance criterion in a specification must be covered by at least one test.

## 2. Data

- Phone numbers must always be in **E.164** format (e.g., `+573001234567`). They are normalized upon storage (e.g., `300 123 4567` becomes `+573001234567`).
- `players.phone_e164` must be unique; `invitations` must be unique per `(match_id, player_id)` pair.
- Dates are stored in **UTC** and displayed in the **America/Bogota** time zone.
- All schema changes must be implemented via versioned migrations. Running `supabase db reset` must be sufficient to fully reconstruct the database.
- No player may receive messages unless they have an `opted_in_at` timestamp recorded.

## 3. WhatsApp

- **Idempotency**: All processes interacting with WhatsApp must be resilient to duplicates. A given `wa_message_id` is stored and processed only once; an event that has already been processed will not trigger a state change.
- The webhook must validate the `hub.verify_token` during a GET request (returning 403 on failure) and the `X-Hub-Signature-256` header during a POST request (returning 401 on failure, without saving any data).
- The webhook must store the raw event in the `wa_events` table and return a 200 status code within 2 seconds.
- Outside of the 24-hour window, communication is permitted only via approved **Utility-category templates**. Transactional text, without any promotional tone, to prevent Meta from reclassifying it as "Marketing."
- The payload for each button includes the `invitation_id` and the selected option; the webhook never has to guess which match a player is responding to.
- A failed delivery is flagged, but it does not stop other messages from being sent.
- Organizer commands (`STATUS`, `REMIND`, `CLOSE`, `HELP`) are only accepted when sent from the organizer's phone number.
- Reminders are not sent between 9:00 PM and 7:00 AM (Colombia time).

## 4. Security and Secrets

- Secrets (`WA_ACCESS_TOKEN`, `WA_APP_SECRET`, `WA_VERIFY_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) must be stored only as Vercel environment variables—never in the repository.
- The Supabase service role key is used exclusively on the server side. RLS (Row-Level Security) is enabled on all tables.
- Cron routes require the `CRON_SECRET`.
- The dashboard is protected by a login (Supabase Auth, restricted to the organizer's email address).

## 5. Definition of Ready (for starting a ticket)

- `spec.md` has been written.
- Acceptance criteria are testable.
- Any dependencies for the ticket are in the "Done" state.

## 6. Definition of Done

- Acceptance criteria are covered by tests.
- Deployed to Vercel.
- Tested using Meta's test phone number.
- Status updated on the GitHub Project board.

## 7. Spec Template

```markdown
# FUT-XX · <title>

## User Story
As a <role>, I want <what> so that <why>.

## Acceptance Criteria
- Given <context>, when <action>, then <result>.
``` ## Edge cases

## Out of scope

## Dependencies
FUT-..

## Open questions
```

Each spec goes in `specs/FUT-XX-<slug>/spec.md`, with `plan.md` and `tasks.md` alongside it.