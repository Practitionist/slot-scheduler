# 00 — Practitionist: Product & Infrastructure Organization

## Company structure

**Practitionist** is the registered company. All products and infrastructure live under its accounts.

| Product | Domain | Netlify site | GitHub repo | Status |
|---------|--------|-------------|-------------|--------|
| Slot Scheduler | TBD / slot-scheduler.netlify.app | slot-scheduler | Practitionist/slot-scheduler | Active |
| Familiarize | familiarisenow.com | familiarisenow.com | Practitionist/? | Active |
| Tiringly | tiringly.com | tiringly.com | Practitionist/? | Active |
| Practitionist (company site) | practitionist.com | practitionist.com | Practitionist/? | Active |
| NoteUps | — | noteups-legacy ⚠️ | — | Legacy |

---

## GitHub

**Org:** `Practitionist` — all product repos live here. Never use a personal account repo for active products.

### Branching convention (per product)
```
dev    ← active development, feature branches merge here
prod   ← production, always a merge from dev (never direct commits)
```
Feature branches: `feat/<name>`, `fix/<name>`, `chore/<name>` — always branch from and PR into `dev`.

### Teams (recommended)
Consider adding GitHub teams inside the org:
- `owners` — full access to all repos
- `slot-scheduler` — repo-scoped access for contractors/interns on that product
- `familiarize`, `tiringly`, etc. — scoped per product

---

## Netlify

**Team:** `Practitionist-Deploys` — all sites live here.

### One site per product, branch deploys per environment

Each product should have **one Netlify site** with branch deploys — not separate sites per environment.

| Product | Production branch | Dev branch deploy URL |
|---------|------------------|-----------------------|
| Slot Scheduler | `prod` → slot-scheduler.netlify.app | `dev` → dev--slot-scheduler.netlify.app |
| Familiarize | `prod` → familiarisenow.com | `dev` → dev--familiarisenow.netlify.app |
| Tiringly | `prod` → tiringly.com | `dev` → dev--tiringly.netlify.app |

**Do not** create a separate `dev-<product>` Netlify site — use branch deploys on the same site instead.

### Environment variables per site
Each Netlify site should have its own isolated env vars. Common pattern:

```
DATABASE_URL          # product-specific Neon project
DIRECT_URL            # product-specific Neon project
BETTER_AUTH_SECRET    # unique per product, 32+ chars
BETTER_AUTH_URL       # the production domain of that product
NEXT_PUBLIC_APP_URL   # same as above
RESEND_API_KEY        # can be shared or per-product (see Resend section)
RESEND_FROM_EMAIL     # product-specific from address
CRON_SECRET           # unique per product
GOOGLE_CLIENT_ID/SECRET  # per product (each needs its own OAuth app)
GITHUB_CLIENT_ID/SECRET  # per product
```

---

## Resend (Transactional Email)

**Account:** One Resend account/workspace for Practitionist. Use sub-accounts or separate API keys per product.

### Domain strategy

**Option A — Company domain (recommended if you want a unified brand):**
Verify `practitionist.com` in Resend. Send from product-specific addresses:
- `slotscheduler@practitionist.com`
- `familiarize@practitionist.com`
- `tiringly@practitionist.com`

**Option B — Product domains (recommended if each product is its own brand):**
Verify each product domain separately in Resend:
- `noreply@familiarisenow.com`
- `noreply@tiringly.com`
- `noreply@<slot-scheduler-domain>.com`

**Option C — Hybrid:**
Verify `practitionist.com` for company emails and each product domain for product transactional emails.

### API key strategy
Create one API key per product (not one shared key). This way:
- A compromised key only affects one product
- Usage and logs are isolated per product
- Keys can be rotated independently

In Resend: Settings → API Keys → "Create API Key" → name it `slot-scheduler-prod`, `familiarize-prod`, etc.

---

## Neon (Database)

**One Neon project per product.** Each project has its own compute, branches, and connection strings.

- Branch `main` → production (`DATABASE_URL` pooled, `DIRECT_URL` non-pooled)
- Branch `dev` (Neon branch, not GitHub branch) → development/preview environments

This matches the GitHub branching model and keeps production data isolated.

---

## Custom domains

Register all product domains under a single registrar for easier management (Cloudflare recommended — free DNS, DDoS protection, easy Netlify integration).

For Netlify custom domains:
1. Add domain in Netlify: Site → Domain management → Add custom domain
2. Point DNS CNAME/A records to Netlify's nameservers or use Netlify DNS

---

## Recommended checklist for launching a new product

- [ ] Create repo under `Practitionist` org with `dev` and `prod` branches
- [ ] Create Netlify site in `Practitionist-Deploys`, connect `prod` branch, enable branch deploys for `dev`
- [ ] Create a Neon project; set `DATABASE_URL` and `DIRECT_URL` in Netlify env vars
- [ ] Create a Resend API key named `<product>-prod`; verify the sending domain
- [ ] Register OAuth apps (Google, GitHub) pointing to the product's domain
- [ ] Set all env vars in Netlify before first deploy
- [ ] Add a custom domain in Netlify and update DNS
