# Chunk 1 — Secrets and first boot

## Infisical (path `/ods-invoicing`, env `dev`)

Generate a bundle (optional):

```bash
./scripts/make-upload-env
# fill every PASTE_ value, import into Infisical, then: rm .env.infisical-upload
```

| Key | Source |
| --- | --- |
| `CLOUDFLARE_TUNNEL_TOKEN` | Zero Trust → Tunnels → Configure → copy token |
| `APP_KEY` | `./scripts/ods appkey` |
| `BFF_SESSION_SECRET` | `./scripts/ods sessionkey` |
| `DB_PASSWORD` / `DB_ROOT_PASSWORD` | random (`openssl rand -base64 24`) |
| `DB_DATABASE` / `DB_USERNAME` | `ninja` / `ninja` |
| `APP_URL` | `https://admin.pay.ohhdennyservices.com` |
| `APP_ENV` / `APP_DEBUG` / `REQUIRE_HTTPS` / `SESSION_SECURE_COOKIE` | `production` / `false` / `true` / `true` |
| `TRUSTED_PROXIES` | `*` |
| `PORTAL_ORIGIN` | `https://pay.ohhdennyservices.com` |
| `IN_USER_EMAIL` / `IN_PASSWORD` | first admin only — delete after first sign-in |
| `MAIL_*` | SMTP (Postmark or Private Email) — needed for magic links |
| `NINJA_API_TOKEN` | **after** first boot (or leave unset / `pending`) |

## Host connector

Do not run this tunnel as a macOS `cloudflared` service. Use the Compose service only.
If `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist` exists for this tunnel,
uninstall it so it does not steal traffic: `sudo cloudflared service uninstall`.

## Boot

```bash
./scripts/ods check   # boot secrets must be OK; portal token may still be missing
./scripts/ods up
```

1. Open `https://admin.pay.ohhdennyservices.com` and sign in with `IN_USER_*`.
2. Delete `IN_USER_EMAIL` and `IN_PASSWORD` from Infisical; restart: `./scripts/ods up`.
3. Settings → Account Management → API Tokens → create `ods-portal-bff`.
4. Store the token as `NINJA_API_TOKEN` in Infisical; `./scripts/ods up` again.
5. `./scripts/ods check` should report all secrets present.

Stripe and logo are Chunk 4 — skip them here.
