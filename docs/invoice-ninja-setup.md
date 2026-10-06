# Invoice Ninja setup: branding, Stripe autopay, mail, hardening

Run after Chunk 1 ([chunk-1-first-boot.md](chunk-1-first-boot.md)): stack healthy,
admin user exists, `NINJA_API_TOKEN` in Infisical. Logo and Stripe are this document
(Chunk 4). First-boot steps live in the chunk-1 doc.

## 1. Branding

Settings → Company Details:

- Logo: upload `branding/ods-logo.jpg` (JPG/PNG is fine).
- Name: OhhDenny Services · Website: `https://ohhdennyservices.com`.
- Billing email: `kevin@ohhdennyservices.com`.

After uploading a logo, if the preview shows a broken image:

1. Confirm Infisical `APP_URL=https://admin-pay.ohhdennyservices.com` (not the old
   `admin.pay…` name), then `./scripts/ods up`.
2. In Invoice Ninja, company **portal domain** must match that URL (Settings or API
   `portal_domain`). Old nested `admin.pay` links break Client Portal / Pay now.
3. Run `./scripts/ods fix-storage` — Invoice Ninja creates company folders as mode `700`,
   and the alpine nginx container cannot read them until directories are `755`.
4. Hard-refresh the logo page (or remove + re-upload once).

Settings → Client Portal → Customize:

| Token | Value |
| --- | --- |
| Primary / brand blue | `#3b5998` |
| Hover / deep blue | `#2c4275` |
| Body / charcoal | `#58595b` |

## 2. Stripe with auto-bill

1. Create a Stripe account (or use the existing one) and keep payouts pointed at the Novo
   business account — Novo stays the bank, it just stops being the invoicing tool.
2. Invoice Ninja → Settings → Online Payments → Add Gateway → **Stripe**.
3. Enable card payments and, for lower fees on recurring work, **ACH / bank transfer**.
4. Add the Stripe webhook Invoice Ninja shows you; ACH settlement requires it.
5. Settings → Online Payments → **Store credit card details / tokenization: enabled**. Auto-bill
   cannot work without a stored gateway token.
6. On each recurring invoice set **Auto Bill: Always**. The portal's Autopay screen flips this
   flag for the client through the BFF.

Use restricted Stripe API keys where possible, and keep the secret key only in Invoice Ninja.

### Live cutover (when test autopay is proven)

Stay on **test** keys until you are ready to charge real cards. Then in Invoice Ninja →
Settings → Online Payments → Stripe:

1. Replace publishable + secret keys with **live** values (`pk_live_…` / `sk_live_…`).
2. In Stripe Dashboard (live mode), create or select a webhook endpoint aimed at the
   Invoice Ninja URL IN shows you; subscribe to the same events IN lists.
3. Paste the **live** signing secret into Invoice Ninja’s Webhook Secret field (not the
   test `whsec_…`).
4. Smoke with a real $1 invoice on a real card you control, then pause before client
   cutover.

Optional Infisical backups (`STRIPE_TEST_*` / `STRIPE_LIVE_*`) do not switch Invoice Ninja —
the gateway UI is the source of truth.

## 3. Outbound mail

Set the `MAIL_*` keys in Infisical and keep
`MAIL_FROM_ADDRESS=kevin@ohhdennyservices.com`.

For outbound SMTP from Gmail: `MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=587`,
`MAIL_USERNAME` = the Gmail that owns the App Password (may still be the old
`ohhdennyservicesllc@gmail.com` mailbox), and an [App Password](https://support.google.com/accounts/answer/185833)
(not your normal Gmail password). If From is `kevin@…` while SMTP auth is Gmail, add
kevin@ as a “Send mail as” address in that Gmail account. Or use Postmark/Resend later.

The BFF uses the same `MAIL_*` values to send portal sign-in links. Without them, sign-in
links are written to the BFF log instead of being emailed.

## 4. Portal API token (if not done in Chunk 1)

Settings → Account Management → API Tokens → create a token named `ods-portal-bff`.
Store it in Infisical as `NINJA_API_TOKEN`. This token is admin-scoped, so it lives only in
the BFF container and is never sent to a browser. Restart: `./scripts/ods up`.

## 5. Hardening

- `APP_DEBUG=false`, `REQUIRE_HTTPS=true`, `SESSION_SECURE_COOKIE=true` in Infisical.
- Put `admin-pay.ohhdennyservices.com` behind Cloudflare Access (Zero Trust → Access →
  Applications → Self-hosted) restricted to your email with one-time-PIN or an IdP.
  Leave `pay.` and `api-pay` reachable for clients (portal auth is magic-link).
- Enable two-factor authentication on your Invoice Ninja admin user.
- No host ports are published: the only inbound path is the tunnel.
- Back up before every image upgrade: `./scripts/ods backup`.

## 6. Verify from the portal

1. Create a test client + recurring invoice (Auto Bill: Always), paused or active.
2. Sign in at `https://pay.ohhdennyservices.com` as that contact.
3. Confirm invoice list, PDF, Pay now, and Autopay toggle against real data.
