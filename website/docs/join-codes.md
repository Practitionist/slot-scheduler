---
sidebar_position: 4
---

# Join codes

Join codes let people join your organization (and optionally a team or product) by entering a short code — without needing a per-email invitation.

## When to use join codes

- Onboarding a large cohort of interns at once.
- Sharing access at a workshop or event.
- Any situation where you want a self-serve join link.

## Generating a code (admin)

1. Go to **Organization** → "Join codes".
2. Optionally configure:
   - **Team scope** — joiners are also added to this team
   - **Product scope** — joiners are also added to this product
   - **Expires in** — number of days until the code stops working
   - **Max uses** — limit how many people can use it
3. Click **Generate code**.
4. Click **Copy** — the join URL and code are copied to your clipboard.

## Joining with a code

1. Go to `{appUrl}/join`.
2. Enter the code (not case-sensitive).
3. Click **Join** — you're added to the org and redirected to your dashboard.

## Revoking a code

Click **Revoke** next to any code on the Organization page to immediately disable it.

## Code format

Codes are 8 characters: uppercase letters and digits, with ambiguous characters (`0`, `O`, `1`, `I`) excluded to avoid confusion.

Example: `AB3X7YKZ`
