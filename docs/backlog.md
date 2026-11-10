# MelitoFut: Backlog (FUT-01 to FUT-21)

Live source: GitHub Project **MelitoFut** (https://github.com/users/saospina/projects/5). This file serves as a copy so the agent can review the sequence and dependencies without needing to call the GitHub API. If it differs from the board, the board takes precedence.

Each ticket serves as the foundation for a specification: its story and criteria must be copied into `specs/FUT-XX-<slug>/spec.md` before any code is written (see `specs/constitution.md`).

- **MVP (P0):** FUT-01 to FUT-10. Inviting players to a match, capturing responses (Yes/No/Maybe), and sending a summary to the organizer.
- **P1:** FUT-11 to FUT-16. Reminders, capacity management and waitlists, recurring events, commands, and a dashboard.
- **P2:** FUT-17 to FUT-21. Cancellations, voluntary opt-outs, statistics, monitoring, and production-ready setup.

## Summary in Development Order

The dates assume a start date of Monday, November 9, 2026, following a "side project" pace. These are proposed dates and are subject to change.

| Order | Ticket | Title | Epic | Priority | Depends on | Start | End |
|---|---|---|---|---|---|---|---|
| 1 | FUT-01 | Configure Meta app and test phone number | Setup | P0 | — | 2026-11-09 | 2026-11-10 |
| 2 | FUT-02 | Base repository: Next.js + Supabase + Vercel + `specs` folder | Setup | P0 | — | 2026-11-09 | 2026-11-10 |
| 3 | FUT-03 | Data model and migrations | Data | P0 | FUT-02 | 2026-11-11 | 2026-11-12 |
| 4 | FUT-04 | Webhook: verification, signature, and raw log | Webhook | P0 | FUT-01, FUT-03 | 2026-11-13 | 2026-11-15 |
| 5 | FUT-05 | Invitation template with buttons, approved | WhatsApp | P0 | FUT-01 | 2026-11-11 | 2026-11-13 |
| 6 | FUT-06 | Player registration | Players | P0 | FUT-03 | 2026-11-14 | 2026-11-15 |
| 7 | FUT-07 | Create match | Matches | P0 | FUT-03 | 2026-11-14 | 2026-11-15 |
| 8 | FUT-08 | Send invitations to active players | WhatsApp | P0 | FUT-05, FUT-06, FUT-07 | 2026-11-16 | 2026-11-18 |
| 9 | FUT-09 | Register button response | Webhook | P0 | FUT-04, FUT-08 | 2026-11-19 | 2026-11-21 |
| 10 | FUT-10 | Attendance summary for the organizer | Summary | P0 | FUT-09 | 2026-11-22 | 2026-11-23 |
| 11 | FUT-11 | Automated reminder for those with pending status | Automation | P1 | FUT-09 | 2026-11-24 | 2026-11-26 |
| 12 | FUT-12 | Maximum capacity and waiting list | Matches | P1 | FUT-09 | 2026-11-27 | 2026-11-29 |
| 13 | FUT-13 | Changing response and freeing up a spot | Matches | P1 | FUT-12 | 2026-11-30 | 2026-12-01 |
| 14 | FUT-14 | Recurring matches with scheduled messaging | Automation | P1 | FUT-07, FUT-08 | 2026-12-02 | 2026-12-05 |
| 15 | FUT-15 | Organizer commands via WhatsApp | Summary | P1 | FUT-10 | 2026-12-06 | 2026-12-08 |
| 16 | FUT-16 | Organizer web dashboard | Dashboard | P1 | FUT-10 | 2026-12-09 | 2026-12-15 |
| 17 | FUT-17 | Canceling a match and sending notifications | Matches | P2 | FUT-08 | 2026-12-16 | 2026-12-17 |
| 18 | FUT-18 | Voluntary withdrawal of a player | Players | P2 | FUT-09 | 2026-12-18 | 2026-12-19 |
| 19 | FUT-19 | Attendance statistics | Dashboard | P2 | FUT-16 | 2026-12-20 | 2026-12-22 |
| 20 | FUT-20 | Error and cost monitoring | Operation | P2 | FUT-08 | 2026-12-23 | 2026-12-26 |
| 21 | FUT-21 | Switch to production number | Operation | P2 | FUT-10 | 2026-12-27 | 2026-12-29 |

Status of all tickets at the time this file was created: **To Do**.

---

## P0 · MVP

### FUT-01 · Set up Meta app and test number
**Epic:** Setup · **Priority:** P0 · **Depends on:** —

As an organizer, I want a Meta app with the WhatsApp Cloud API enabled so that I can send and receive messages via the bot.

Acceptance criteria:
- Given a Meta Business portfolio, when I create the app and add WhatsApp, I obtain a `PHONE_NUMBER_ID`, `WABA_ID`, and a permanent system user token.
- Given the test number, when I register my mobile phone and those of 2–3 friends as recipients, they receive the `hello_world` template.
- Secrets are stored exclusively in Vercel environment variables; they are never included in the repository.

### FUT-02 · Base repository: Next.js + Supabase + Vercel + `specs` folder
**Epic:** Setup · **Priority:** P0 · **Depends on:** —

As a developer, I want a deployable boilerplate with CI so that each spec can be pushed to production seamlessly.

Acceptance criteria:
- Upon a push to the `main` branch, the CI pipeline runs—including linting, type-checking, and tests—followed by a deployment to Vercel.
- A `specs/constitution.md` file exists, containing the project rules and a spec template. - There is a Supabase client on the server, as well as a typed WhatsApp client (`sendTemplate`, `sendText`).

### FUT-03 · Data model and migrations
**Epic:** Data · **Priority:** P0 · **Depends on:** FUT-02

As a developer, I want the data model tables to be version-controlled so that the state is reproducible.

Acceptance criteria:
- Given the migrations, when I run `supabase db reset`, the tables `players`, `matches`, `invitations`, and `wa_events` are created, including their unique constraints.
- Inserting two invitations for the same (match, player) pair fails.
- There is seed data that includes 3 players.ores and 1 match for development.

### FUT-04 · Webhook: verification, signature and raw log
**Epic:** Webhook · **Priority:** P0 · **Depends on:** FUT-01, FUT-03

As a system, I want to receive Meta events securely so as not to process fake or duplicate messages.

Acceptance criteria:
- Given a GET with correct `hub.verify_token`, when Meta verifies then I respond `hub.challenge` with 200; if the token is incorrect, 403.
- Given a POST with invalid `X-Hub-Signature-256`, then I respond 401 and save nothing.
- Given a valid POST, I then save the event to `wa_events` and respond 200 in less than 2s.
- The same `wa_message_id` received twice is saved only once.

### FUT-05 Invitation template with buttons, approved
**Epic:** WhatsApp · **Priority:** P0 · **Depends on:** FUT-01

As an organizer, I want an approved utility template so I can write to each player outside of the 24h window.

Acceptance criteria:
- The `match_invitation` template (es) has variables for name, day, time and court, and 3 quick response buttons: I'm going, I'm not going, Maybe.
- Given the submission for review, when Meta responds, then it is APPROVED in the Utility category.
- If Meta reclassifies it as Marketing, the text is adjusted (without promotional tone) and resent.

### FUT-06 · Player registration
**Epic:** Players · **Priority:** P0 · **Depends on:** FUT-03

As an organizer, I want to load my friends with name and number so I know who to invite.

Acceptance criteria:
- Given a number like `300 123 4567`, when I save it, then it is normalized to `+573001234567`.
- A repeated number is rejected with a clear message.
- I can mark a player as inactive and they stop receiving invitations.
- `opted_in_at` is logged: the player agreed to receive messages from the bot.

### FUT-07 · Create match
**Epic:** Matches · **Priority:** P0 · **Depends on:** FUT-03

As an organizer, I want to create a match with a date, time, court and quota so I can invite people.

Acceptance criteria:
- Given a match with a past date, when I save it, then it is rejected.
- A new match remains in draft status until I send invitations.
- Time is saved in UTC and displayed in America/Bogota.

### FUT-08 · Send invites to active players
**Epic:** WhatsApp · **Priority:** P0 · **Depends on:** FUT-05, FUT-06, FUT-07

As an organizer, I want to invite all active players with a single command so as not to write to each one.

Acceptance criteria:
- Given a match in `draft` and 12 active players, when I send, then 12 `pending` invitations are created, each with its `wa_message_id`, and the match goes to `open`.
- Resend does not duplicate: the player who already has an invitation does not receive another one.
- The payload of each button includes `invitation_id` and the option.
- A failed submission is marked and does not stop the others.

### FUT-09 · Record button response
**Epic:** Webhook · **Priority:** P0 · **Depends on:** FUT-04, FUT-08

As a player, I want to respond with a tap and receive confirmation so I know my response stuck.

Acceptance criteria:
- Tap Voy, when the webhook arrives, then the invitation goes to `yes`, saves `responded_at` and the player receives "Done, you are booked for Thursday 8 pm".
- If the player types free text instead of tapping a button, they receive a reminder to use the buttons.
- An event already processed does not change the state again.
- A response to a closed or canceled match receives notice and does not change anything.

### FUT-10 Organizer Support Summary
**Epic:** Summary · **Priority:** P0 · **Depends on:** FUT-09

As an organizer, I want to see who goes, who doesn't and who is missing to decide if it is played.

Acceptance criteria:
- Given an open match, when I type `STATUS` to the bot, then I receive count and names by group: Go, Don't go, Maybe, No response.
- Every time someone answers, the organizer receives a short notice (configurable: activated by default).
- Only the organizer's number can request the summary.

---

## P1 · Automate and sort

### FUT-11 · Automatic reminder to pending
**Epic:** Automation · **Priority:** P1 · **Depends on:** FUT-09

As an organizer, I want the bot to chase down non-responders so I can stop responding.

Acceptance criteria:
- Given an invitation `pending` 24 hours after sending, when the cron runs, then the player receives a reminder and `reminders_sent` rises to 1.
- Maximum 2 reminders per invitation; none after `rsvp_deadline`.
- Reminders are not sent between 9 pm and 7 am Colombia time.

### FUT-12 · Maximum quota and waiting list
**Epic:** Matches · **Priority:** P1 · **Depends on:** FUT-09

As an organizer, I want a quota per game so as not to have too many players.

Acceptance criteria:
- Given a match with quota 14 and 14 confirmed, when player 15 touches I'm going, then he remains in the `waitlist` andreceives its position.
- The summary shows the waiting list in order of arrival.

### FUT-13 · Response change and quota release
**Epic:** Matches · **Priority:** P1 · **Depends on:** FUT-12

As a player, I want to change my answer if something comes up so as not to leave the team hanging.

Acceptance criteria:
- Given a confirmed player, when he touches I'm not going, then his slot is released and the first one waiting goes to `yes` and receives a notice.
- The organizer receives notice of withdrawals less than 6 hours before the match.

### FUT-14 · Recurring matches with scheduled delivery
**Epic:** Automation · **Priority:** P1 · **Depends on:** FUT-07, FUT-08

As an organizer, I want to define "Tuesday and Thursday 8 pm on court X" once so that the invitations go out alone.

Acceptance criteria:
- Given an active recurring rule, when the send time arrives (e.g. 48 hours before), then the match is created and the invitations are sent without intervention.
- I can pause a rule without deleting it.
- Running the cron twice does not create two matches for the same date.

### FUT-15 · Organizer commands via WhatsApp
**Epic:** Summary · **Priority:** P1 · **Depends on:** FUT-10

As an organizer, I want to handle the basics from the bot chat so as not to open a dashboard.

Acceptance criteria:
- `STATUS`, `REMEMBER`, `CLOSE` and `HELP` work only from the organizer number.
- An unknown command responds with the command list.

### FUT-16 · Organizer web panel
**Epic:** Panel · **Priority:** P1 · **Depends on:** FUT-10

As an organizer, I want a page with players, matches and answers to see everything at a glance.

Acceptance criteria:
- The panel is protected by login (Supabase Auth, only my email).
- I can create matches, edit players and see responses in real time.
- Works well on cell phone.

---

## P2 · Polish and operate

### FUT-17 · Cancel match and notify
**Epic:** Matches · **Priority:** P2 · **Depends on:** FUT-08

As an organizer, I want to cancel a game due to rain and let everyone know in one step.

Acceptance criteria:
- Given an open match, when I cancel it, then everyone who answered I'm Going or Maybe receives a notice and the match becomes `cancelled`.
- An optional reason can be indicated.

### FUT-18 · Voluntary withdrawal of the player
**Epic:** Players · **Priority:** P2 · **Depends on:** FUT-09

As a player, I want to stop receiving invitations by writing LOWER.

Acceptance criteria:
- Given a player who writes `LOW`, then he becomes inactive, receives confirmation and does not receive any more invitations.
- `HIGH` reactivates it.

### FUT-19 · Attendance Statistics
**Epic:** Panel · **Priority:** P2 · **Depends on:** FUT-16

As an organizer, I want to see who comes the most and who cancels late to prioritize the regulars.

Acceptance criteria:
- The panel shows by player: invitations, assists, late withdrawals and response rate in the last 3 months.

### FUT-20 · Bug and cost monitoring
**Epic:** Operation · **Priority:** P2 · **Depends on:** FUT-08

As an organizer, I want to know if messages fail or the cost goes up.

Acceptance criteria:
- Status webhooks (`sent`, `delivered`, `read`, `failed`) are saved by invitation.
- If more than 20% of a shipment fails, I receive an alert.
- A monthly summary shows submitted templates and estimated cost.

### FUT-21 · Go to production number
**Epic:** Operation · **Priority:** P2 · **Depends on:** FUT-10

As an organizer, I want a definitive number to invite the entire group, not just test recipients.

Acceptance criteria:
- The number is registered and verified, with an approved visible name and payment method in the WhatsApp Business account.
- The approved template works from the new number and all players receive it.