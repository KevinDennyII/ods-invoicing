# DNS: invoicing without touching Replit

`ohhdennyservices.com` is registered at Namecheap, DNS at Cloudflare. Marketing and
expenses stay on Replit. Invoicing uses three hostnames.

## Record ownership

| Host | Points at | Owner | Rule |
| --- | --- | --- | --- |
| `@` | Replit A (proxied) | Replit | Never change |
| `www` | Replit A (proxied) | Replit | Never change |
| `@` TXT `replit-verify=…` | Replit verification | Replit | Never change |
| `@` MX Private Email | Namecheap Private Email | Mail | Never change |
| `mail`, `autoconfig`, `autodiscover` | Private Email | Mail | Never change |
| `expenses` | Replit (per Domains panel) | Expenses | Never point at invoicing tunnel |
| `pay` | **Netlify** CNAME | Invoicing portal | After Netlify cutover |
| `api-pay` | Tunnel | Invoicing BFF | Managed by Cloudflare Tunnel |
| `admin-pay` | Tunnel | Invoice Ninja | Managed by Cloudflare Tunnel |

## Tunnel public hostnames (backend only)

| Destination | Service |
| --- | --- |
| `api-pay.ohhdennyservices.com` | `http://bff:8080` |
| `admin-pay.ohhdennyservices.com` | `http://ninja-nginx:80` |

Before Netlify cutover you may still have `pay` → `portal-edge:80`. Remove that hostname
once Netlify owns `pay` DNS ([netlify-portal.md](netlify-portal.md)).

### Service URL formatting

No trailing space. Prefer `http://bff:8080` / `http://ninja-nginx:80` exactly as Cloudflare
expects for HTTP service type.

## Verification

```bash
dig +short pay.ohhdennyservices.com          # Netlify after cutover
dig +short api-pay.ohhdennyservices.com
dig +short admin-pay.ohhdennyservices.com
dig +short ohhdennyservices.com              # still Replit / Cloudflare toward marketing

curl -I https://ohhdennyservices.com
curl -I https://pay.ohhdennyservices.com
curl -sS https://api-pay.ohhdennyservices.com/api/health
```

## Rollback

1. Stop the connector: `./scripts/ods down`, or delete `api-pay` / `admin-pay` hostnames.
2. Leave `@`, `www`, `expenses`, and mail records alone.
3. Netlify can keep serving the static `pay` SPA; API calls fail until the tunnel is back.
