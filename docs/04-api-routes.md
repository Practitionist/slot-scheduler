# 04 — API Routes

All routes live under `app/api/`. Server-side auth uses `auth.api.getSession({ headers: await headers() })`.

## Availability Slots

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/slots` | User | List all slots (paginated) |
| POST | `/api/slots` | User | Create a slot |
| GET | `/api/slots/me` | User | Current user's slots |
| GET | `/api/slots/[id]` | User | Single slot |
| PUT | `/api/slots/[id]` | User (owner) | Update slot |
| DELETE | `/api/slots/[id]` | User (owner) | Delete slot |

## Appointments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/appointments` | User | Appointments the user organizes or attends |
| POST | `/api/appointments` | User | Create appointment; sends invite emails to attendees |
| GET | `/api/appointments/[id]` | User | Single appointment |
| DELETE | `/api/appointments/[id]` | User (organizer) | Delete appointment |
| POST | `/api/appointments/[id]/respond` | User (attendee) | Accept or decline RSVP |

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Org member | List products for active org |
| POST | `/api/products` | Org admin | Create product |
| GET | `/api/products/[id]` | Org member | Single product |
| PUT | `/api/products/[id]` | Org admin | Rename product |
| DELETE | `/api/products/[id]` | Org admin | Delete product |
| GET | `/api/products/[id]/members` | Org member | List product members |
| POST | `/api/products/[id]/members` | Org admin | Add member to product |
| DELETE | `/api/products/[id]/members` | Org admin | Remove member from product |

## Join Codes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/join-codes` | Org admin | List active codes for active org |
| POST | `/api/join-codes` | Org admin | Generate a new join code |
| DELETE | `/api/join-codes/[id]` | Org admin | Revoke (hard-delete) a code |
| POST | `/api/join` | User (any) | Consume a join code — adds user to org/team/product |

## Cron (secret-guarded)

All cron routes require `Authorization: Bearer $CRON_SECRET`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cron/cleanup` | Nightly sweep: expired invitations, empty teams/products, memberless orgs, expired/exhausted join codes, old appointments |
| POST | `/api/cron/reminders` | Daily: send reminder emails for appointments starting in the next 24 h |

## Auth (Better Auth catch-all)

`/api/auth/[...all]` — handled by Better Auth. Covers sign-in, sign-up, OAuth callbacks, session management, organization operations, and invitation management.
