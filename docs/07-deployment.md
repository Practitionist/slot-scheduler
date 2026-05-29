# 07 — Deployment

## Netlify

The app deploys on Netlify via `@netlify/plugin-nextjs`.

### Steps

1. Connect the `Practitionist/slot-scheduler` GitHub repo in Netlify.
2. Set all required environment variables (see `docs/06-env-vars.md`) in Netlify → Site settings → Environment variables.
3. Netlify auto-detects the Next.js build command (`npm run build`).
4. Scheduled Functions in `netlify/functions/` are picked up automatically — no extra config needed.

### Scheduled Functions

| Function | Schedule | Triggers |
|----------|----------|---------|
| `scheduled-cleanup` | `@daily` | `POST /api/cron/cleanup` |
| `appointment-reminders` | `0 8 * * *` (08:00 UTC) | `POST /api/cron/reminders` |

The `CRON_SECRET` env var must be set in Netlify for the functions to authenticate successfully.

## Database (Neon)

1. Create a Neon project at https://neon.tech.
2. Copy the **pooled** connection string → `DATABASE_URL`.
3. Copy the **non-pooled** (direct) connection string → `DIRECT_URL`.
4. Run migrations: `npx prisma migrate deploy` (or `migrate dev` locally).

For preview branches, create a separate Neon branch (see issue #12).

## GitHub Pages (Docusaurus user docs)

User-facing docs live in `website/` and are deployed via GitHub Actions to GitHub Pages.

- Branch: `gh-pages`
- Workflow: `.github/workflows/docs.yml`
- Trigger: push to `dev` touching `website/**`
- URL: `https://practitionist.github.io/slot-scheduler/`

Configure GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch, root.
