# MelitoFut

A WhatsApp bot that manages attendance for amateur soccer matches among a group of friends. It sends private invitations to each player (no WhatsApp group required), collects their responses via a single tap ("I'm in" / "I'm out" / "Maybe"), and provides the organizer with a list of confirmed players.

- Organizer: Anthony (the sole administrator).
- Scale: 10–25 players, 1–3 matches per week.
- Out of scope: pitch rental payments, WhatsApp groups, conversational AI.

## Stack

- **Next.js** (route handlers + dashboard) deployed on **Vercel**.
- **Supabase**: Postgres, Auth, and cron jobs.
- Official **WhatsApp Cloud API** by Meta (used solely for message transport).
- Strict TypeScript.

## Our Workflow: Spec-Driven Development

The specification takes precedence over the code. **Do not write code for a ticket without an approved `spec.md`.**

1. **Spec**: `specs/FUT-XX-<slug>/spec.md` containing the user story, Given/When/Then criteria, edge cases, and out-of-scope items. Linked to the ticket in `docs/backlog.md`.
2. **Plan**: `plan.md` outlining technical decisions (endpoints, affected database tables, Meta API payloads, environment variables).
3. **Tasks**: `tasks.md` broken down into small, verifiable steps. Each acceptance criterion must have at least one corresponding test.
4. **Implementation**: Executed according to the specification.
5. **Verification**: Acceptance tests must pass; the specification must be updated if any changes occurred.

Before starting a ticket, review its "Definition of Ready"; before closing it, ensure it meets the "Definition of Done" (both are defined in `specs/constitution.md`).

## Non-negotiable Rules

Full details can be found in `specs/constitution.md`. Key principles:

- All WhatsApp-related operations are **idempotent** (a given `wa_message_id` is processed only once).
- Phone numbers must be in **E.164** format (`+573001234567`).
- Dates are stored in **UTC** in the database and displayed in the **America/Bogota** timezone.
- Secrets are stored exclusively in Vercel environment variables; they must never be included in the repository.
- The webhook validates the `X-Hub-Signature-256` header and must return a 200 status code within 2 seconds.

## Project Documentation

- `@docs/architecture.md`: Covers architecture, infrastructure, match sequence, data model, and key design decisions.
- `@docs/backlog.md`: Contains 21 tickets (FUT-01 through FUT-21), including epics, priorities, dependencies, and acceptance criteria.
- The active project board is available on GitHub Projects under **MelitoFut** (https://github.com/users/saospina/projects/5). Tickets are project drafts, not standard GitHub issues. You can view them using the command `gh project item-list 5 --owner saospina` (requires running `gh auth refresh -s project` first).

## Commands

These will be finalized upon completion of FUT-02 (base repository). Expected commands include: starting the development environment, linting, type checking, running tests, and `supabase db reset` to rebuild the database from migrations.

## Current Status

The backlog has been defined and scheduled (MVP = FUT-01 through FUT-10, P0 priority). No code has been written yet. The next steps are FUT-01 (Meta app setup and test phone number) and FUT-02 (base repository).