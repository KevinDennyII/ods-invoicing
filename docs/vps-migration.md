# Move Invoice Ninja + BFF to an always-on VPS

Netlify keeps serving `pay.ohhdennyservices.com`. Only Docker moves.

## When to do this

Clients need billing while your Mac is asleep, or you want the stack off your laptop.

## Target

Any Linux host that can run Docker Compose: home NAS/NUC, Hetzner, DigitalOcean,
Fly Machines with a volume, etc. Prefer a small dedicated VPS with automatic backups.

## Steps

1. Install Docker Engine + Compose plugin on the VPS.
2. Clone this repo (or rsync it). Do **not** copy `.env` files — secrets stay in Infisical.
3. Install the Infisical CLI and log in against `https://secrets.thatdeveloper.dev`.
4. Confirm `.infisical.json` points at the same project; secrets at path `/` (project root).
5. On the VPS: `./scripts/ods check` then `./scripts/ods up`.
6. Point the Cloudflare Tunnel connector at the VPS:
   - Easiest: stop `ods-cloudflared` on the Mac (`./scripts/ods down` or stop that service).
   - Start the same Compose stack on the VPS so `cloudflared` joins the same tunnel token.
   - Or create a new tunnel token, update Infisical `CLOUDFLARE_TUNNEL_TOKEN`, and keep
     public hostnames `api-pay` → `bff:8080`, `admin-pay` → `ninja-nginx:80`.
7. Smoke: `https://api-pay…/api/health`, `https://admin-pay…`, magic-link on `https://pay…`.
8. Migrate MySQL data if the VPS is a fresh volume: `./scripts/ods backup` on the Mac,
   restore the dump into the VPS MySQL volume before cutting DNS/tunnel.
9. Decommission the Mac connector so Cloudflare is not load-balancing to a dead host.

## Do not change

- Netlify site or `pay` DNS
- `PORTAL_ORIGIN` (still `https://pay.ohhdennyservices.com`)
- Marketing site or expenses on Replit
