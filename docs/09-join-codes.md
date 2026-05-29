# 09 — Join Codes

Join codes let people join an organization (and optionally a team or product) by entering a short alphanumeric code, without needing a per-email invitation.

## Use cases

- Onboarding a cohort of interns: share one code for the whole batch.
- Conference or workshop: post the code in a shared doc.
- Guest access with limited uses and an expiry date.

## Generating a code (admin)

1. Go to `/org` → "Join codes" section (visible to org admins and owners only).
2. Optionally select:
   - **Team scope** — joiner is also added to this team
   - **Product scope** — joiner is also added to this product
   - **Expires in (days)** — leave empty for no expiry
   - **Max uses** — leave empty for unlimited
3. Click "Generate code".
4. Click "Copy" next to the new code — copies the join URL and code to your clipboard.

## Joining with a code (user)

1. Navigate to `{appUrl}/join`.
2. Enter the code (case-insensitive).
3. Click "Join" — you're added to the org (and team/product if scoped) and redirected to `/overview`.

## Code format

8 characters, uppercase alphanumeric, excluding ambiguous characters (`0`, `O`, `1`, `I`).  
Example: `AB3X7YKZ`

## Lifecycle

- **Expiry**: Expired codes are rejected at join time and deleted by the nightly cleanup cron.
- **Max uses**: Exhausted codes (uses ≥ maxUses) are rejected at join time and deleted by the nightly cleanup cron.
- **Revoke**: Admins can revoke any code from the `/org` page at any time (hard delete).

## API

- `GET /api/join-codes` — list codes for the active org (admin)
- `POST /api/join-codes` — create a code (admin). Body: `{ teamId?, productId?, expiresInDays?, maxUses? }`
- `DELETE /api/join-codes/:id` — revoke a code (admin)
- `POST /api/join` — consume a code (any authenticated user). Body: `{ code: string }`
