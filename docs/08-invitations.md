# 08 — Invitations

There are two ways to bring someone into an organization: **email invitations** (per-person) and **join codes** (cohort/group). Both support WhatsApp sharing. See `docs/09-join-codes.md` for join codes.

---

## Email invitations

### Sending an invitation (admin)

1. Go to **Organization** → "Invite a member".
2. Enter the invitee's email and optionally select a team.
3. Choose how to share the invite link:
   - **Copy link** — creates the invite, copies the accept URL to your clipboard
   - **WhatsApp** — creates the invite, opens WhatsApp (app on mobile / Web on desktop) with the accept link pre-filled ready to paste into a group
4. An email is also sent automatically if `RESEND_API_KEY` is configured (see Resend setup below).

### Accepting an invitation (invitee)

1. Click the link from WhatsApp, clipboard, or email: `/auth/accept-invitation?id={invitationId}`.
2. Sign in (or create an account) with the **same email address** the invitation was sent to.
3. Click **Accept** — added to the organization, redirected to `/overview`.

### Pending invitations

The **Pending invitations** card on the Organization page lists every unaccepted invite. Each row has:
- **Copy link** — re-copy the accept URL
- **WhatsApp** — re-share via WhatsApp

### Invitation expiry

Invitations expire after 48 hours. If one expires, send a new one — the nightly cleanup cron removes stale pending invitations automatically.

---

## Resend setup (transactional email)

Without Resend, invitations still work — the admin shares the link manually via WhatsApp or clipboard. Resend adds automatic email delivery on top.

### Steps

1. **Create a Resend account** at [resend.com](https://resend.com). Create one workspace named **Practitionist** so all products share one billing account.

2. **Verify your sending domain**
   - Resend → Domains → Add Domain
   - Enter `practitionist.com` (company domain) or a product domain
   - Add the DNS records Resend provides (TXT for SPF/DKIM) in your DNS provider
   - Click Verify — takes 1–5 minutes
   - For quick testing without a domain: Resend's sandbox `@resend.dev` domain delivers only to your own verified email

3. **Create an API key**
   - Resend → API Keys → Create API Key
   - Name: `slot-scheduler-prod`
   - Permission: Sending access
   - Domain: restrict to your verified domain (recommended)
   - Copy the key — shown only once

4. **Set env vars in Netlify**
   - Netlify → slot-scheduler site → Site configuration → Environment variables
   
   | Variable | Value |
   |----------|-------|
   | `RESEND_API_KEY` | `re_xxxxxxxxxxxx` |
   | `RESEND_FROM_EMAIL` | e.g. `slotscheduler@practitionist.com` |

5. **Trigger a redeploy** — Deploys → Trigger deploy → Deploy site

6. **Test** — invite someone from `/org`, check Resend → Emails for delivery confirmation

### Email templates

All templates are plain HTML strings in `lib/email.ts`:

| Function | Sent when |
|----------|-----------|
| `sendInvitationEmail` | Admin sends an email invitation |
| `sendAppointmentInviteEmail` | New appointment created with attendees |
| `sendAppointmentReminderEmail` | Nightly cron, 24 h before an appointment |

If `RESEND_API_KEY` is not set, all functions log a warning and skip silently — the app works fully without email.

---

## WhatsApp sharing

WhatsApp sharing uses the standard `wa.me/?text=…` share URL — no API key needed.

- On **mobile**: opens the WhatsApp app with the message pre-filled; pick a group and tap Send
- On **desktop**: opens WhatsApp Web with the message pre-filled

### Where WhatsApp buttons appear

| Location | Message sent |
|----------|-------------|
| Invite form → **WhatsApp** button | `"You've been invited to join *Org Name*... Accept: <link>"` |
| Pending invitations list → **WhatsApp** per row | Same accept link, re-shareable |
| Join codes list → **WhatsApp** per code | `"Join *Org Name*... Open /join, enter code: *ABCD1234*"` |
