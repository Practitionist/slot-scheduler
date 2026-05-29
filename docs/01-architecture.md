# 01 — Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Auth | Better Auth 1.6 (email/password + OAuth) |
| Database | Neon serverless PostgreSQL |
| ORM | Prisma 7 (Neon HTTP adapter) |
| Email | Resend |
| UI | shadcn/ui + Radix UI + Tailwind 4 |
| Deployment | Netlify + Netlify Scheduled Functions |

## Repository layout

```
app/                   Next.js App Router
  (app)/               Authenticated app shell
    overview/          Home dashboard
    my-slots/          Availability slot editor
    heatmap/           Team overlap heatmap
    appointments/      Meeting RSVP
    org/               Org + team + product management
  auth/                Auth pages (sign-in, sign-up, accept-invitation)
  join/                Public join-by-code page
  api/                 Route handlers
    auth/[...all]/     Better Auth catch-all
    slots/             CRUD for availability slots
    appointments/      CRUD + RSVP for meetings
    products/          CRUD for products
    join-codes/        Admin CRUD for join codes
    join/              Public POST to consume a join code
    cron/cleanup/      Nightly zombie sweep
    cron/reminders/    Nightly appointment reminder sweep
components/            Shared React components
lib/                   Shared server/client utilities
  auth.ts              Better Auth server config
  auth-client.ts       Browser auth hooks
  email.ts             Resend email helpers
  heatmap.ts           Timezone-aware overlap computation
  org-guard.ts         Org/admin auth helpers
  prisma.ts            Prisma client singleton
netlify/functions/     Netlify Scheduled Functions
  scheduled-cleanup    Daily cleanup trigger
  appointment-reminders Daily reminder trigger
prisma/schema.prisma   Database schema
docs/                  Developer documentation (this folder)
website/               Docusaurus user-facing docs (→ GitHub Pages)
```

## Key design decisions

- **Timezone-first**: All availability slots store wall-clock `HH:MM` times in the owner's IANA timezone. The heatmap converts every slot to the viewer's timezone before rendering.
- **No soft deletes**: Hard deletes everywhere; the nightly cron sweeps orphans (empty teams/products, expired invitations, expired join codes, old appointments).
- **Neon HTTP adapter**: Prisma uses Neon's HTTP transport, which doesn't support batched transactions. All multi-step DB operations run sequentially.
- **Better Auth org plugin**: Organizations, members, teams, and email-based invitations are managed by the Better Auth organization plugin. Custom join codes live in our own `JoinCode` table.
