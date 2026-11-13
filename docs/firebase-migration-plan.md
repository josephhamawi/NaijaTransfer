# NigeriaTransfer — Full Migration to Firebase

**Goal:** kill the Hetzner CPX22 (€7.5/mo) and run the whole product on Firebase.
**Decisions locked:** migrate all Postgres data · file bytes stay on Firebase Storage (accept GCS egress) · full plan first, then build.

Date: 2026-11-13 · Project: `naijatransfer` · Repo: `/Users/mac/Development/transfer`

---

## 0. Where things stand today

Already on Firebase — no work needed:

| Surface | State |
|---|---|
| File bytes | Firebase Storage / GCS. `src/lib/storage.ts`. Browser → signed PUT direct to bucket (commit `5a894a1`). |
| Multipart assembly | GCS `compose` tiers, 32-source limit handled (`composeMany`). |
| Transfers + files | Firestore. `src/services/transfer.service.ts`, `file.service.ts`, all `/api/upload/*` routes. |
| Client auth | Firebase Auth (Google + email/password). `src/lib/firebase.ts`. |
| Token verification | Firebase Admin. `src/lib/auth-api.ts`. |
| `users` docs | Firestore, keyed by **Firebase uid**. Written by `/api/auth/sync`. |
| Cloudflare R2 | **Dead code.** `src/lib/r2.ts` has zero importers. Delete it. |

Still tied to the VM:

| Surface | Where |
|---|---|
| Next.js SSR process | `server.js`, `ecosystem.config.js` (PM2), `Caddyfile`, `scripts/deploy.sh` |
| Postgres `localhost:5432` | `prisma/schema.prisma` + 22 files importing `@/lib/db` |
| NextAuth v5 + PrismaAdapter | `src/lib/auth.ts` — a **second, parallel** auth system |
| Cron jobs | `src/app/api/cron/{cleanup,fx-rates,storage-report,backup}` driven by VM crontab |
| Umami + Uptime-Kuma | `infra/monitoring/docker-compose.yml` |
| Upload bypass subdomain | `upload.naijatransfer.com` in `Caddyfile` — obsolete since direct-to-GCS |

### The identity split (fix this first, it blocks everything)

Two user identities exist right now:

- Firestore `users/{firebaseUid}` — written by `/api/auth/sync`
- Postgres `users.id` = a Prisma **cuid**, upserted by email in `getAuthUser()` (`src/lib/auth-api.ts:11`)

`getAuthUid()` exists specifically because the two don't match (see its doc comment). Transfers are keyed by uid; subscriptions, API keys and file requests are keyed by cuid. **Firebase uid becomes the single user key.** Every cuid foreign key gets remapped during the data migration.

---

## 1. Target architecture

```
Browser
  ├── static/SSR pages ──► Firebase App Hosting (Cloud Run + Google CDN)
  ├── signed PUT ────────► Firebase Storage (bytes never touch the app server)
  └── signed GET ────────► Firebase Storage

App Hosting (Next.js 14, minInstances 0)
  ├── Firestore          users, transfers, files, payments, apiKeys,
  │                      fileRequests, fxRates, downloadLogs
  ├── Firebase Auth      sole identity provider, session cookies for RSC
  ├── Secret Manager     Paystack / Brevo / CRM keys
  └── external HTTP      Paystack, Brevo/Resend, Termii, Kodefoundry CRM

Cloud Functions v2 (onSchedule, minInstances 0)
  ├── cleanup        expired transfers + orphaned parts
  ├── fx-rates       FX scrape → Firestore
  ├── storage-report usage report
  └── backup         Firestore managed export → GCS
```

Dropped entirely: PM2, Caddy, Postgres, Prisma, NextAuth, `server.js`, docker-compose, tus, R2, the upload bypass subdomain, Umami, Uptime-Kuma.

---

## 2. Phases

### Phase 0 — Access + safety net

1. ✅ **Resolved — it was the wrong account, not a missing permission.** The project belongs to **`kodefoundryatelier@gmail.com`**; `joseph.hamawi.ng@gmail.com` (the gcloud and firebase CLI default here, and the app's OWNER_EMAIL, which is a separate thing) cannot see it at all — it is absent from that account's project list, which reads as `PERMISSION_DENIED`.

   Every CLI call against this project needs the account named explicitly:

   ```bash
   firebase <cmd> --account kodefoundryatelier@gmail.com --project naijatransfer
   gcloud  <cmd> --account kodefoundryatelier@gmail.com --project naijatransfer
   bash scripts/audit-cloud-cost.sh naijatransfer kodefoundryatelier@gmail.com
   ```

   Confirmed with that account: billing is enabled (`01201F-9286F4-69EE88`), and the storage bucket is in **europe-west3** (Frankfurt).
2. `pg_dump` the live Postgres off the VM → local `.sql` + per-table JSON. Keep two copies off the box. This is the only source of users/payments/apiKeys/fileRequests.
3. Enable APIs: `run`, `cloudbuild`, `firestore`, `secretmanager`, `cloudscheduler`, `firebasestorage`, `apphosting`.
4. **Create a billing budget** with alerts at $5 / $20 / $50. Alerts notify only — they do not stop spend. The hard caps are `maxInstances` and tier download limits. (Not yet done: listing budgets needs the Cloud Billing Budget API enabled, which is a change to make deliberately rather than as a side effect of a check.)

5. **App Hosting region: `europe-west4`.** An earlier note here said europe-west3, to match the bucket. That is not possible — App Hosting supports only `asia-east1`, `asia-southeast1`, `europe-west4`, `us-central1`, `us-east4`, `us-east5`. europe-west4 is the closest, and sits inside the `eur3` multi-region Firestore uses, so Firestore traffic stays local.

   The bucket/backend mismatch costs little: signed-URL downloads go straight from the bucket to the user and never touch the backend. Only `download-all` streams through Cloud Run, paying intra-continent inter-region egress (~$0.02/GB) on top. The bucket is empty today, so relocating it to europe-west4 is as cheap as it will ever be if that path matters later.

### Phase 1 — Hosting on App Hosting (dual-run with Hetzner) — ✅ DONE (commit `afefbde`)

Ship this with Postgres still in play, pointed at the live DB only if reachable; otherwise land Phase 2 first for the DB-touching routes. Order chosen so the risky data move happens with a working rollback (the VM) still up.

1. `apphosting.yaml` at repo root:
   ```yaml
   runConfig:
     minInstances: 0
     maxInstances: 2
     cpu: 1
     memoryMiB: 512
     concurrency: 80
   env:
     - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
       value: naijatransfer
       availability: [BUILD, RUNTIME]
     - variable: PAYSTACK_SECRET_KEY
       secret: paystack-secret
     # … Brevo, Termii, CRM, CRON_SECRET → Secret Manager
   ```
   `minInstances: 0` is non-negotiable — one warm Cloud Run instance is $25–40/mo of pure idle.
2. Push every secret: `firebase apphosting:secrets:set <name>`.
3. **Delete the proxy-upload fallback.** Cloud Run caps request bodies at 32 MiB, so these cannot work there:
   - `src/app/api/upload/file/route.ts` (streaming proxy)
   - `src/app/api/upload/file/chunk/route.ts`
   - `experimental.serverActions.bodySizeLimit: "4gb"` in `next.config.mjs`
   - `uploadFileStream()` in `src/lib/storage.ts`, `src/lib/tus.ts`, the `@tus/server` dep, `uploads/`
   Direct signed PUT becomes the only path. Remove the `isDirectUploadAllowed()` degradation branch in `upload-client.ts` — there is nothing to degrade to. Verify bucket CORS first: `npm run storage:cors`.
4. Delete `server.js` + its `package.json` wiring. App Hosting owns the server; the 5-minute Node request timeout it worked around is irrelevant now that bytes bypass Node.
5. `download-all` (`src/app/api/transfer/[code]/download-all/route.ts`, `archiver`) — keep for now, Cloud Run streams up to 60 min. But each zip pulls every byte through Cloud Run (GCS read + egress + CPU). Follow-up: hand the client per-file signed URLs and build zips only on explicit request.
6. Ship the missing rules files — **these do not exist today**, so Firestore and the bucket are running on unmanaged defaults:
   - `firestore.rules` — deny all client access (all reads go through the Admin SDK)
   - `storage.rules` — deny client reads; allow nothing but signed-URL access
   - register both in `firebase.json` (currently declares only `firestore.indexes` and `functions`)
7. `.github/workflows/deploy.yml` → replace VM ssh/PM2 steps with App Hosting rollout; keep lint/typecheck/test. Re-enable the `push: branches: [main]` trigger that's commented out.
8. Deploy to the App Hosting default domain. Smoke test uploads, downloads, password-protected links, Paystack checkout. Hetzner still serving `naijatransfer.com`.

### Phase 2 — Postgres → Firestore — ✅ CODE DONE (data move still to run)

Collection layout (uid-keyed throughout):

| Postgres | Firestore |
|---|---|
| `users` | `users/{uid}` — merge into existing docs; carry `tier`, `planStartDate/EndDate`, `paystackCustomerId`, `paystackSubCode`, `storageUsedBytes`, `username`, `phone`, `hearAboutUs` |
| `accounts`, `sessions`, `verification_tokens` | **dropped** — Firebase Auth owns these |
| `payments` | `users/{uid}/payments/{id}` |
| `api_keys` | `apiKeys/{keyHash}` (doc id = hash → key validation is one `get`, no query) + `users/{uid}/apiKeys/{id}` for listing |
| `file_requests` | `fileRequests/{id}`, `shortCode` indexed |
| `file_request_uploads` | `fileRequests/{id}/uploads/{id}` |
| `download_logs` | `transfers/{id}/downloads/{id}` + `downloadCount` increment on the transfer doc |
| `fx_rates` | `fxRates/{pair}` — **one doc holding the points array**, not one doc per point |
| `transfers`, `files` | already in Firestore; nothing to move |
| — | `liveRooms/{id}` + `senderCandidates`/`recipientCandidates`, and `liveRateLimits/{bucket}` are new and already Firestore-native (Live Send). Nothing to migrate; they are listed so the rules and sweep are not forgotten |

Code changes, file by file:

- `src/lib/db.ts` — delete. `prisma/`, `@prisma/client`, `prisma`, `@auth/prisma-adapter` — delete.
- `src/types/transfer.ts`, `src/types/user.ts` — replace Prisma-generated types with local interfaces (follow the `TransferDoc`/`FileDoc` pattern already in `transfer.service.ts`).
- `src/services/api-key.service.ts` (76 L) — `apiKeys/{keyHash}` doc get; `lastUsedAt` via a non-blocking update.
- `src/lib/api-auth.ts` — drop `import type { ApiKey } from "@prisma/client"`.
- `src/services/payment.service.ts` (46 L) — payments subcollection.
- `src/services/analytics.service.ts` (52 L) — Firestore has no cheap `count` over joins. Use `count()` aggregation on the downloads subcollection, and read `storageUsedBytes`/`tier` straight off `users/{uid}`. `getAccountSummary`'s cross-table download count becomes a per-user counter field maintained by `FieldValue.increment`.
- `src/services/fx.service.ts` (382 L) — the one real rewrite. `db.$queryRawUnsafe` at line 313 (history aggregation) has no Firestore equivalent. Store each pair as a single doc with a bounded points array; history = one doc read instead of N. `deleteMany`/`create` at 195–243 become one `set`.
- `src/services/storage-monitor.service.ts` (123 L) — aggregate from `users/{uid}.storageUsedBytes` counters.
- `src/lib/username.ts` (30 L) — uniqueness via a `usernames/{lowercased}` reservation doc in a transaction (Firestore has no unique index).
- Routes: `api/user/profile`, `api/user/storage`, `api/user/subscription`, `api/user/subscription/cancel`, `api/user/requests`, `api/user/requests/[id]`, `api/request/[code]`, `api/v1/transfers/[id]`, `api/webhooks/paystack` — swap `db.*` for Firestore. ~600 L total, all mechanical.
- **New since Live Send** — three places now read `user.tier` from Postgres to decide whether storage is allowed. They are the entitlement gate, so they must move with the rest and must not be left reading a stale store:
  - `api/v1/transfers/route.ts` — key owner's tier
  - `api/user/requests/route.ts` — requester's tier
  - `api/request/[code]/route.ts` — request **owner's** tier, checked at submit time

  **Postgres is authoritative for entitlement** and all four go through `resolveEntitlementTier()` in `src/lib/auth-api.ts` — the one place that knows which store the Paystack webhook writes. Firestore `users/{uid}.tier` only ever holds FREE or OWNER (written by `/api/auth/sync`), so it can never be used to answer "is this user paid". Phase 2 collapses the two stores; that helper is the seam to change when it does.
- `api/webhooks/paystack/route.ts` — keep signature verification unchanged; writes go to `users/{uid}` + payments subcollection. **Needs the email→uid lookup**, so it depends on the user remap landing first.

Migration script `scripts/migrate-pg-to-firestore.ts`:
1. Read the Phase-0 dump.
2. For each Postgres user: look up Firebase Auth by email → uid. No Firebase user? `admin.auth().importUsers()` with the bcrypt hash (Admin SDK supports bcrypt directly).
3. Build `cuid → uid` map. Remap every FK in payments / apiKeys / fileRequests / transfers.
4. Batched writes (500/batch), idempotent (`set` with merge, deterministic doc ids) so it can be re-run.
5. Dry-run mode printing a diff first.
6. Verify: row counts per table vs doc counts per collection; spot-check the OWNER account and every paying subscriber.

New Firestore indexes needed (add to `firestore.indexes.json`): `fileRequests.shortCode`, `users.username`, `users.email`, `apiKeys.userId + createdAt`.

### Phase 2 outcome

Shipped with the port:

- **One user key.** `users/{firebaseUid}` is the only user record. The Prisma cuid survives only as `legacyId`, because Paystack keeps sending it in `metadata.userId` on every renewal of a subscription created before the migration; `getUserByAnyId` resolves either.
- **Uniqueness without unique indexes.** `usernames/{lowercased}` and `phones/{digits}` reservation documents, written in the same transaction as the profile update.
- **NextAuth removed.** It had zero callers outside its own file — a second, unused auth system wired to Prisma, with `allowDangerousEmailAccountLinking` enabled. Removing it is what allowed Prisma to go entirely.
- **Dead code removed instead of ported**: `analytics.service.ts`, `auth.service.ts`, `types/user.ts`, `types/transfer.ts` — all with zero importers.
- **Two latent bugs fixed in passing**, both pre-dating this work: `/api/user/storage` aggregated the Postgres `files` table that nothing had written to since transfers moved to Firestore (every dashboard read zero), and `/api/v1/transfers/[id]` read transfers from Postgres (always 404).
- **`storage-monitor.service.ts` rewritten.** It measured a local upload directory that stopped existing when uploads went direct-to-bucket, against a 200 GB figure from the retired Oracle VM.

Still to run, in order:

1. `pg_dump` + the JSON export on the VM (command in `scripts/migrate-pg-to-firestore.ts`).
2. `npm run migrate:firestore export.json` — dry run, read the counts and warnings.
3. `... --apply`, then `... --verify` (non-zero exit on any mismatch).
4. `firebase deploy --only firestore:indexes` — four new composite indexes.
5. Only then retire Postgres.

### Phase 3 — Auth consolidation

1. Delete `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/`, the `next-auth` + `@auth/prisma-adapter` deps, and the email-OTP Credentials provider (replaced by Firebase email-link or the existing Termii phone OTP).
2. Add `POST /api/auth/session` — takes a Firebase ID token, returns `createSessionCookie(token, { expiresIn: 14d })` as an httpOnly, secure, SameSite=Lax cookie. Server components cannot see client-side Firebase state; the cookie is how RSC and middleware learn who's logged in.
3. Add `getServerUser()` — `verifySessionCookie()` → `users/{uid}` doc. Replaces every `auth()` call in server components and `(dashboard)` layouts.
4. `DELETE /api/auth/session` on sign-out; revoke refresh tokens for a full logout.
5. `getAuthUser()` in `auth-api.ts` returns a Firestore user doc instead of a Prisma `User`; `getAuthUid()` stays as-is and becomes the only identity accessor.
6. Keep OWNER tier pinned via `isOwnerEmail()` on sync, and mirror it to a custom claim so rules/functions can read it without a doc get.

### Phase 4 — Crons and scheduled work

Move the four `/api/cron/*` routes into `functions/index.js` as v2 `onSchedule` (each `{ minInstances: 0, memory: "256MiB" }`):

| Job | Schedule | Notes |
|---|---|---|
| `cleanupExpired` | hourly | ports `cleanup.service.ts`; already Firestore-native |
| `fxRates` | every 6 h | writes `fxRates/{pair}` |
| `storageReport` | daily | emails usage summary |
| `firestoreBackup` | daily | `gcloud firestore export` to a backup bucket (replaces `scripts/backup-db.sh`) |

Also add a **GCS Object Lifecycle rule** (delete objects older than max expiry + 7 days) as a backstop so a broken cleanup job can't silently grow the storage bill.

Delete the four API routes and `CRON_SECRET` once the functions are live.

### Phase 5 — Cutover

1. Point `naijatransfer.com` + `www` at App Hosting (custom domain in the App Hosting console, Google-managed TLS). If Cloudflare stays in front, set the record DNS-only or Full-strict — the current `Caddyfile` runs Flexible SSL, which breaks against Google's HTTPS-only origin.
2. Drop the `upload.naijatransfer.com` record — it existed only to dodge Cloudflare's 100 MB body cap, which no longer sits in the upload path.
3. Watch 48 h: error rate, cold-start latency on `/d/[code]`, Paystack webhook deliveries, upload success rate.
4. **Then** stop PM2, snapshot the VM, and cancel Hetzner. Keep the snapshot 30 days.
5. Replace monitoring: Cloudflare Web Analytics (free) for Umami, UptimeRobot (free) for Uptime-Kuma.
6. Delete from the repo: `server.js`, `ecosystem.config.js`, `Caddyfile`, `docker-compose.yml`, `infra/`, `scripts/{deploy,setup-vm,backup-db}.sh`, `prisma/`, `src/lib/{r2,tus,db}.ts`, `uploads/`.

---

## 2b. Unit economics — the constraint that changes the plan

> **Updated 2026-11-13, after Live Send shipped (commit `f3e2787`).** The free tier no longer creates stored transfers at all, so the half of this problem that had no revenue behind it is gone. The paid half is unchanged. See `docs/live-send.md`.

Requirement: *no cost until a paying user's payment covers it.* Measured against GCS pricing, current plan pricing still does not satisfy that **for the paid plans**.

Net revenue per subscriber (Paystack local cards: 1.5%, the ₦100 fee waived under ₦2,500; ≈ ₦1,550/USD):

| Plan | Price | Net | Net USD | Egress it buys at $0.12/GB |
|---|---|---|---|---|
| PRO | ₦2,000/mo | ₦1,970 | $1.27 | **10.5 GB** |
| BUSINESS | ₦10,000/mo | ₦9,750 | $6.29 | **52 GB** |

What the plans actually promise:

| Plan | Storage quota | Download limit | Cost if one quota-filling transfer is downloaded once |
|---|---|---|---|
| PRO | 50 GB | 250 downloads | 50 GB egress = **$6.00** + ~$0.50 storage, against $1.27 revenue |
| BUSINESS | 200 GB | unlimited | 200 GB egress = **$24.00**, against $6.29 revenue |

A single PRO subscriber who uses their quota once costs about 5× what they pay. At the advertised 250-download limit the ceiling is 12.5 TB, or $1,500. The plans are structurally loss-making on Firebase Storage — not at scale, on the first customer.

For comparison, the same product on Cloudflare R2 (storage $0.015/GB-month, **egress $0**): a full 50 GB PRO transfer held 14 days costs about **$0.35** against $1.27 of revenue — roughly 72% gross margin, and download volume stops mattering entirely.

Three ways to satisfy the requirement:

| Option | Change | PRO margin | Keeps "Firebase only" |
|---|---|---|---|
| **A. R2 for file bytes** (recommended) | Restore `r2.ts` for objects only; Auth, Firestore, Hosting, Functions all stay on Firebase. ~1 day. | ~72% | No — one service moves |
| **B. Reprice** | PRO ₦2,000 → ~₦12,000–15,000, BUSINESS ₦10,000 → ~₦45,000 to cover 200 GB. | ~60% | Yes |
| **C. Cut quotas** | PRO storage 50 GB → 8 GB, BUSINESS 200 GB → 40 GB, tighter download caps. | ~60% | Yes |

Until one of these is chosen, `src/lib/egress.ts` is what prevents an open-ended bill: paid tiers carry per-user allowances set deliberately above break-even — a 10 GB cap on a plan advertising 50 GB transfers is not sellable — so a heavy PRO user is still a bounded loss of about $12/month each.

### What Live Send changed

The free tier was the larger and more dangerous half of this problem, and it is now closed:

| | Before Live Send | Now |
|---|---|---|
| Free transfer storage | GCS, $0.02/GB-month | none — nothing is stored |
| Free transfer downloads | GCS egress, $0.12/GB | none — bytes go peer to peer |
| Worst-case free abuse | 4 GB × 10 transfers/day × 50 downloads = **2 TB/day ≈ $240/day** per user | zero file egress; abuse is now bounded by Firestore signalling writes |
| Free tier revenue covering it | none | none needed |

The unpaid egress pool in `egress.ts` (`EGRESS_BUDGET_GB_MONTH`, default 50 GB) now serves exactly one thing: downloads of **free transfers created before the gate shipped**. Free transfers expire in at most 7 days, so that usage decays to structurally zero about a week after deploy. Nothing creates a new FREE-tier transfer document any more — `/api/upload/create`, `/api/upload/file/batch-init`, `/api/v1/transfers` and the file-request endpoints all refuse.

Leave the pool in place as a safety net; it costs nothing when unused. Revisit the number only if a future feature reintroduces unpaid stored downloads.

Anonymous recipients downloading a **paid** user's transfer are billed to that owner's per-user allowance, not the free pool — `checkEgressAllowed` reads tier and owner from the transfer document, so a PRO transfer stays on PRO's budget no matter who downloads it.

### What is still open

Only the paid plans. Options A, B and C above all still apply, and the decision is now narrower: it is a pricing question about Pro and Business, not a survival question about the free tier. Option A (R2 for file bytes) is still the only one that fixes margin without touching the price list or the advertised quotas.

Note also what is **not** metered: preview thumbnails (`/api/transfer/[code]/preview/[fileId]`). Kilobytes per request, ignored on purpose.

## 3. Cost model

Steady state at current traffic:

| Item | Cost |
|---|---|
| App Hosting / Cloud Run | ~$0 — free tier is 2 M requests + 180 k vCPU-s/mo, and `minInstances: 0` means zero idle charge |
| Cloud Build (deploys) | ~$0 — 120 build-min/day free |
| Firestore | ~$0 — 50 k reads / 20 k writes / 1 GiB free per day |
| Secret Manager | ~$0.06/version/mo |
| Scheduled functions | ~$0 — well inside the free tier |
| Live Send signalling | ~$0 — a few hundred Firestore ops per session; scales with sessions, not bytes |
| Storage at rest | $0.020–0.026 per GB-month, **paid plans only** |
| **Egress (downloads)** | **$0.12 per GB, paid plans only** |

| Monthly downloads (paid transfers) | Egress bill |
|---|---|
| 50 GB | $6 |
| 250 GB | $30 |
| 1 TB | $120 |

Hetzner included 20 TB of bandwidth; GCS includes none. This is still the line item that grows fastest — but since Live Send it grows only with **paying** customers' downloads, which is the shape the business needs. Free usage no longer appears in this table at all.

Controls, in order of effectiveness:
0. **Live Send** — free transfers generate no storage and no egress at all. Shipped.
1. Per-tier download caps + link expiry — enforced in `tier-limits.ts` and `egress.ts`.
2. `maxInstances: 2` — caps Cloud Run spend absolutely.
3. GCS lifecycle deletion — caps storage-at-rest.
4. Budget alerts at $5/$20/$50 — notification only.
5. Escape hatch: if egress passes roughly $25/mo, restore `r2.ts` for file bytes only (R2 egress is $0) and leave Firestore/Auth/Hosting on Firebase. Pure cost arbitrage, ~1 day of work, nothing else in the stack changes.

---

## 4. Risks

| Risk | Mitigation |
|---|---|
| Paid plans lose money per paying user (see §2b) | Pick option A, B or C; `egress.ts` bounds the loss until then. The free-tier half of this risk is closed by Live Send |
| Two stores disagree on who is paid (Firestore vs Postgres `tier`) | Every gate resolves through `resolveEntitlementTier()`, which reads Postgres — the store the Paystack webhook writes. Phase 2's user remap removes the split |
| Account can't access the GCP project | Phase 0 blocker — resolve before anything else |
| App Hosting runtime cannot sign V4 URLs → all uploads 503 | Grant the Cloud Run service account `roles/iam.serviceAccountTokenCreator` **on itself**; `batch-init` fails loudly with this exact cause in the log |
| cuid → uid remap drops a paying subscriber | Dry-run diff; verify every user with a `paystackSubCode` by hand |
| Cold start on `/d/[code]` download pages | Public pages are static/ISR behind the CDN; only the API path cold-starts |
| 32 MiB Cloud Run body cap | Phase 1 deletes every proxy-upload path; direct PUT verified before cutover |
| `download-all` zips through Cloud Run | Works, but watch CPU + egress; move to per-file signed URLs as a follow-up |
| Firestore has no unique indexes | Reservation docs in transactions for `username` and `shortCode` |
| Lost SEO on FX pages during cutover | Keep URLs byte-identical; verify `sitemap.xml` and canonicals post-cutover |

## 5. Effort

| Phase | Work |
|---|---|
| 0 — access + dump | 0.5 day (gated on account access) |
| 1 — App Hosting + rules | ✅ done |
| 2 — Postgres → Firestore | ✅ code done; data move pending a `pg_dump` |
| 3 — auth consolidation | mostly done early: NextAuth was dead code and is removed. Session cookies for RSC remain |
| 4 — crons | 0.5 day |
| 5 — cutover + cleanup | 1 day + 48 h watch |

Phases 1 and 2 can overlap. The VM keeps serving production until Phase 5, so rollback is always "point DNS back".
