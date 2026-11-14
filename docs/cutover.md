# Cutover: naijatransfer.com → App Hosting, then retire Cloudflare proxy and Hetzner

Status as of 2026-11-14 — steps 1–4 are **done**:

| | |
|---|---|
| Nameservers | **GoDaddy** (`ns13/ns14.domaincontrol.com`). Cloudflare is out of the path entirely — no proxy to disable |
| `naijatransfer.com` | A → `35.219.200.108` (App Hosting). Ownership **verified**, certificate **issuing** |
| `www.naijatransfer.com` | A → `35.219.200.108`, redirect to apex. Ownership **verified**, certificate **issuing** |
| `upload.naijatransfer.com` | still DNS-only → Hetzner. Obsolete — delete it (step 8) |
| App Hosting backend | `main`, europe-west4, `https://main--naijatransfer.europe-west4.hosted.app` |
| `nigeriatransfer.com` | does not exist — no NS records. Was wrongly referenced in config; fixed |

**Remaining: wait for the certificates, then steps 6–9.** Until the certs
issue, `https://naijatransfer.com` fails TLS verification; the backend URL
keeps serving throughout.

Because the nameservers moved to GoDaddy rather than Cloudflare being
un-proxied, the rollback in step 9 is "point the GoDaddy A records back at
`188.245.41.31`", not a Cloudflare proxy toggle.

---

## ⚠️ Step 0 — Export Postgres BEFORE anything touches the VM

**This is the point of no return.** The users, payments, API keys and file requests still live only on the Hetzner box. Destroy that VM without an export and they are gone permanently — there is no copy in Firestore yet.

On the VM:

```bash
pg_dump "$DATABASE_URL" -Fc -f ~/naijatransfer-$(date +%F).dump

psql "$DATABASE_URL" -At -c "SELECT json_build_object(
  'users',       (SELECT coalesce(json_agg(u), '[]') FROM users u),
  'payments',    (SELECT coalesce(json_agg(p), '[]') FROM payments p),
  'api_keys',    (SELECT coalesce(json_agg(k), '[]') FROM api_keys k),
  'file_requests', (SELECT coalesce(json_agg(r), '[]') FROM file_requests r),
  'file_request_uploads', (SELECT coalesce(json_agg(fu), '[]') FROM file_request_uploads fu),
  'fx_rates',    (SELECT coalesce(json_agg(f), '[]') FROM fx_rates f)
)" > ~/export.json
```

Copy both off the box (`scp`), keep two copies, then run the migration (`docs/firebase-migration-plan.md` §Phase 2). Nothing below depends on finishing the migration first — but the **export** has to happen before the VM dies.

---

## Step 1 — Lower DNS TTL first ✅ done

TTL is 600s on both records in GoDaddy, which is short enough for a same-hour rollback.

Why: TTL is what decides how fast a rollback takes effect. At a 1-hour TTL, a bad cutover is an hour of downtime you cannot shorten.

---

## Step 2 — Add the custom domain in App Hosting

There is no CLI for this — `firebase apphosting:domains:*` does not exist (CLI 15.20.0). Console only:

**Firebase console → App Hosting → backend `main` → Add custom domain**

- Add `naijatransfer.com`
- Add `www.naijatransfer.com` separately (or set it as a redirect to the apex)

The console will give you:
- a **TXT** record for ownership verification
- an **A** record (and possibly **AAAA**) to point at, or a CNAME target

---

## Step 3 — Add the TXT record, verify ownership ✅ done

Both hostnames verified (`OWNERSHIP_ACTIVE`). Each got its **own** claim
token — the apex and `www` values differ and are not interchangeable.

A trap worth remembering: `www` already existed as a CNAME to the apex, and
DNS forbids a CNAME sharing a name with any other record, so the A record
could not be added until the CNAME was deleted. Google flagged it as
`requiredAction: REMOVE`.

---

## Step 4 — Switch the records ✅ done

Both records point at `35.219.200.108`. Cloudflare is no longer in the path
at all — the nameservers moved to GoDaddy — so the proxy question below is
moot. Kept for the record, and in case Cloudflare is ever reintroduced.

### Why a Cloudflare proxy must not be left on

Cloudflare is currently in **Flexible SSL**: browsers reach CF over HTTPS, CF reaches the origin over **HTTP**. App Hosting only speaks HTTPS and redirects HTTP → HTTPS, so Flexible mode produces a **redirect loop** and the site breaks. Google also cannot issue or renew its managed certificate for a domain whose TLS is being terminated by Cloudflare.

If you want to keep Cloudflare proxying later, it has to be **Full (strict)** — but there is little reason to: App Hosting already serves through Google's CDN with its own certificate. Keeping Cloudflare as DNS-only gives you the DNS management you already use without the conflict.

What you give up by un-proxying: Cloudflare's caching, WAF and DDoS shielding, and the 100 MB request-body cap (which no longer matters — file bytes go browser → bucket, never through the app).

---

## Step 5 — Wait for the certificate

Google issues the managed certificate after the DNS points at it. Usually minutes; **allow up to 24 hours**. Until it completes, `https://naijatransfer.com` may show a certificate warning. The backend URL keeps working throughout, so you always have a working address to test against.

---

## Step 6 — Two things that break silently if you skip them

### 6a. Firebase Auth authorized domains

**Firebase console → Authentication → Settings → Authorized domains** → add:

- `naijatransfer.com`
- `www.naijatransfer.com`

Without this, Google sign-in fails on the new domain with `auth/unauthorized-domain`. Anonymous sign-in (Live Send) is unaffected, so Live Send would keep working while account sign-in quietly broke — which is exactly the kind of thing nobody notices for a week.

### 6b. Bucket CORS — already done

`https://naijatransfer.com` and `https://www.naijatransfer.com` are already in the bucket's CORS policy, alongside the backend URL. Verify any time with:

```bash
gcloud storage buckets describe gs://naijatransfer.firebasestorage.app \
  --account kodefoundryatelier@gmail.com --format="value(cors_config)"
```

This matters because `/api/upload/file/batch-init` refuses to mint signed upload URLs for an origin the bucket does not advertise, and returns **503**. A missing origin here means *every upload fails* while the rest of the site looks perfectly healthy.

---

## Step 7 — Verify on the real domain

```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://naijatransfer.com/
curl -s https://naijatransfer.com/api/health
curl -s -o /dev/null -w "%{http_code}\n" https://naijatransfer.com/pricing
curl -s -o /dev/null -w "%{http_code}\n" https://naijatransfer.com/black-market-exchange-rate
```

Expect `200` and `{"database":"ok","storage":"ok"}`.

By hand, signed in:

- [ ] Google sign-in on the new domain
- [ ] Live Send between two devices **on different ISPs** — still the one untested path
- [ ] A stored upload and download on a paid account
- [ ] One Paystack checkout end to end (the callback now points at the right domain)
- [ ] An FX page renders rates (`/black-market-exchange-rate`)

---

## Step 8 — Drop the obsolete subdomain

Delete the `upload.naijatransfer.com` record. It existed only to bypass Cloudflare's 100 MB body cap when uploads proxied through the app server; nothing has referenced it since, and it currently points at a machine you are about to switch off.

---

## Step 9 — Retire Hetzner, in this order

Do **not** cancel on cutover day.

1. **Confirm the export from Step 0 is safely off the box**, and ideally that the Firestore migration has run and `--verify` passed.
2. Stop the app so a DNS straggler cannot reach stale content:
   ```bash
   pm2 stop naijatransfer && pm2 save
   ```
3. Watch for **7 days**. Live Send and transfers all run on Firebase now; if something was quietly depending on the VM, a week surfaces it.
4. Take a **Hetzner snapshot** and keep it ~30 days. Cheap insurance.
5. Then cancel the server.

Rollback during that week is: re-point the Cloudflare A records at `188.245.41.31`, re-enable the proxy, `pm2 start`. That is why the TTL in Step 1 matters, and why the VM stays alive but idle.

---

## What this does to the bill

| | Before | After |
|---|---|---|
| Hetzner CPX22 | ~€7.50/mo | **€0** |
| Cloudflare | free plan | free plan (DNS only) |
| App Hosting / Cloud Run | — | ~$0 at this traffic; `minInstances: 0`, `maxInstances: 2` |
| Firestore | within free tier | within free tier |
| Storage + egress | — | paid-plan downloads only; free tier is Live Send, which costs no egress |

Re-run the audit after cutover:

```bash
bash scripts/audit-cloud-cost.sh naijatransfer kodefoundryatelier@gmail.com
```

Still outstanding, unrelated to DNS: `BREVO_API_KEY` and `TERMII_API_KEY` are not in Secret Manager, so notification emails and phone OTP do not send. Everything else works without them.
