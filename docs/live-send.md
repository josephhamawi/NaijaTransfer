# Live Send

Free transfers now travel directly between the sender's browser and the recipient's browser over WebRTC. No file bytes touch Firebase Storage, the Next.js server, Cloud Functions or Firestore.

Cloud-stored transfers still exist and still work — they are now part of Pro and Business.

---

## 1. The two modes

| | Live Send | Stored Transfer |
|---|---|---|
| Plan | Free (and available to paid plans too) | Pro, Business, Owner |
| Where bytes go | Browser → browser, direct | Browser → Firebase Storage → browser |
| Both parties online | Required | Not required |
| Size ceiling | The recipient's browser (see §4) | Plan limit (10–200 GB) |
| Link lifetime | Single use, 15-minute join window | 7–60 days by plan |
| Our bandwidth cost | None for file bytes | ~$0.12/GB egress per download |
| Resume after a drop | No — restart the transfer | Yes, uploads resume |

One sender and one recipient per Live Send session. There is no automatic fallback from Live Send to a stored transfer, and no TURN relay: when a direct connection cannot be made the UI says so and points at the paid plans.

---

## 2. How it works

```
Sender browser                                   Recipient browser
     │                                                   │
     │  POST /api/live/rooms      (auth, quota)           │
     │─────────────────────────────────► Firestore        │
     │     roomId + inviteSecret                          │
     │                                                    │
     │   link: /live/<roomId>#<inviteSecret>  ───────────►│
     │                                                    │
     │                      POST /api/live/rooms/:id/claim│
     │                      (atomic, one recipient only)  │
     │                                                    │
     │◄──── Firestore: SDP offer / answer / ICE ─────────►│
     │                                                    │
     │══════════ WebRTC DataChannel (direct) ════════════►│
     │   manifest → accept → chunks → acks → complete     │
     │                                                    │
     │  DELETE /api/live/rooms/:id  (erase signalling)    │
```

Firestore holds only: `senderUid`, `recipientUid`, `inviteHash`, `state`, `createdAt`, `joinExpiresAt`, `claimAttempts`, an SDP `offer`, an SDP `answer`, and up to 60 ICE candidates per side. No file names, no manifest, no progress, no bytes.

### Key files

| Path | Role |
|---|---|
| `src/lib/live/protocol.ts` | Versioned wire protocol: control messages, 12-byte frame header, chunk-size negotiation, CRC-32, name sanitising, manifest validation |
| `src/lib/live/sender.ts` | Sender engine: `File.slice()` reads, backpressure, sequential files, ack handling |
| `src/lib/live/receiver.ts` | Receiver engine: validates every frame against the accepted manifest, writes through a `SaveTarget` |
| `src/lib/live/saver.ts` | `DirectorySaveTarget` (File System Access, streams to disk) and `BlobSaveTarget` (bounded fallback) |
| `src/lib/live/limits.ts` | Capability detection and the size caps both sides enforce |
| `src/lib/live/ice.ts` | **The only place STUN is configured**, plus the relay check |
| `src/lib/live/session.ts` | RTCPeerConnection + Firestore signalling, with listener teardown |
| `src/lib/live/invite.ts` | Room ids and invitation secrets (server-side crypto) |
| `src/lib/live/room-paths.ts` | Collection names and caps shared by client and server |
| `src/services/live-room.service.ts` | Room lifecycle: quotas, atomic claim, deep delete, sweep |
| `src/components/live/LiveSendPanel.tsx` | Sender UI |
| `src/components/live/LiveReceivePanel.tsx` | Recipient UI |
| `src/app/(public)/live/[roomId]/page.tsx` | Recipient page (`noindex`) |

---

## 3. STUN dependency, stated plainly

**Firebase does not provide a managed WebRTC STUN or TURN service.** Nothing in Firebase or Google Cloud fills that role, so the dependency is external and is named in one place, `src/lib/live/ice.ts`:

- Default: **Google's public STUN servers** (`stun.l.google.com:19302`, `stun1.l.google.com:19302`). Free, no credentials, no SLA, no support commitment, no guarantee of continued availability.
- Override with `NEXT_PUBLIC_LIVE_STUN_URLS` (comma-separated) without touching code.
- If those servers vanish, Live Send keeps working only between peers that can reach each other on host candidates — typically the same LAN.

**No TURN relay is deployed.** STUN discovers a peer's public address; it cannot forward traffic. When both peers are behind symmetric NAT or CGNAT — common on Nigerian mobile networks — no candidate pair connects and the transfer cannot happen. Adding TURN would fix those cases and would also mean paying for every relayed byte, which is exactly the cost this feature removes. That is a pricing decision, not an oversight.

`inspectSelectedPair()` reads the negotiated candidate pair from `getStats()` after connecting, and the session aborts if either end is a `relay` candidate. A browser with its own TURN configuration (enterprise policy, extension) therefore cannot silently route a user's files through a third party.

---

## 4. Browser support — honest version

| Browser | Save path | Practical ceiling | Notes |
|---|---|---|---|
| Chrome / Edge, desktop | File System Access API, streams to disk | 20 GB per file and per transfer (our cap, not the browser's) | Recommended. Memory stays flat regardless of size |
| Chrome, Android | Blob fallback | 512 MB per file, 1 GB per transfer | Backgrounding the tab or locking the screen can interrupt |
| Firefox, desktop + mobile | Blob fallback | 512 MB per file, 1 GB per transfer | No `showDirectoryPicker` |
| Safari, macOS + iOS | Blob fallback | 512 MB per file, 1 GB per transfer | iOS is the most likely to kill a backgrounded tab |

The fallback holds each file as `Blob` parts until it completes, then offers it as a download. Blob parts are owned by the browser and may be backed by disk, but no specification guarantees that — hence the conservative cap. The **sender** refuses an oversized transfer before sending a byte, and the **receiver** refuses it again on manifest arrival, so a user never watches 900 MB arrive and then fail.

A Screen Wake Lock is requested while a transfer runs (Chromium only, released afterward, retaken when the tab becomes visible). It is best-effort: the UI still warns that locking a phone or switching apps can interrupt a transfer.

### Not verified here

- **Cross-network connectivity.** The automated end-to-end test runs two browser contexts on one machine, which connect over loopback host candidates. Whether two peers on different real ISPs connect depends on their NATs and can only be established by testing from two devices on different networks (e.g. home fibre ↔ MTN mobile data). **This needs a manual test before announcing the feature.**
- **Mobile backgrounding behaviour.** Not automated. Expect interruptions on iOS Safari in particular.

---

## 5. Security model

| Control | Where |
|---|---|
| Room ids are 144 bits of `crypto.randomBytes`, URL-safe | `src/lib/live/invite.ts` |
| Invitation secret is a separate 256-bit value, carried in the **URL fragment** so it never reaches a server log, Referer header or proxy | `invite.ts`, `LiveSendPanel` |
| Only the SHA-256 of the secret is stored, salted with the roomId so a secret cannot be replayed against another room | `hashInviteSecret` |
| Secret comparison is constant-time | `verifyInviteSecret` |
| The recipient claim is one Firestore transaction on one document — the second of two simultaneous claims is refused | `claimRoom` |
| A repeat claim by the *same* uid is a rejoin (page reload), not a second participant | `claimRoom` |
| Wrong-secret attempts are counted per room; 10 burns the link | `MAX_CLAIM_ATTEMPTS` |
| Room creation is capped per uid (30/hour) and per IP (120/hour) | `createRoom` |
| App Check is verified when configured; soft-fails until `FIREBASE_APPCHECK_ENFORCE=true` | `src/lib/app-check.ts` |
| Firestore rules restrict a room to its two recorded uids, allow the sender to write only `offer` and the recipient only `answer`, make identity/hash/window fields immutable, and constrain state transitions | `firestore.rules` |
| ICE candidates are create-only under ids `000`–`059`, which is how the 60-per-side cap is enforced (rules cannot count subcollection documents) | `firestore.rules` |
| Everything else in Firestore, and all of Cloud Storage, is deny-all from the client | `firestore.rules`, `storage.rules` |
| Secrets, SDP and ICE values are never logged; failures log a bare message | API routes |

The recipient signs in **anonymously** — no account needed to receive a file. Senders may be signed in or anonymous, which keeps the free tier's "no account required" promise; the IP quota is what compensates for how cheap an anonymous uid is.

### Signalling cleanup

- Either side calls `DELETE /api/live/rooms/:id` on completion, cancellation and `pagehide` (with `keepalive`, so it survives the page going away).
- Deleting a room deletes **both candidate subcollections explicitly**. Firestore does not cascade: a bare parent delete leaves orphaned children that no query will ever surface.
- The hourly `/api/cron/cleanup` job sweeps rooms that were never claimed and are past their join window, plus anything at all older than 24 hours. A claimed or connected room inside that grace period is left alone — it may be a transfer still in flight.
- Firestore TTL policies are deliberately **not** relied on: TTL deletion is best-effort with no latency guarantee and, like a parent delete, does not touch subcollections.

---

## 6. What changed for existing features

| Surface | Change |
|---|---|
| `POST /api/upload/create` | Paid plans only. **Identity now comes from a verified Firebase ID token**, not a `uid` in the request body — the old version would have let anyone claim an OWNER uid and upload on someone else's plan. Entitlement is resolved by `resolveEntitlementTier()` against Postgres, the store the Paystack webhook writes; Firestore's `users/{uid}.tier` only ever holds FREE or OWNER and would report a paying Pro customer as free |
| `POST /api/upload/file/batch-init` | Second, independent gate: refuses when the transfer document's tier cannot store. Stops an old free transfer id being reused as free storage |
| `POST /api/v1/transfers` | Reads the key owner's real tier instead of the hardcoded `tier: "PRO"`, then gates |
| `POST /api/user/requests` | File requests need a paid plan — they are asynchronous storage by definition |
| `POST /api/request/:code` | Checks the **request owner's** tier at submit time, so a lapsed subscription stops collecting uploads |
| Existing transfer links | Untouched. They keep working until their original expiry, downloads included |
| Subscriptions, payments, Paystack | Untouched. No change to checkout, webhooks or payment history |
| Owner tier | Unchanged: `OWNER` keeps stored transfers and every other entitlement |
| Pricing page, cards, FAQs | Rewritten around the two modes |

---

## 7. Verification

### Automated, run and passing

```
npm run test:run     # 149 unit tests, 9 files
npm run type-check   # clean
npm run build        # compiles
npm run e2e          # 2 Playwright tests, real WebRTC
npm run test:rules   # 32 rules tests against the Firestore emulator
```

`test:rules` needs JDK 21+ on PATH (firebase-tools refuses older runtimes):

```bash
export JAVA_HOME=/usr/local/opt/openjdk@21   # or wherever your JDK 21 lives
export PATH="$JAVA_HOME/bin:$PATH"
npm run test:rules
```

- `src/services/__tests__/live-room.service.test.ts` — 25 tests: quotas (uid and IP), hash-only storage, atomic claim, **two concurrent claims → exactly one wins**, third-participant rejection, rejoin by the same uid, sender-claiming-own-room refusal, expiry, "a claimed transfer does not expire when the join window closes", attempt throttling, deep delete **including candidate subcollections**, non-participant close refusal, and the sweep's grace rules. Runs against an in-memory Firestore double that reproduces the no-cascade behaviour.
- `src/lib/__tests__/live-transfer.test.ts` — 21 tests driving the real sender and receiver against each other over a simulated channel pair: byte-exact single and multi-file delivery, zero-byte file, frame sizes within the negotiated limit, monotonic progress, **backpressure** (sending parks above the high-water mark), manifest refusal before any bytes, file overrun, out-of-order sequence, wrong file index, data before file start, CRC mismatch, manifest mismatch, incomplete session, cancellation from each side, receiver write failure, and listener cleanup.
- `src/lib/__tests__/live-protocol.test.ts` — 41 tests: framing, version rejection, chunk negotiation, filename sanitising (traversal, control characters, DOS device names, unicode), duplicate-name handling, CRC-32 against the known `123456789` vector and incremental equivalence, manifest validation.
- `src/lib/__tests__/live-limits.test.ts` — capability detection, secure-context requirement, fallback caps, boundary cases.
- `src/lib/__tests__/live-invite.test.ts` — id/secret shape and uniqueness, room-bound hashing, constant-time verification, junk input.
- `src/lib/__tests__/tier-gating.test.ts` — free denied, paid and owner allowed, Live Send available to all, gate matches the tier table.
- `e2e/live-send.spec.ts` — **two independent browser contexts, one real RTCPeerConnection**. Sends a 1.5 MB file, a 60 KB file and a 1-byte file; compares every received byte with the original; asserts the browser reported a real SCTP `maxMessageSize`; asserts the selected candidate pair is **not** relayed on both ends; asserts no HTTP request outside the harness origin (no file payload over HTTP). Second test: recipient declines, sender reports failure, zero bytes written.

- `rules-tests/firestore-rules.test.ts` — 32 tests against the **real Firestore emulator**, run and passing: participants can read their room and a third party cannot; an unclaimed room is invisible to everyone but its sender; clients cannot create or delete rooms; the sender can write only `offer` and the recipient only `answer`; empty and oversized SDP are rejected; each of the six server-owned fields is individually proven immutable from both sides; unknown fields are rejected; `claimed → connected → closed` is allowed and reopening is not; candidates are create-only, per-side, capped through the id pattern (`059` accepted, `060` and `abc` refused), rejected when malformed or when the room is closed; and `transfers`, `users`, `counters` and `liveRateLimits` are unreachable from the client.

  One early failure in this suite was a test artifact, not a rules gap: writing `claimAttempts: 0` onto a room that already held `0` produces no affected keys in Firestore's diff, so there is nothing for a rule to reject and nothing changes. The test now uses values that genuinely differ, one case per field.

### Manual verification still needed

1. **Cross-network transfer** — two devices on different ISPs (e.g. home fibre and MTN mobile data). This is the one thing no local test can establish, and it is the feature's main failure mode.
2. **Enable Anonymous authentication** in the Firebase console (Authentication → Sign-in method). Without it, every claim fails and Live Send cannot work at all.
3. **Firestore rules in production** — the emulator suite passes locally; confirm the deployed rules match after `firebase deploy --only firestore:rules`.
4. **Mobile behaviour** — backgrounding, screen lock, and the Blob fallback on iOS Safari.
5. **Paid paths still work** — one Paystack checkout, one stored upload, one stored download.

---

## 8. Firebase configuration and deployment

### Required

```bash
# 1. Rules — both files are new to the deploy
firebase deploy --only firestore:rules,storage --project naijatransfer
```

2. **Enable Anonymous sign-in**: Firebase console → Authentication → Sign-in method → Anonymous → Enable. Live Send does not work without this.

3. **Indexes**: none to add. The sweep queries one field (`joinExpiresAt`, and `updatedAt` on rate buckets), which Firestore indexes automatically. `firestore.indexes.json` is unchanged.

### Optional

4. **STUN override** — set `NEXT_PUBLIC_LIVE_STUN_URLS` if you move off Google's public servers.

5. **App Check** — register reCAPTCHA v3 in the console, set `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY`, deploy, confirm valid tokens are arriving, then set `FIREBASE_APPCHECK_ENFORCE=true`. Enforcing before the console side is configured would reject every room creation.

Both are already declared in `apphosting.yaml` and `.env.example`.

---

## 9. What this still costs

Live Send removes the file-storage and file-delivery bandwidth cost of free transfers. It does **not** make the Firebase project free. What remains:

| Item | Cost |
|---|---|
| Hosting / SSR | Cloud Run via App Hosting, `minInstances: 0`. Free tier covers current traffic; a request still costs CPU-seconds |
| Signalling reads/writes | Per session: ~1 room write, 1 claim transaction, 1 offer write, 1 answer write, up to 120 candidate writes, plus the listener reads on both sides. A few hundred operations at most, well inside Firestore's 50k reads / 20k writes per day free tier at current volume |
| Firestore listeners | Billed per document read; torn down as soon as the DataChannel opens, which is the point of that teardown |
| Cleanup job | One query plus deletes per hour |
| Stored transfers (paid) | Unchanged: ~$0.02/GB-month storage and ~$0.12/GB egress, metered by `src/lib/egress.ts` |

At meaningful volume the signalling writes become the free tier's only real cost, and they scale with the number of *sessions*, not with the number of *bytes* — which is the whole point.

### Abuse limitations, honestly

- An anonymous sender can open 30 rooms an hour; a shared IP, 120. Someone determined can rotate IPs and burn Firestore writes. App Check raises that cost but does not eliminate it.
- Nothing stops two consenting parties using Live Send to move illegal content. We never see the bytes, cannot scan them, and hold nothing to take down. That is a direct consequence of the architecture.
- A hostile sender could forge a matching CRC-32, so the integrity check detects corruption, not a malicious peer. The recipient has already chosen to accept files from that sender.
- There is no resume. A dropped connection means restarting the transfer, which on a bad mobile link may mean several attempts.
