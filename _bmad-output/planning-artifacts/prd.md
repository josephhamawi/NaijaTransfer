---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-transfer.md
  - _bmad-output/planning-artifacts/product-brief-transfer-distillate.md
  - docs/competitive-landscape-research.md
  - prompt.md
documentCounts:
  briefs: 2
  research: 1
  projectDocs: 1
  brainstorming: 0
  projectContext: 0
workflowType: 'prd'
projectType: 'greenfield'
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: greenfield
status: complete
completedAt: '2026-03-28'
---

# Product Requirements Document — NigeriaTransfer

**Author:** Mac
**Date:** 2026-03-28
**Classification:** Web App (PWA + Public API) | Fintech / File Infrastructure | High Complexity | Greenfield

## Executive Summary

NigeriaTransfer is the first Nigerian-owned file transfer service and file infrastructure API — a purpose-built platform for Nigeria's 109M internet users, 15-17M diaspora, and the SaaS companies that serve them. Users upload files (up to 4GB free, 50GB Business tier), receive a shareable link, and share it via WhatsApp, SMS, or email — no account required.

The product operates at the intersection of file transfer (consumer utility) and fintech (Naira subscriptions via Paystack, USSD payments, future marketplace transactions). It launches as a full-featured web application with a public API, hosted on Oracle Cloud's always-free tier (compute) and Cloudflare R2 (file storage, zero egress fees), creating a near-zero cost infrastructure.

### What Makes This Special

1. **Resilience as foundation.** Every design decision starts with "What happens when the connection drops?" Resumable uploads (tus protocol), offline queuing, bandwidth estimation, and lightweight mode (default on mobile) are not features — they are the architecture. No foreign competitor is built for Nigerian internet reality.
2. **National identity as moat.** First-mover in an empty market. Nigerian-owned, Naira-priced, Nigerian-art backgrounds, WhatsApp-native sharing. A competitor can copy features; they cannot copy being first or being "ours."
3. **Infrastructure from day one.** Public API at launch positions NigeriaTransfer as the "Cloudinary for Nigerian file transfer" — not just an app, but a platform layer that Nigerian SaaS companies embed in their own products.
4. **Diaspora as primary audience.** 15-17M Nigerians abroad with higher ARPU, underserved by Western file transfer tools that don't integrate with Paystack or understand Naira-denominated needs.

## Project Classification

| Attribute | Value |
|-----------|-------|
| Project Type | Web App (PWA + Public API) |
| Domain | Fintech / File Infrastructure |
| Complexity | High |
| Project Context | Greenfield |

## Success Criteria

### User Success

- **Upload completion:** Users complete 4GB uploads with >90% success rate on 3G connections (measured by tus completion events vs. initiations)
- **Time-to-share:** Users go from file selection to shareable link in under 60 seconds for files under 100MB on broadband
- **Recipient experience:** Recipients can preview and download files within 3 clicks of opening the link, with no account creation
- **Resumability validated:** Users who experience connection drops during upload resume and complete the transfer without restarting (measured by resume event rate)
- **WhatsApp sharing:** >50% of transfer links are shared via the WhatsApp deep link button (measured by share method tracking)

### Business Success

- Month 6: NGN 100,000 MRR (~$65) — validates willingness to pay
- Month 12: NGN 500,000–1,000,000 MRR (~$325–$650) — subscription engine working
- Month 18: NGN 1,500,000 MRR (~$975) — breakeven for potential future hosting costs
- Month 24: NGN 6,000,000+ MRR (~$3,900) — growth trajectory for expansion
- 1–2% free-to-paid conversion rate (realistic for Nigerian market)
- 3–5 Nigerian SaaS companies integrating the API within 12 months
- 1 white-label enterprise contract (NGN 50K–500K/month) within 6 months

### Technical Success

- Uptime >99.5% as measured by Uptime Kuma
- File cleanup lag <2 hours post-expiry (hourly cron execution)
- Storage utilization <85% with auto-rejection when threshold exceeded
- Oracle-to-Hetzner migration runbook tested and executable within 1 hour
- Database backup to Cloudflare R2 completed daily with zero failures
- Zero data loss events from Oracle account termination (files decoupled to R2)

### Measurable Outcomes

- 10,000 registered users within 12 months (stretch: 25,000)
- 50,000 registered users within 24 months (stretch: 100,000)
- Upload success rate >90% on 3G connections
- Page load <3 seconds First Contentful Paint on mobile 3G
- <200KB initial JavaScript bundle (target; aggressive code splitting required)

## Product Scope

### MVP — Full Launch Feature Set (Ship All at Once)

Per product owner decision: all features ship simultaneously. No phased MVP.

**Core Transfer Engine:**
- Resumable chunked upload (tus protocol, 5MB chunks) with pause/resume
- Resumable download (HTTP Range requests)
- Shareable short links with unique codes (nanoid)
- Email transfer mode (enter recipient emails) and link mode (copy/share)
- ZIP download for multiple files
- File previews (image thumbnails, video poster frames, PDF first page)
- Password protection (bcrypt, free for all tiers)
- Configurable expiry (7 days free, up to 60 days Business)
- Configurable download limits (50 free, 250 Pro, unlimited Business)
- Automatic expired file cleanup (hourly cron)

**Sharing & Distribution:**
- WhatsApp deep link sharing (one-tap, pre-formatted message)
- SMS sharing (short link + pre-filled message)
- QR code generation per transfer
- Email notifications to recipients ("You received files via NigeriaTransfer")
- Download notifications to senders (email)

**User System & Auth:**
- Anonymous transfers (no account required)
- Email magic link authentication
- Google OAuth
- Phone + OTP authentication (via Termii or Paystack)
- User dashboard: active transfers, storage usage, subscription, history, analytics

**File Request Portals:**
- Authenticated users create upload request links
- Recipients upload files to request without account
- Requester's dashboard shows received files

**Monetization:**
- Paystack subscriptions: Pro NGN 2,000/month, Business NGN 10,000/month
- Payment methods: card, bank transfer, USSD
- Google AdSense on free-tier download pages (non-intrusive)
- Tiered feature enforcement (file size, expiry, download limits, ads)
- Conversion triggers: "You've used 3.8GB of your 4GB limit — upgrade for 10GB"

**Public API:**
- Embeddable upload widget
- Transfer creation, management, and deletion endpoints
- Webhook callbacks for download events
- API key authentication
- API documentation page
- Rate limiting per API key

**Design & Identity:**
- Full-bleed rotating Nigerian art backgrounds (10–15 licensed images)
- Lightweight mode (default on mobile): disables backgrounds, animations, previews
- Dark mode (auto-detect system preference)
- Bandwidth estimator before upload
- Nigerian green (#008751) + white accent color palette

**SEO & Marketing:**
- Server-side rendered pages (Next.js SSR)
- SEO landing pages: /send-large-files-nigeria, /wetransfer-alternative-nigeria
- Open Graph tags on download pages (WhatsApp/social preview)
- Sitemap.xml, robots.txt, schema markup

**Infrastructure & Operations:**
- Self-hosted Umami analytics (on separate Oracle AMD micro VM)
- Self-hosted Uptime Kuma monitoring (on separate Oracle AMD micro VM)
- Storage monitoring with auto-rejection at 85% capacity
- Daily PostgreSQL backups to Cloudflare R2
- Tested 1-hour migration runbook to Hetzner ($4.50/month)

### Phase 2 (Post-Launch)

- **Sell Your Files:** Paystack split payments, 5% commission, minimum NGN 50 or 5%. Requires: fintech lawyer sign-off on VAT, AML, payment facilitator licensing, refund policy
- **Referral program:** Activate at ~500 users. "Invite 3 friends, get 1 month Pro free." Qualification: referred user must complete at least 1 transfer
- **WhatsApp Business API bot:** Send file to WhatsApp number, receive transfer link back
- **Chrome browser extension:** Quick upload without visiting site
- **Blog:** Content targeting "how to send large files Nigeria," creator tutorials

### Phase 3 (Vision)

- Native iOS/Android apps
- WebRTC peer-to-peer for unlimited file sizes
- Client-side zero-knowledge encryption (Business tier)
- West African expansion (Ghana, Senegal, Cameroon) with localized pricing
- White-label enterprise portals (NGN 50K–500K/month)
- University and government institutional contracts
- ClamAV virus scanning (when on dedicated hosting)

## User Journeys

### Journey 1: Adaeze — Nollywood Film Editor (Primary User, Success Path)

**Who:** Adaeze, 29, freelance film editor in Lagos. Edits Nollywood features on her MacBook Pro. Sends 2–5GB video files to directors daily. Currently uses USB drives passed through production assistants or Google Drive links that her clients struggle to access.

**Opening:** It's 11 PM. Adaeze just finished a 3.5GB rough cut for a director in Abuja who needs it by morning. WhatsApp compresses it to garbage. Google Drive needs the director to sign in. WeTransfer failed at 87% yesterday.

**Rising Action:** She opens nigeriatransfer.com on her phone. No sign-up. Drags the file. The upload starts — progress bar shows speed and ETA: "14 minutes on your connection." At minute 8, her Starlink drops. The progress pauses, shows "Reconnecting..." and picks up at 57% when the connection returns. She sets expiry to 7 days, no password needed.

**Climax:** Upload completes. She taps "Share via WhatsApp." A pre-formatted message opens with the download link. She sends it to the director's WhatsApp. Done. 90 seconds from file selection to delivered link.

**Resolution:** The director opens the link at 6 AM. He sees the file name, size, and a video preview thumbnail. One tap to download. Original quality. He calls Adaeze: "Why haven't we always done it like this?" She upgrades to Pro (NGN 2,000/month) because she sends 10GB files for color grading. The tool pays for itself on the first job.

### Journey 2: Emeka — Nigerian Software Engineer in London (Diaspora, Success Path)

**Who:** Emeka, 34, backend engineer at a London fintech. Needs to send scanned property documents (350MB of high-res PDFs) to his family lawyer in Port Harcourt for a land purchase.

**Opening:** The lawyer doesn't use Google Drive. Email bounces the 25MB total. WeTransfer works but the lawyer complains the link expired before he downloaded it. Emeka needs a tool that works for both ends — his fast London internet and the lawyer's intermittent connection in PH.

**Rising Action:** Emeka uploads on NigeriaTransfer. Fast upload from London. He sets password protection (the documents are legally sensitive) and 14-day expiry (Pro tier). Shares the link via WhatsApp to the lawyer with the password in a separate message.

**Climax:** The lawyer opens the link on his Tecno phone. Lightweight mode loads instantly on his 3G connection. He enters the password, sees the PDF previews, and downloads each document individually (not a huge ZIP that would time out). Downloads resume when his connection flickers.

**Resolution:** Documents received intact, original quality, within the hour. The lawyer asks: "Can my office use this to collect client documents?" Emeka tells him about File Request Portals. The law firm signs up for Business tier (NGN 10,000/month).

### Journey 3: Funke — University Student in Ibadan (General User, Edge Case / Error Recovery)

**Who:** Funke, 22, final-year microbiology student at UI Ibadan. Needs to submit her 1.8GB thesis project (video presentation + report) to her supervisor via a File Request portal the department set up.

**Opening:** The department created a NigeriaTransfer File Request link: "Submit final projects here." Funke has never used NigeriaTransfer before. She's on her phone with a MTN data plan she's carefully budgeting.

**Rising Action:** She opens the request link. No sign-up needed. The bandwidth estimator shows "~25 minutes on your connection." She enables "Upload when on WiFi" and queues the file. At the campus library WiFi, the upload starts. At 64%, the WiFi goes down. The upload pauses. She walks to another building with WiFi. The upload resumes from 64%.

**Climax:** At 97%, her phone browser crashes. She reopens the page — the upload session is preserved in local storage. It resumes from 97% and completes in 30 seconds.

**Resolution:** Funke sees a green checkmark: "Files submitted successfully." Her supervisor sees the submission in their dashboard. Funke shares NigeriaTransfer on her WhatsApp status: "This thing just saved my life." Three classmates use it the same week.

### Journey 4: Tunde — System Administrator / Platform Operations

**Who:** Tunde is the developer/operator managing the NigeriaTransfer platform.

**Opening:** It's Tuesday morning. Tunde checks the Uptime Kuma dashboard and Umami analytics. Everything is green. Storage utilization is at 73%.

**Rising Action:** He reviews the daily backup log — PostgreSQL dump to R2 completed successfully at 03:00. He checks the cleanup cron log — 847 expired transfers deleted overnight, reclaiming 41GB. He reviews Paystack webhook logs — 3 new Pro subscriptions, 1 Business subscription, 0 failed payments.

**Climax:** At 2 PM, storage hits 84%. The auto-rejection threshold kicks in at 85%. Tunde reviews the largest active transfers and sees a Business customer with 45GB of active files expiring in 3 days. He monitors — the cron job will reclaim the space within hours.

**Resolution:** By evening, expired cleanup brings storage to 61%. Tunde reviews the weekly metrics: 412 transfers, 1,847 downloads, 99.7% uptime, 4.2TB egress (well under 10TB limit). He updates the internal dashboard and plans to add the second R2 bucket for overflow if growth continues.

### Journey 5: Chidi — Nigerian Fintech Developer (API Consumer)

**Who:** Chidi, 28, full-stack developer at a Lagos-based HR platform. His product needs users to upload CVs and certificates during onboarding. They've been using raw S3 presigned URLs, but the UX is terrible and uploads fail constantly for users outside Lagos.

**Opening:** Chidi discovers NigeriaTransfer's API documentation. He needs: resumable upload widget, file metadata, download URLs, and webhook notifications when files are uploaded.

**Rising Action:** He integrates the embeddable upload widget into his HR platform's onboarding flow. The widget handles chunked resumable uploads automatically. His backend receives webhook callbacks with file metadata when uploads complete. He stores NigeriaTransfer file IDs in his database.

**Climax:** His first user on a 3G connection in Kano uploads a 15MB CV. The upload fails twice due to network — but the widget resumes automatically each time. The file arrives intact. Chidi's system gets the webhook, processes the CV, and moves the candidate to the next stage.

**Resolution:** Chidi's platform now handles 500+ document uploads per month via NigeriaTransfer's API. Upload success rate went from 62% (raw S3) to 94% (NigeriaTransfer with resumable). He's on the API free tier for now; he'll upgrade when volume exceeds limits.

### Journey 6: Bisi — Law Firm Office Manager in Abuja (Business User, Conversion Path)

**Who:** Bisi, 41, office manager at a mid-size law firm in Abuja. Manages document flow for 12 lawyers. The firm exchanges contracts, court filings, and compliance documents with clients daily. Currently uses email attachments (rejected for size), WhatsApp (compresses scans), and occasionally USB drives for large case files.

**Opening:** One of the partners mentions NigeriaTransfer after receiving a file from a client who used it. Bisi tries the free tier — sends a 2GB case bundle to a client. The client downloads it without creating any account. The partner is impressed.

**Rising Action:** Bisi hits the 4GB limit on a large litigation bundle. She sees the upgrade prompt: "You've used 3.8GB of your 4GB limit — upgrade to Business for 50GB." She evaluates the Business tier (NGN 10,000/month): custom branding (firm logo on download pages), File Request portals (collect documents from clients), 50GB transfers, 60-day expiry. She signs up via Paystack using the firm's bank transfer.

**Climax:** Bisi creates a File Request portal: "Submit Case Documents — Adekunle & Partners." She sends the link to 5 clients. Documents flow in without a single phone call about "how do I send this file." She customizes the download page with the firm's logo and brand colors. When the firm sends documents to clients, the download page looks professional — not like a third-party tool.

**Resolution:** The firm processes 40+ document transfers per month through NigeriaTransfer. Bisi manages everything from the dashboard: active transfers, expiry dates, download counts. The managing partner asks about an API to integrate with their case management system. Bisi contacts NigeriaTransfer about white-label enterprise pricing.

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| Adaeze (Creator) | Resumable upload, WhatsApp sharing, bandwidth estimation, file preview, subscription upgrade flow |
| Emeka (Diaspora) | Password protection, cross-country transfer, lightweight download page, File Request Portals discovery |
| Funke (Student) | File Request upload, offline queue, session persistence, WiFi-optimized upload, crash recovery |
| Tunde (Ops) | Storage monitoring, cleanup cron, backup verification, Paystack webhook monitoring, egress tracking, auto-rejection |
| Chidi (API Dev) | Embeddable widget, resumable upload API, webhooks, file metadata, API documentation |
| Bisi (Business) | Custom branding, File Request portals, bank transfer payment, dashboard management, upgrade conversion flow, white-label discovery |

## Domain-Specific Requirements

### Compliance & Regulatory

- **NDPA (Nigeria Data Protection Act 2023):** Privacy policy disclosing data collection, processing, and storage. Lawful basis for processing. Data subject rights (access, deletion). 72-hour breach notification to NDPC.
- **Cross-border data transfer:** Oracle Cloud VM is outside Nigeria (EU or South Africa region). Requires Standard Contractual Clauses with Oracle and Cloudflare. Documented legal basis in privacy policy.
- **Payment compliance:** Paystack handles PCI-DSS compliance for card processing. NigeriaTransfer must not store card numbers or CVVs.
- **Sell Your Files (Phase 2):** Requires legal review of: VAT obligations (7.5% above NGN 25M annual turnover), AML requirements, payment facilitator licensing, seller agreement, buyer refund policy. Do not launch without fintech lawyer sign-off.

### Technical Constraints

- **Encryption in transit:** TLS 1.2+ for all connections (Caddy auto-HTTPS)
- **Encryption at rest:** Files on Cloudflare R2 are encrypted at rest by default (AES-256)
- **Password hashing:** bcrypt with salt for transfer passwords. No plaintext storage.
- **Audit logging:** Download logs with timestamp, IP, user-agent, country. Required for NDPA compliance and Sell Your Files (Phase 2) dispute resolution.
- **Data retention:** Transfer files auto-deleted per expiry policy. Download logs retained 90 days. User account data retained until deletion request.

### Integration Requirements

- **Paystack:** Subscription management, recurring billing, USSD payments, webhook processing. Phase 2: split payments for Sell Your Files.
- **Cloudflare R2:** File storage via S3-compatible API. Upload from Oracle VM, serve downloads directly from R2.
- **Email provider:** Transactional emails (transfer notifications, auth magic links, expiry warnings). Budget for paid tier from launch — Brevo free (300/day) is borderline at 57 transfers/day.
- **Cloudflare CDN:** Static asset caching, DNS, DDoS protection. File downloads served from R2 (not cached by CDN — dynamic auth required).

### Risk Mitigations

- **Oracle Cloud account termination:** Files stored on Cloudflare R2 (decoupled from Oracle). Daily DB backups to R2. 1-hour tested migration runbook to Hetzner. Migrate to paid hosting when revenue >NGN 50K/month.
- **Storage exhaustion:** Auto-reject uploads at 85% Oracle block storage capacity. R2 scales independently.
- **IOPS bottleneck:** Oracle free-tier 200GB block storage has ~3,000 baseline IOPS. Implement upload queue/throttling when concurrent uploads exceed 5–10 simultaneous.
- **Egress overage:** 10TB/month Oracle free limit. Downloads served from R2 (zero egress). Monitor Oracle egress for API/SSR traffic. Implement throttling near limit.
- **Email deliverability:** Set up SPF, DKIM, DMARC records. Warm sending domain 2–4 weeks before launch. Start with Brevo paid tier (~$9/month for 5,000 emails).

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Resilience-first architecture for emerging markets.** No file transfer service is designed from the ground up for unreliable internet. The combination of tus resumable uploads + offline service worker queue + bandwidth estimation + lightweight mode creates a pattern that could be replicated across Africa and other emerging markets. This is an architectural innovation, not a feature.

2. **National identity as product moat.** SwissTransfer proved national branding creates switching cost. NigeriaTransfer is the first to apply this pattern to Africa — rotating local artwork, Naira pricing, WhatsApp integration, and USSD payments create a product that feels Nigerian in a market of generic international tools.

3. **Consumer app as API infrastructure.** Launching with both a consumer-facing app and a public API is uncommon for a bootstrapped product. The consumer app validates product-market fit and generates awareness; the API captures higher-value B2B revenue. Both share the same infrastructure.

### Validation Approach

- **Resumable uploads on Nigerian networks:** Benchmark tus upload completion rates on MTN, Airtel, and Glo connections across Lagos, Abuja, and Port Harcourt before launch. Target >90% completion rate.
- **Willingness to pay in Naira:** Validate NGN 2,000/month Pro pricing with first 100 creator users. Monitor conversion rate and churn.
- **API adoption:** Track API key registrations and usage patterns within first 6 months.

### Risk Mitigation

- **Resumable upload complexity:** tus protocol is battle-tested with open-source server implementations (@tus/server). Risk is integration complexity, not protocol risk.
- **National branding backlash:** Tone should be "built here, works here, celebrates here" — not "reject foreign products." Nigerian users are pragmatic; if the product doesn't work, branding won't save it.
- **API cannibalization:** API consumers may drive more traffic than paying for. Implement per-GB or per-call pricing tiers to ensure API revenue scales with usage.

## Web App Specific Requirements

### Project-Type Overview

NigeriaTransfer is a Progressive Web App (PWA) with server-side rendering, a REST API backend, and public API endpoints. It must function across browsers (Chrome, Samsung Internet, Opera Mini normal mode) and devices (Tecno Spark, Infinix Hot, Samsung A-series — 2–3GB RAM, MediaTek CPUs).

### Technical Architecture Considerations

**SPA vs. SSR vs. Hybrid:**
- Server-side rendering required for SEO (landing pages, download pages)
- Client-side interactivity required for upload flow (progress, pause/resume, file preview)
- Hybrid approach: SSR for initial page load, hydrate for interactive elements
- Framework decision: Next.js 14+ App Router (current spec) vs. Astro with React islands (potentially lighter JS). PRD does not prescribe — architecture decision deferred to architect.

**Browser Support:**
- Chrome (Android + Desktop): primary
- Samsung Internet: secondary (significant Android market share in Nigeria)
- Opera Mini (normal mode): supported. Extreme mode (server-rendered, no JS): download page must degrade gracefully — download link must work without JavaScript
- Safari (iOS): supported for diaspora users

**PWA Requirements:**
- Service worker for offline upload queue and app shell caching
- Web app manifest for "Add to Home Screen"
- Push notification capability (for download notifications)
- Background sync for queued uploads

**Responsive Design:**
- Mobile-first: design starts at 360px width
- Breakpoints: 360px (mobile), 768px (tablet), 1024px (desktop)
- Touch targets: minimum 44x44px on mobile
- Lightweight mode (default on mobile) disables: background images, animations, file preview thumbnails, non-essential images

**Performance Targets:**
- First Contentful Paint: <3 seconds on mobile 3G
- Initial JS bundle: <200KB (aggressive target; requires code splitting)
- Time to Interactive: <5 seconds on Tecno Spark (2GB RAM, MediaTek)
- Largest Contentful Paint: <4 seconds on mobile 3G

### Implementation Considerations

**File Upload Architecture:**
- tus server middleware handles chunked upload to local block storage
- On upload completion: transfer file from local block storage to Cloudflare R2
- Delete local chunk after successful R2 transfer
- Return R2 object key to database

**File Download Architecture:**
- Generate signed R2 download URLs with expiry
- Validate transfer expiry, download limits, and password before generating URL
- Serve downloads directly from R2 (not proxied through Oracle VM) to avoid egress costs
- Support HTTP Range requests for resumable downloads

**Real-time Features:**
- Upload progress: client-side tus progress events (no WebSocket needed)
- Download notifications: email-based (not real-time push for MVP)
- Storage monitoring: server-side, polled via admin dashboard

## Functional Requirements

### File Transfer Core

- FR1: Anonymous users can upload files up to 4GB without creating an account
- FR2: Authenticated Pro users can upload files up to 10GB per transfer
- FR3: Authenticated Business users can upload files up to 50GB per transfer
- FR4: Users can upload multiple files in a single transfer
- FR5: Users can pause and resume an in-progress upload
- FR6: Users can resume an upload after connection loss without restarting
- FR7: Users can see per-file and overall upload progress with speed and ETA
- FR8: System generates a unique short-code link for each completed transfer
- FR9: Users can set an expiry period on their transfer (7 days free; up to 60 days Business)
- FR10: Users can set a download limit on their transfer (50 free; 250 Pro; unlimited Business)
- FR11: Users can add password protection to a transfer
- FR12: Recipients can preview image files as thumbnails before downloading
- FR13: Recipients can preview video files as poster frames before downloading
- FR14: Recipients can preview PDF first pages before downloading
- FR15: Recipients can download individual files from a multi-file transfer
- FR16: Recipients can download all files in a transfer as a single ZIP archive
- FR17: Recipients can resume interrupted downloads via HTTP Range requests
- FR18: System automatically deletes expired transfers and their files within 2 hours of expiry
- FR19: System rejects new uploads when storage utilization exceeds 85%

### Sharing & Communication

- FR20: Users can share a transfer link via WhatsApp deep link with one tap
- FR21: Users can share a transfer link via SMS with pre-formatted message
- FR22: Users can generate a QR code for any transfer link
- FR23: Users can copy a transfer link to clipboard
- FR24: Users can send transfer notification emails to up to 10 recipients
- FR25: Senders receive email notification when their files are downloaded
- FR26: System sends expiry warning emails 24 hours before transfer expires

### User Accounts & Auth

- FR27: Users can create an account via email magic link (passwordless)
- FR28: Users can create an account via Google OAuth
- FR29: Users can create an account via phone number + OTP
- FR30: Authenticated users can view a dashboard of their active transfers
- FR31: Authenticated users can view transfer download statistics (count, timestamps)
- FR32: Authenticated users can delete their own transfers before expiry
- FR33: Authenticated users can view their storage utilization
- FR34: Authenticated users can view their subscription status and billing history

### File Request Portals

- FR35: Authenticated users can create a file request portal with a title and message
- FR36: File request portals generate a unique shareable link
- FR37: Anyone with a file request link can upload files without creating an account
- FR38: Portal owners can view all files uploaded to their request
- FR39: Portal owners can close a file request to stop accepting uploads

### Subscriptions & Payments

- FR40: Users can subscribe to Pro tier (NGN 2,000/month) via Paystack
- FR41: Users can subscribe to Business tier (NGN 10,000/month) via Paystack
- FR42: Users can pay via card, bank transfer, or USSD
- FR43: Users can cancel their subscription from the dashboard
- FR44: System enforces tier-appropriate limits on file size, expiry, and download count
- FR45: System displays targeted upgrade prompts at 80% and 95% of file size, storage, or download count tier limits
- FR46: Free-tier download pages display a single banner ad below the download card; no popups, interstitials, or auto-playing video/audio; graceful fallback (no blank space) if ad fails to load
- FR47: Paid-tier download pages display no ads

### Public API

- FR48: Developers can register for API keys via the dashboard
- FR49: Developers can create transfers programmatically via API
- FR50: Developers can embed the NigeriaTransfer upload widget in external applications
- FR51: Developers can receive webhook callbacks for upload completion and download events
- FR52: Developers can query transfer status and metadata via API
- FR53: Developers can delete transfers via API
- FR54: API requests are rate-limited per API key (configurable per tier)
- FR55: API documentation is publicly accessible at /docs/api

### Design & Identity

- FR56: Homepage displays full-bleed rotating Nigerian artwork as background
- FR57: Users can toggle lightweight mode to disable backgrounds, animations, and preview thumbnails
- FR58: Lightweight mode is enabled by default on mobile devices
- FR59: Users can toggle dark mode (auto-detects system preference)
- FR60: System displays bandwidth estimate before upload begins
- FR61: Download pages display artist credit and link for the current background artwork

### Offline & Resilience

- FR67: System preserves upload session state in browser localStorage so uploads survive page refresh and browser crash
- FR68: Service worker caches the app shell for instant repeat visits and offline access to the upload page
- FR69: Users can queue files for upload that automatically begin uploading when network connectivity is restored (background sync)
- FR70: Upload UI displays connection quality indicator and "Reconnecting..." / "Resuming..." state when connection drops and recovers

### Custom Branding (Business Tier)

- FR71: Business tier users can upload a custom logo displayed on their transfer download pages
- FR72: Business tier users can set custom brand colors applied to their download page accent elements
- FR73: Business tier users can upload a custom background image for their download pages
- FR74: Business tier download pages do not display "Powered by NigeriaTransfer" branding

### Transfer Management (Post-Creation)

- FR75: Authenticated users can extend the expiry date of their active transfers (within tier limits)
- FR76: Authenticated users can modify the download limit of their active transfers
- FR77: Authenticated users can add or change password protection on their active transfers
- FR78: Users can print a browser-native transfer receipt showing files sent, sizes, recipient, date, and expiry

### Static & Marketing Pages

- FR79: System serves static pages: /about, /privacy, /terms, /contact with relevant content
- FR80: System serves an /artists page displaying credited artwork with artist names and links
- FR81: System serves a /pricing page with tier comparison table, all prices in Naira, FAQ section, and upgrade CTAs
- FR82: System generates and serves sitemap.xml, robots.txt, and Open Graph meta tags on all public pages
- FR83: Download pages include Open Graph meta tags enabling rich previews when shared on WhatsApp and social media
- FR84: System serves SEO landing pages at /send-large-files-nigeria and /wetransfer-alternative-nigeria

### Daily Transfer Limits

- FR85: Free tier users are limited to 10 transfers per day
- FR86: Pro tier users are limited to 100 transfers per day
- FR87: Business tier users are limited to 500 transfers per day
- FR88: System displays clear messaging when a user reaches their daily transfer limit

### Content Moderation (Minimal)

- FR89: Download pages include an "Report Abuse" link that submits a report to the admin
- FR90: Administrators can disable/delete any transfer via admin interface
- FR91: Terms of Service prohibit illegal content, malware, and copyright infringement with clear enforcement language

### Administration & Operations

- FR62: System logs all downloads with timestamp, IP hash, user-agent, and country
- FR63: System monitors storage utilization and triggers auto-rejection at configurable threshold
- FR64: System performs daily database backups to Cloudflare R2
- FR65: System generates daily storage utilization and transfer volume reports
- FR66: System tracks and reports egress bandwidth consumption against 10TB monthly limit

## Non-Functional Requirements

### Performance

- NFR1: Upload initiation (tus create) completes in <1 second as measured by server response time
- NFR2: Download page (transfer metadata + file list) loads in <2 seconds on mobile 3G as measured by Lighthouse
- NFR3: First Contentful Paint <3 seconds on mobile 3G for all pages as measured by Lighthouse
- NFR4: System supports 10 concurrent file uploads and 50 concurrent downloads without degradation as measured by load testing
- NFR5: ZIP archive generation for multi-file downloads begins streaming within 3 seconds of request
- NFR6: File transfer from Oracle block storage to Cloudflare R2 completes within 30 seconds per GB

### Security

- NFR7: All connections use TLS 1.2+ as enforced by Caddy reverse proxy
- NFR8: Files on Cloudflare R2 are encrypted at rest (AES-256, R2 default)
- NFR9: Transfer passwords are hashed with bcrypt (minimum 10 rounds) before storage
- NFR10: Password attempts are rate-limited to 5 per minute per transfer per IP
- NFR11: Upload creation is rate-limited to 10 per hour per IP (anonymous) and 50 per hour (authenticated)
- NFR12: Downloads are rate-limited to 100 per hour per IP
- NFR13: All file paths are sanitized to prevent path traversal attacks
- NFR14: Transfer short codes use cryptographically random generation (nanoid, 21 characters)
- NFR15: No direct file access — all downloads go through API which validates expiry, download limits, and password
- NFR16: CSP headers restrict script sources to own domain + AdSense + analytics

### Scalability

- NFR17: System architecture supports migration from Oracle free tier to paid hosting without code changes
- NFR18: File storage on Cloudflare R2 scales independently from compute with zero code changes
- NFR19: Database schema supports horizontal read scaling via read replicas when needed
- NFR20: Upload throttling activates automatically when concurrent uploads exceed safe IOPS threshold (configurable, default 10)

### Accessibility

- NFR21: All interactive elements have minimum 44x44px touch targets on mobile
- NFR22: Upload progress, errors, and success states are announced to screen readers via ARIA live regions
- NFR23: Color contrast meets WCAG 2.1 AA for all text (4.5:1 normal text, 3:1 large text)
- NFR24: All functionality is keyboard-accessible (tab navigation, Enter/Space activation)
- NFR25: Download page functions without JavaScript (download link rendered server-side)

### Reliability

- NFR26: System maintains >99.5% uptime as measured by Uptime Kuma checks every 60 seconds
- NFR27: Hourly cleanup cron job executes with <0.1% failure rate as measured by cron logs
- NFR28: Daily database backup to R2 completes with zero failures as measured by backup verification script
- NFR29: Paystack webhook processing achieves >99.9% success rate with automatic retry for failures

### Integration

- NFR30: Paystack subscription webhooks are processed within 5 seconds of receipt
- NFR31: Email notifications are sent within 60 seconds of trigger event
- NFR32: R2 file operations (upload, delete, signed URL generation) complete within 2 seconds
- NFR33: Public API responds to all endpoints within 500ms for 95th percentile as measured by server-side timing

### Performance — Web Vitals (Formalized from Narrative)

- NFR34: Time to Interactive <5 seconds on Tecno Spark (2GB RAM, MediaTek) on 3G as measured by WebPageTest
- NFR35: Largest Contentful Paint <4 seconds on mobile 3G as measured by Lighthouse
- NFR36: Initial JavaScript bundle <200KB (gzipped) as measured by build output analysis
- NFR37: TTFB (Time to First Byte) <500ms from Nigeria via Cloudflare as measured by synthetic monitoring

### Data Governance

- NFR38: Download logs retained for 90 days, then automatically purged
- NFR39: User account data deleted within 30 days of deletion request per NDPA
- NFR40: Database backup Recovery Point Objective (RPO): 24 hours. Recovery Time Objective (RTO): 1 hour (tested via migration runbook)

### Content Moderation

- NFR41: Abuse reports processed within 24 hours (manual review)
- NFR42: Reported transfers can be disabled within 5 minutes of admin action

## Open Questions — Resolved

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| OQ1 | Registered-free tier (5GB/14d)? | **No — collapse to 3 tiers.** Free 4GB/7d, Pro 10GB/30d, Business 50GB/60d. | Simplifies tier enforcement, reduces UI complexity. Registered users get dashboard/history benefits but same transfer limits as anonymous. Revisit if conversion data suggests a middle tier is needed. |
| OQ2 | Daily transfer limits? | **Yes — FR85-FR88 added.** Free 10/day, Pro 100/day, Business 500/day. | Prevents abuse and manages storage churn. Requires simple per-user daily counter in DB. |
| OQ3 | Custom branding at launch? | **Yes — FR71-FR74 added.** Business tier self-serve branding. | Product brief and success criteria depend on it. Drives Business tier value justification at NGN 10,000/month. |
| OQ4 | Preview-only mode + watermark? | **Deferred to Phase 2.** | Requires image processing pipeline (watermark overlay). Too complex for launch. Documented as Phase 2 alongside Sell Your Files. |
| OQ5 | API pricing model? | **Freemium: 1,000 API calls/month free, then NGN 5,000/month for 50K calls.** | Simple, low-friction entry for developers. Revenue scales with usage. Metering infrastructure is straightforward (daily counter per API key). |
| OQ6 | Framework choice? | **Deferred to architecture.** NFR36 (200KB bundle) is now a hard constraint. Architect decides Next.js vs. Astro. | PRD should not prescribe technology — that's the architect's job. The NFR enforces the outcome. |
| OQ7 | Email provider? | **Brevo Starter ($9/month for 5,000 emails).** Budget from day one. | Free tiers are insufficient at projected volume (285 emails/day). SPF/DKIM/DMARC + 2-4 week domain warmup before launch. |
