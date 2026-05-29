# 06 — Environment Variables

Reference: `.env.example`

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled Neon PostgreSQL connection string (runtime) |
| `DIRECT_URL` | Non-pooled Neon connection string (used by Prisma migrations) |
| `BETTER_AUTH_SECRET` | Random 32+ char secret for Better Auth session signing |
| `BETTER_AUTH_URL` | Public base URL of the app (e.g. `https://yourapp.netlify.app`) |
| `NEXT_PUBLIC_APP_URL` | Same as above — exposed to the browser |

## Optional — OAuth providers

Leave these unset to disable the corresponding sign-in button.

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |

OAuth redirect URIs to configure:
- Google: `{BETTER_AUTH_URL}/api/auth/callback/google`
- GitHub: `{BETTER_AUTH_URL}/api/auth/callback/github`

## Optional — Transactional email

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key. Get one at https://resend.com/api-keys |
| `RESEND_FROM_EMAIL` | From address, e.g. `noreply@yourdomain.com`. Must be a verified domain in Resend. |

If `RESEND_API_KEY` is absent, all email functions log a warning and skip sending. Invite accept links are still logged to console and copied to clipboard.

## Required for cron

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Shared secret for the cron endpoint auth guard. Set on Netlify and locally. |

## Dev-only

| Variable | Description |
|----------|-------------|
| `PREFER_IPV4` | Set to `"true"` on networks with broken IPv6. Leave unset in cloud. |
