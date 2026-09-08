# ODS Invoicing

Self-hosted invoicing for **OhhDenny Services, LLC**. The system of record is
[Invoice Ninja](https://github.com/invoiceninja/invoiceninja) (clients, invoices, recurring
schedules, Stripe autopay). A custom React portal at `pay.ohhdennyservices.com` is the
client-facing surface. Admin work stays in Invoice Ninja at `admin.pay.ohhdennyservices.com`.

Novo remains the business bank account. Stripe deposits there; Novo is no longer the
invoicing tool.

## What this is for

| Audience | URL | Purpose |
| --- | --- | --- |
| Clients | `https://pay.ohhdennyservices.com` | Sign in (magic link), view invoices, pay, enable autopay |
| You (admin) | `https://admin.pay.ohhdennyservices.com` | Invoice Ninja: clients, products, Stripe, branding |
| Portal API | `https://api.pay.ohhdennyservices.com` | BFF used by the portal (not for browsers directly) |

Marketing (`ohhdennyservices.com`) and expenses (`expenses.ohhdennyservices.com`) stay on
Replit and are out of scope for this repo.

## Why Invoice Ninja + a custom portal

Invoice Ninja already does recurring invoices, Stripe gateways, PDF generation, and
auto-bill. Its `/api/v1` is **admin-scoped**: one token can read every client. Putting that
token in a browser would expose the whole book of business.

So the portal never talks to Invoice Ninja directly. A small Node **BFF** holds the token,
authenticates the contact with a magic link, and scopes every query to that contact’s
`client_id`. Card numbers never touch this stack — Pay / Autopay hand off to Invoice Ninja’s
Stripe-hosted payment pages.

## Tech stack

| Layer | Choice |
| --- | --- |
| Invoicing core | Invoice Ninja (Debian Docker image) + MySQL 8 + Redis |
| Admin UI | Invoice Ninja web app behind nginx |
| Client portal | React 18 + Vite + React Router |
| Portal hosting | Netlify (static SPA); `/api` proxied to the BFF |
| BFF | Node.js + Express, Redis sessions, magic-link auth, CSRF, rate limits |
| Payments | Stripe via Invoice Ninja (card + ACH); payouts to Novo |
| Ingress to Docker | Cloudflare Tunnel (`cloudflared` in Compose — no published host ports) |
| Secrets | Self-hosted Infisical (`https://secrets.thatdeveloper.dev`) |
| Ops | `./scripts/ods` wraps `infisical run` + `docker compose` |

## Architecture

```
                         Cloudflare DNS / edge
                                   |
         +-------------------------+--------------------------+
         |                         |                          |
   pay (Netlify)            api.pay (tunnel)           admin.pay (tunnel)
   static React SPA              |                          |
         |                       v                          v
         |               cloudflared (Docker) -----> ninja-nginx -> Invoice Ninja
         |                       |                      MySQL + Redis
         +------ /api proxy ---->+-----> BFF
                                   Redis sessions
                                   NINJA_API_TOKEN (server only)
```

**Today:** Docker runs on this Mac (laptop must be awake for API/admin).  
**Later:** Same Compose stack on an always-on VPS; Netlify and DNS stay put
([docs/vps-migration.md](docs/vps-migration.md)).

### Cookie / API shape

The portal calls `fetch('/api…', { credentials: 'same-origin' })`. Netlify rewrites `/api/*`
to `https://api.pay.ohhdennyservices.com` so session and CSRF cookies stay on
`pay.ohhdennyservices.com`.

## Cloudflare

- DNS for `ohhdennyservices.com` is at Cloudflare (registrar can stay Namecheap).
- **Tunnel** exposes only Docker services that need the public internet:
  - `api.pay` → `bff:8080`
  - `admin.pay` → `ninja-nginx:80`
- After Netlify cutover, **`pay` is not on the tunnel** — it is a Netlify custom domain.
- The connector must run **inside Docker** on the same network as `bff` / `ninja-nginx`.
  A macOS `cloudflared` service cannot resolve those names and will 502. See
  [docs/hosting-and-tunnels.md](docs/hosting-and-tunnels.md).
- Prefer Cloudflare Access on `admin.pay` (your email only). Leave `pay` and `api.pay`
  reachable for clients; the portal has its own magic-link auth.

## Infisical (secrets)

Secrets never live in committed `.env` files. They live in Infisical:

- Domain: `https://secrets.thatdeveloper.dev`
- Project path: `/ods-invoicing` (env `dev` for local)
- Repo marker: [`.infisical.json`](.infisical.json) (project id + domain only — safe to commit)

Every ops command injects secrets at runtime:

```bash
INFISICAL_DOMAIN=https://secrets.thatdeveloper.dev \
  infisical run --env=dev --path=/ods-invoicing -- <command>
```

`./scripts/ods` does that for you. Key names (empty values) are listed in
[`.env.example`](.env.example). Bootstrap a one-time upload file with
`./scripts/make-upload-env`, import into Infisical, then delete the file
(`.env.infisical-upload` is gitignored).

Do **not** run `infisical export` into a project `.env`.

## Quick start (Mac backend)

```bash
./scripts/make-upload-env   # fill PASTE_ values, import to Infisical, rm the file
./scripts/ods check         # boot secrets required; NINJA_API_TOKEN may be pending
./scripts/ods up            # MySQL, Redis, Invoice Ninja, BFF, cloudflared, portal-edge
```

Then follow [docs/chunk-1-first-boot.md](docs/chunk-1-first-boot.md): open admin, create the
API token, store `NINJA_API_TOKEN`, remove first-boot `IN_USER_*` secrets.

Portal on Netlify: [docs/netlify-portal.md](docs/netlify-portal.md).  
Branding + Stripe: [docs/invoice-ninja-setup.md](docs/invoice-ninja-setup.md).

## Client checklist

1. Sign in at `https://pay.ohhdennyservices.com` with the invoice email (magic link).
2. Open an invoice → **Pay now** or **Download PDF**.
3. **Autopay** → add a payment method → turn autopay on.

If they see “Billing is temporarily unavailable,” the Docker backend is down (Mac asleep or
VPS stopped). The Netlify page still loads.

## Repository layout

```
netlify.toml            Portal build + /api proxy to api.pay
docker-compose.yml      Invoice Ninja + MySQL + Redis + BFF + portal-edge + cloudflared
apps/bff/               Node BFF
apps/portal/            Vite + React (Netlify publish dir: dist)
branding/               ODS logo for Invoice Ninja upload
infra/nginx/            nginx configs for Invoice Ninja and local portal-edge
docs/                   Runbooks (boot, DNS, Netlify, Novo, VPS)
scripts/ods             check | up | down | logs | backup | appkey | sessionkey
scripts/make-upload-env One-time Infisical import helper
```

## Docs

| Doc | Topic |
| --- | --- |
| [chunk-1-first-boot.md](docs/chunk-1-first-boot.md) | Secrets + first Docker boot |
| [chunk-2-api-hostname.md](docs/chunk-2-api-hostname.md) | `api.pay` tunnel route |
| [netlify-portal.md](docs/netlify-portal.md) | Deploy portal + DNS cutover |
| [invoice-ninja-setup.md](docs/invoice-ninja-setup.md) | Logo, colors, Stripe, hardening |
| [novo-migration.md](docs/novo-migration.md) | Move recurring clients off Novo |
| [vps-migration.md](docs/vps-migration.md) | Move Docker off the Mac later |
| [dns-replit-coexistence.md](docs/dns-replit-coexistence.md) | DNS ownership vs Replit / mail |
| [hosting-and-tunnels.md](docs/hosting-and-tunnels.md) | Netlify + tunnel rules |

## Security posture

- No published host ports; Cloudflare Tunnel is the only ingress to Docker.
- Admin API token and SMTP credentials live in the BFF process, never the browser.
- Sessions: httpOnly + Secure + SameSite cookies in Redis; double-submit CSRF.
- Magic links: single-use, 15 minutes, stored as SHA-256 hashes only.
- Sign-in responses are identical for known and unknown emails; rate limited.
- Portal is `noindex` (`apps/portal/public/robots.txt`).
- Backup before image upgrades: `./scripts/ods backup`.
