# 02 — Authentication

## Provider: Better Auth

Config lives in `lib/auth.ts`. The client hooks live in `lib/auth-client.ts`.

### Sign-in methods

| Method | Enabled by default | Requires env vars |
|--------|--------------------|-------------------|
| Email + password | Yes | — |
| Google OAuth | Only if both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set | See `.env.example` |
| GitHub OAuth | Only if both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set | See `.env.example` |

Providers with missing credentials are silently skipped (see `lib/oauth.ts`).

### Account linking

If the same verified email signs in via two different providers, Better Auth links them to one `User` row. Only `trustedProviders` (Google, GitHub) are used for auto-linking — unverified email providers are excluded.

### Custom user fields

`User.timezone` — IANA timezone name (e.g. `Asia/Kolkata`). Captured from the browser's `Intl.DateTimeFormat` on the sign-up page. Defaults to `Asia/Kolkata`.

### Session flow

1. Sign in → Better Auth creates a `Session` row and sets an HTTP-only cookie.
2. Server components call `auth.api.getSession({ headers: await headers() })`.
3. The organization plugin extends the session with `activeOrganizationId` and `activeTeamId`.

### Account deletion with succession guard

`user.deleteUser.beforeDelete` in `lib/auth.ts`:
- If the user owns an org that has other members, throws `BAD_REQUEST` — they must transfer ownership first.
- If they own sole-member orgs, those orgs are deleted automatically (DB cascades handle teams/products/etc.).

### Rate limiting

100 requests per 60-second window on all Better Auth endpoints (`rateLimit: { enabled: true, window: 60, max: 100 }`).

## Invitation flow

1. Admin calls `authClient.organization.inviteMember({ email, role, teamId? })` from the `/org` page.
2. Better Auth creates an `Invitation` row (status: `pending`, expires in 48 h).
3. `sendInvitationEmail` in `lib/auth.ts` fires — calls `lib/email.ts` to send via Resend, and also logs the accept URL to console as a dev fallback.
4. Invitee clicks the link: `/auth/accept-invitation?id={invitationId}`.
5. If not signed in, they're redirected to sign-in and back.
6. `authClient.organization.acceptInvitation({ invitationId })` adds them as a `Member`.

## Join-by-code flow

An alternative to email-specific invitations:

1. Admin generates a join code via `/org` page → `POST /api/join-codes`.
2. Admin shares the code and the URL `{baseUrl}/join`.
3. User navigates to `/join`, enters the code, submits.
4. `POST /api/join` validates the code (expiry, max uses), adds the user as a `Member`, optionally adds them to a team/product, and increments `uses`.

See `docs/09-join-codes.md` for full details.
