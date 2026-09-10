# Hosting: Netlify portal + Docker backend

## Target layout (this product)

| Surface | Host | Notes |
| --- | --- | --- |
| `pay.ohhdennyservices.com` | **Netlify** | Static React SPA; `/api` proxied to `api-pay` |
| `api-pay.ohhdennyservices.com` | Docker + Cloudflare Tunnel | BFF (sessions, magic links) |
| `admin-pay.ohhdennyservices.com` | Docker + Cloudflare Tunnel | Invoice Ninja |
| `ohhdennyservices.com` | Replit | Marketing — out of scope |
| `expenses.ohhdennyservices.com` | Replit | Expenses — out of scope |

Docker runs on this Mac until you follow [vps-migration.md](vps-migration.md).

## Why the tunnel connector must run in Docker

macOS supports exactly one `cloudflared` **service**. It cannot resolve Docker DNS names
(`bff`, `ninja-nginx`) on `ods_invoicing_net`, so a host connector returns **502**.

Run the connector from Compose (`./scripts/ods tunnel` or `./scripts/ods up`). Do not also
install the same tunnel token as a host service — Cloudflare will load-balance and half
the requests will fail.

```
api-pay.ohhdennyservices.com      -> bff:8080
admin-pay.ohhdennyservices.com    -> ninja-nginx:80
```

After Netlify cutover, do **not** keep a public hostname for `pay` on the tunnel.

### Other tunnels on this Mac

Container connectors (`docmost-cloudflared`, `infisical-cloudflared`, …) can coexist.
Only the single macOS LaunchDaemon slot is exclusive.

## Expenses on Replit

Expenses is not served by this tunnel. If `expenses.` DNS breaks after a Cloudflare zone
import, re-add the records Replit shows under Domains (see earlier recovery notes). Do not
point `expenses` at the invoicing tunnel.

## Laptop sleep

While Docker is on the Mac, sleep takes down or stalls the tunnel. Netlify still
serves the static portal and shows “Billing is temporarily unavailable.” After wake:

```bash
./scripts/ods up
# or just: INFISICAL_DOMAIN=https://secrets.thatdeveloper.dev \
#   infisical run --env=dev --path=/ -- docker compose restart cloudflared
```

Also uninstall any **host** `cloudflared` service for this tunnel (`sudo cloudflared service uninstall`) —
a second connector on the Mac steals traffic and returns 502s for half the requests.

Move to a VPS when clients need 24/7 access.
