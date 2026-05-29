# 08 — Invitations

## How it works

Invitations are managed by Better Auth's organization plugin. Each invitation is scoped to an organization and optionally a team.

### Sending an invitation (admin)

1. Go to `/org` → "Invite a member" section.
2. Enter the invitee's email and optionally select a team.
3. Click "Create invite link".
4. Better Auth creates an `Invitation` row (expires in 48 hours by default).
5. Resend sends an email to the invitee with the accept link.
6. The accept link is also copied to your clipboard as a backup.

### Accepting an invitation (invitee)

1. Click the link in the email: `/auth/accept-invitation?id={invitationId}`.
2. If not signed in, the page redirects to sign-in and back.
3. The user must sign in with the **same email address** the invitation was sent to.
4. Click "Accept" — Better Auth creates a `Member` row and the invitation status is updated.
5. Redirected to `/overview`.

### Pending invitations

The `/org` page shows all pending invitations. Admins can re-copy the accept link for any pending invitation.

## Resend setup

1. Create an account at https://resend.com.
2. Add and verify your sending domain (or use Resend's shared domain for testing).
3. Create an API key → copy it.
4. Set `RESEND_API_KEY=re_...` and `RESEND_FROM_EMAIL=noreply@yourdomain.com` in your Netlify environment (and local `.env`).

Email functions are in `lib/email.ts`. If `RESEND_API_KEY` is unset, all functions log a warning and return early — the app still works without email.

## Email templates

All templates are plain HTML strings in `lib/email.ts`. To customize:

- `sendInvitationEmail` — org invite
- `sendAppointmentInviteEmail` — sent when a new appointment is created with attendees
- `sendAppointmentReminderEmail` — sent by the nightly reminder cron
