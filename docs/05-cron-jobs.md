# 05 — Cron Jobs

Cron jobs run as Netlify Scheduled Functions (`netlify/functions/`). The actual logic lives in Next.js route handlers so they have first-class Prisma access; the Netlify functions simply POST to those routes with a shared secret.

## Setup

1. Set `CRON_SECRET` to a random string (32+ chars recommended) in your Netlify site's environment variables.
2. Set the same `CRON_SECRET` in your local `.env` if you want to test manually.

To manually trigger either cron in dev:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Nightly cleanup (`@daily`)

**Netlify function:** `netlify/functions/scheduled-cleanup.mts`  
**Route:** `app/api/cron/cleanup/route.ts`

Tasks (run sequentially — Neon HTTP has no batch transactions):

| Task | Condition |
|------|-----------|
| Delete expired invitations | `status = 'pending' AND expiresAt < now` |
| Delete empty teams | `no teamMembers AND createdAt < now - 7 days` |
| Delete empty products | `no members AND createdAt < now - 7 days` |
| Delete memberless orgs | `no members` (cascades teams/products/invitations) |
| Delete expired join codes | `expiresAt < now` |
| Delete exhausted join codes | `maxUses IS NOT NULL AND uses >= maxUses` |
| Delete old appointments | `endsAt < now - 90 days` |

The 7-day grace period for teams/products prevents freshly-created starter teams from being swept before anyone joins.

## Daily reminders (`0 8 * * *` — 08:00 UTC)

**Netlify function:** `netlify/functions/appointment-reminders.mts`  
**Route:** `app/api/cron/reminders/route.ts`

- Queries all appointments starting within the next 24 hours.
- Sends a reminder email (via Resend) to the organizer and all accepted attendees.
- Requires `RESEND_API_KEY` to be set; silently skips if not configured.
