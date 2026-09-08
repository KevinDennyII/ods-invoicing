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

Built around Invoice Ninja, then layered with a modern client experience and zero-trust
ops — no open ports, no secrets on disk.

- 🥷 **Invoice Ninja** — system of record: clients, invoices, recurring schedules, PDFs
- 🗄️ **MySQL 8 + Redis** — Invoice Ninja data + BFF sessions / queues
- 🎛️ **nginx** — reverse proxy in front of Invoice Ninja (and local portal-edge)
- ⚛️ **React 18 · Vite · React Router** — branded client portal
- 🟩 **Netlify** — hosts the portal SPA; proxies `/api` to the BFF
- 🟢 **Node · Express BFF** — magic-link auth, CSRF, rate limits, client-scoped API
- 💳 **Stripe** — card + ACH via Invoice Ninja; payouts land in Novo
- ☁️ **Cloudflare** — DNS + Tunnel ingress (see below)
- 🔐 **Infisical** — runtime secrets (see below)
- 🐳 **Docker Compose** — one stack on the Mac today, same stack on a VPS later
- 🛠️ **`./scripts/ods`** — `infisical run` + compose: check, up, logs, backup

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

**Today:** Docker on this Mac (must be awake for API/admin).  
**Later:** Same Compose on an always-on VPS; Netlify stays
([docs/vps-migration.md](docs/vps-migration.md)).

The portal uses same-origin `/api` calls. Netlify rewrites those to `api.pay` so session and
CSRF cookies stay on `pay.ohhdennyservices.com`.

## Cloudflare

DNS for the zone lives at Cloudflare. A **Tunnel** (connector in Docker Compose) publishes
only `api.pay` → BFF and `admin.pay` → Invoice Ninja — no host ports open. The client
portal on `pay` is Netlify, not the tunnel. Details:
[hosting-and-tunnels.md](docs/hosting-and-tunnels.md).

## Infisical

All secrets live in self-hosted Infisical at
[secrets.thatdeveloper.dev](https://secrets.thatdeveloper.dev) under `/ods-invoicing`.
`./scripts/ods` injects them at runtime via `infisical run` — nothing sensitive is committed.
Key names: [`.env.example`](.env.example). Bootstrap: `./scripts/make-upload-env`.

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

- 🚀 [chunk-1-first-boot.md](docs/chunk-1-first-boot.md) — secrets + first Docker boot
- 🔌 [chunk-2-api-hostname.md](docs/chunk-2-api-hostname.md) — `api.pay` tunnel route
- 🟩 [netlify-portal.md](docs/netlify-portal.md) — deploy portal + DNS cutover
- 🎨 [invoice-ninja-setup.md](docs/invoice-ninja-setup.md) — logo, colors, Stripe, hardening
- 📦 [novo-migration.md](docs/novo-migration.md) — move recurring clients off Novo
- 🖥️ [vps-migration.md](docs/vps-migration.md) — move Docker off the Mac later
- 🌐 [dns-replit-coexistence.md](docs/dns-replit-coexistence.md) — DNS vs Replit / mail
- ☁️ [hosting-and-tunnels.md](docs/hosting-and-tunnels.md) — Netlify + tunnel rules

## Security posture

- No published host ports; Cloudflare Tunnel is the only ingress to Docker.
- Admin API token and SMTP credentials live in the BFF process, never the browser.
- Sessions: httpOnly + Secure + SameSite cookies in Redis; double-submit CSRF.
- Magic links: single-use, 15 minutes, stored as SHA-256 hashes only.
- Sign-in responses are identical for known and unknown emails; rate limited.
- Portal is `noindex` (`apps/portal/public/robots.txt`).
- Backup before image upgrades: `./scripts/ods backup`.
