# Netlify: client portal cutover

Ships `https://pay.ohhdennyservices.com` as a static React app. The BFF remains on
Docker behind `https://api.pay.ohhdennyservices.com`.

## Prerequisites

- Chunk 1 done: Docker stack healthy, admin user exists, `NINJA_API_TOKEN` in Infisical.
- Chunk 2 done: tunnel public hostname `api.pay` → `http://bff:8080` (no trailing space).
- Infisical `PORTAL_ORIGIN=https://pay.ohhdennyservices.com`.

## 1. Connect the repo

1. Push this repository to GitHub (if it is not already remote).
2. [Netlify](https://app.netlify.com) → Add new site → Import from Git → this repo.
3. Build settings are in [`netlify.toml`](../netlify.toml):
   - Base: `apps/portal`
   - Build: `npm ci && npm run build`
   - Publish: `dist`
4. Deploy a preview. Open the `*.netlify.app` URL and confirm the sign-in page loads.

## 2. Custom domain

1. Netlify → Domain management → Add `pay.ohhdennyservices.com`.
2. Cloudflare DNS: set `pay` to the CNAME Netlify shows (usually `*.netlify.app`).
   Proxied (orange cloud) is fine with Netlify.
3. Wait until Netlify shows the certificate as provisioned.

## 3. Cut the tunnel hostname for `pay`

Once Netlify serves the SPA:

1. Zero Trust → Networks → Tunnels → your invoicing tunnel → Public Hostnames.
2. **Delete** `pay.ohhdennyservices.com` → `portal-edge:80` (Netlify owns DNS for `pay` now).
3. **Keep** `api.pay.ohhdennyservices.com` → `bff:8080`.
4. **Keep** `admin.pay.ohhdennyservices.com` → `ninja-nginx:80`.

`portal-edge` can stay in Compose for local Docker-only smoke tests; it is no longer
on the public internet.

## 4. Smoke test

With Docker Desktop running on the Mac:

1. Open `https://pay.ohhdennyservices.com` — ODS sign-in page (not a Netlify placeholder).
2. Request a magic link for a contact that exists in Invoice Ninja.
3. Open the link → land on invoices (empty list is OK).
4. Confirm `https://api.pay.ohhdennyservices.com/api/health` returns `{"status":"ok"}`.

If `/api` returns 502, the Mac tunnel/BFF is down — Netlify is fine; wake Docker.

## 5. Laptop sleep

While the backend is on this Mac, sleeping the laptop takes down sign-in, invoices, and
autopay for clients. The static Netlify pages still load. Move Docker to a VPS when that
becomes unacceptable — see [vps-migration.md](vps-migration.md).
