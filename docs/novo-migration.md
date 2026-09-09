# Moving recurring invoicing off Novo

Novo stays the business bank account. Only invoicing and collection move to Invoice Ninja,
which adds the autopay Novo does not offer. Stripe deposits into the same Novo account.

## 1. Export what Novo has

From the Novo dashboard, collect for every active client:

- Business/contact name and the email that receives invoices
- Billing address
- Invoice amount and what it covers (line items)
- Frequency and the next scheduled send date
- Any outstanding unpaid invoice

Save it as `clients.csv` outside this repo (it is customer data, not code).

## 2. Rebuild in Invoice Ninja

For each client, in `https://admin-pay.ohhdennyservices.com`:

1. **Clients → New Client** — name, contact email, address. The contact email is what the
   client uses to sign in at `pay.ohhdennyservices.com`, so it must match exactly.
2. **Products** — create reusable items for recurring services so line items stay consistent.
3. **Recurring Invoices → New** — set amount, frequency, next send date, and
   **Auto Bill: Always**.
4. Leave the schedule **paused** until step 4 below.

Bulk alternative: the same objects can be created through `/api/v1/clients` and
`/api/v1/recurring_invoices` with the `NINJA_API_TOKEN`, injected via
`infisical run --env=dev --path=/`. Never hardcode the token in a script.

## 3. Invite clients and collect payment methods

1. Send each client a short note explaining billing is moving to
   `https://pay.ohhdennyservices.com` and that nothing about pricing changes.
2. They sign in with their email (link-based, no password), then **Autopay → Add a payment
   method**.
3. Autopay only turns on once a payment method exists — the portal enforces that order.

## 4. Cut over, one cycle at a time

1. Activate the Invoice Ninja recurring schedule for one client and let a full cycle run.
2. Confirm: invoice email delivered, portal shows it, autopay charged, Stripe payout landed
   in Novo.
3. Only then cancel that client's Novo recurring invoice.
4. Repeat per client, or per billing cycle, until Novo has no active recurring invoices.

Deliberately overlapping one cycle is fine — worst case a client sees two invoices and you
void one. Cancelling in Novo before the first successful Invoice Ninja cycle is what risks a
missed month.

## Cutover checklist (print or copy)

For each client:

- [ ] Exported from Novo (name, email, amount, frequency, next date, open invoices)
- [ ] Client + contact created in Invoice Ninja (email matches portal sign-in)
- [ ] Recurring invoice created, **paused**, Auto Bill: Always
- [ ] Client invited to `https://pay.ohhdennyservices.com`
- [ ] Client added payment method + enabled Autopay (or paid first invoice manually)
- [ ] One full Invoice Ninja cycle succeeded (email, portal, Stripe → Novo)
- [ ] Matching Novo recurring invoice cancelled
- [ ] Notes filed (date cut over, any credits/voids)

After the last client:

- [ ] No active Novo recurring invoices
- [ ] First-month Stripe payouts reconciled against Invoice Ninja

