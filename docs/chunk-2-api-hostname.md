# Chunk 2 — Public API hostname

Netlify will proxy `https://pay.ohhdennyservices.com/api/*` to this host. Add it before
the Netlify cutover.

## Cloudflare Zero Trust

1. Networks → Tunnels → `ods-invoicing-local` (or your tunnel name) → Public Hostnames.
2. Add:

| Public hostname | Service |
| --- | --- |
| `api.pay.ohhdennyservices.com` | `http://bff:8080` |

Rules:

- No `https://` in the Service field — host and port only as Cloudflare shows, or
  `http://bff:8080` with **no trailing space**.
- DNS for `api.pay` is created automatically when you add the hostname (proxied CNAME).

3. Keep:

| Public hostname | Service |
| --- | --- |
| `admin.pay.ohhdennyservices.com` | `http://ninja-nginx:80` |

4. Leave `pay.ohhdennyservices.com` → `portal-edge:80` until Netlify cutover
   ([netlify-portal.md](netlify-portal.md)).

## Verify

```bash
curl -sS https://api.pay.ohhdennyservices.com/api/health
# {"status":"ok"}

curl -sS -o /dev/null -w '%{http_code}\n' https://api.pay.ohhdennyservices.com/api/auth/me
# 401 without a session is success
```

Confirm Infisical has `PORTAL_ORIGIN=https://pay.ohhdennyservices.com`.
