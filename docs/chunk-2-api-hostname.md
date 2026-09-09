# Chunk 2 — Public API hostname

Netlify proxies `https://pay.ohhdennyservices.com/api/*` to this host. Use **single-level**
names (`api-pay`, `admin-pay`) so Cloudflare’s free Universal SSL covers them.
Nested names like `api.pay` need a paid Advanced Certificate and cause
`ERR_SSL_VERSION_OR_CIPHER_MISMATCH` without one.

## Cloudflare Zero Trust

1. Networks → Tunnels → `ods-invoicing-local` → Published application routes.
2. **Delete** old nested routes (if present):
   - `api.pay.ohhdennyservices.com`
   - `admin.pay.ohhdennyservices.com`
3. **Add**:

| Public hostname | Service |
| --- | --- |
| `api-pay.ohhdennyservices.com` | `http://bff:8080` |
| `admin-pay.ohhdennyservices.com` | `http://ninja-nginx:80` |

No trailing space on the Service URL. DNS is created automatically (proxied).

4. Leave `pay.ohhdennyservices.com` for Netlify (not on the tunnel after cutover).

## Infisical

Update Development:

- `APP_URL=https://admin-pay.ohhdennyservices.com`

Then restart: `./scripts/ods up`

## Verify

```bash
curl -sS https://api-pay.ohhdennyservices.com/api/health
# {"status":"ok"}

curl -sS -o /dev/null -w '%{http_code}\n' https://api-pay.ohhdennyservices.com/api/auth/me
# 401 without a session is success

# Admin should show a valid padlock (not SSL mismatch)
open https://admin-pay.ohhdennyservices.com
```

Confirm `PORTAL_ORIGIN` is your portal URL (`https://pay.ohhdennyservices.com` or the Netlify preview URL while testing).
