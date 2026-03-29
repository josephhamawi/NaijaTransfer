# NigeriaTransfer — BMAD Orchestrator Build Prompt

## Project Vision

Build **NigeriaTransfer** — the first Nigerian-owned large file transfer service AND file infrastructure API. A SwissTransfer/WeTransfer competitor purpose-built for the Nigerian market. Zero account required. Fast. Secure. Monetized from day one with freemium + ads + API/enterprise contracts. Compute on Oracle Cloud Always-Free tier, files on Cloudflare R2 (zero egress fees).

### Critical Decisions (Finalized)
1. **Ship ALL features at once** — no phased MVP, no staged rollout
2. **Target ALL user segments simultaneously** — creators, businesses, students, diaspora, general public
3. **API/infrastructure vision from day one** — public API at launch, not a future feature
4. **Diaspora is a PRIMARY audience** — 15-17M Nigerians abroad, higher ARPU, served equally to domestic users
5. **Sell Your Files deferred to Phase 2** — requires Nigerian fintech lawyer consultation (VAT, AML, payment facilitator licensing, refund policy)
6. **Files stored on Cloudflare R2** — not Oracle block storage. Oracle = compute only. This decouples storage from Oracle's termination risk
7. **Paystack only** at launch — no Flutterwave
8. **No ClamAV** at launch — too resource-heavy for shared VM
9. **Lightweight mode DEFAULT on mobile** — full art experience is opt-in

**Tagline:** *"Send large files. No account. No wahala."*

---

## Market Context (Non-Negotiable — Every Design Decision Must Reflect This)

- **Target market:** Nigeria — 109M+ internet users, 75%+ mobile traffic, mobile-first country
- **Average speeds:** 20–36 Mbps download (urban), 11 Mbps (rural). Design for slow/unstable connections.
- **Zero local competition.** Nigerians currently use WhatsApp (compresses files, 2GB cap), Google Drive (requires account), WeTransfer (2GB free, slow from Nigeria, USD pricing)
- **Ad CPM in Nigeria is $0.10–$0.50** — ads alone cannot sustain the business. Freemium is the primary revenue model.
- **Currency:** Nigerian Naira (NGN/₦). All pricing must be in Naira. Payment via Paystack only at launch (card, bank transfer, USSD).
- **Opera Mini is widely used** — many users have ad blockers or compressed browsing. Don't rely on ads rendering for core UX.
- **Key user segments:**
  - Nollywood filmmakers & media agencies (large video files)
  - Business professionals (contracts, proposals, designs)
  - Students & academics (research, projects)
  - Diaspora Nigerians (sending files home)
  - General public (photos, documents, anything too big for WhatsApp)

---

## Best Features Stolen From WeTransfer & SwissTransfer

We analyzed both competitors and cherry-picked the best from each. NigeriaTransfer must implement ALL of these.

### From WeTransfer — UX & Design Excellence

| Feature | What They Do | How NigeriaTransfer Adapts It |
|---------|-------------|-------------------------------|
| **Full-bleed wallpaper backgrounds** | Beautiful rotating artwork behind the upload widget. 30% given to artists. Huge brand differentiator — people remember WeTransfer for its aesthetic. | Rotate stunning **Nigerian art, photography, and Afrobeats visuals** as backgrounds. Partner with Nigerian artists/photographers. Feature Nollywood movie stills, Lagos skylines, cultural imagery. This becomes a marketing channel AND identity. |
| **One-screen upload flow** | Everything on one page: add files (+), recipient email, your email, message, "Transfer" button. Zero navigation. | Same. The homepage IS the upload page. One screen. No clicks to find the upload. Drag-and-drop zone dominates the page. |
| **Download email with "Get your files" CTA** | Recipients get a branded email with a big blue button to download. Clean, clear, trustworthy. | Send branded emails: "You received files via NigeriaTransfer" with a green "Download Your Files" button. Include sender's message. Must look premium, not spammy. |
| **File previews before download** | Recipients can preview images, videos, PDFs before downloading. Mobile-optimized. Built for phones. | Implement file preview on download page — image thumbnails, video player preview, PDF first page. Critical for mobile users who want to check before using data. |
| **Download individual files OR all** | Recipients can pick specific files or "Download All" as a bundle. | Same. List each file with size + individual download button. Plus "Download All as ZIP" option. |
| **Send-to-email OR link sharing** | Two modes: email transfer (enter recipient emails) or generate a link to share yourself. | Same two modes + add: **"Share via WhatsApp"** button (deep link), **"Share via SMS"** (crucial for Nigeria), and **QR code**. |
| **Custom wallpaper/branding (paid)** | Paid users can upload their own background image, add logo and text to the download page. Turns the transfer into branded content. | Business tier (₦10,000/mo): custom logo, brand colors, custom background on download page. Company message. Turns NigeriaTransfer into a white-label tool for businesses. |
| **File request feature** | Generate a link and send it to someone so THEY can upload files TO YOU. Reverses the flow. | Implement "Request Files" — user creates an upload portal, shares the link, and recipients upload to that portal. Huge for businesses collecting documents (HR, legal, media). |
| **Sell your transfer (Stripe)** | Creators can set a price on their transfer. Recipients pay to download. | Implement "Sell Your Files" — connect Paystack, set a Naira price. Huge for Nollywood, music producers, digital creators, photographers selling assets. **This is a killer feature for Nigeria's creator economy.** |
| **Download verification/tracking** | Senders get notified when files are downloaded. Can see who downloaded what. | Real-time notifications (email + in-app). "Your file was downloaded at 3:42 PM" — builds trust and accountability. |
| **Preview-only mode** | Senders can share files as preview-only (no download allowed) with optional watermark. | Implement preview-only + watermark for paid tiers. Perfect for photographers showing proofs, designers sharing mockups for approval. |

### From SwissTransfer — Power Features & Privacy

| Feature | What They Do | How NigeriaTransfer Adapts It |
|---------|-------------|-------------------------------|
| **50 GB free transfers** | Massively higher than WeTransfer's 2GB free. The single biggest selling point. No premium needed for large files. | We offer **4 GB free** (2x WeTransfer). Pro gets 10GB. Business gets 50GB. Still far more generous than WeTransfer free. |
| **No account required at all** | Upload and share without any sign-up. Zero friction. | Same. Anonymous uploads for free tier. Account only needed for dashboard, history, premium features. |
| **Password protection (free)** | Any user can add a password to their transfer. Not locked behind a paywall. | **Password protection is free** for all tiers. Don't paywall security. |
| **Configurable expiry (1–30 days)** | Users choose exactly when their transfer expires. Granular control. | Free: 7 days fixed. Registered free: 1–14 days configurable. Pro: 1–30 days. Business: 1–60 days. |
| **Download limit (1–250)** | Users set exactly how many times a file can be downloaded. Great for controlled distribution. | Free: max 50 downloads. Pro: 1–250 configurable. Business: unlimited. |
| **Privacy-first / data sovereignty** | "Your files stored on Swiss servers" — strong privacy branding. GDPR + FADP compliant. No ads. | Brand as "Nigerian-owned. Your files. Your data. Hosted for Nigerians." Data sovereignty messaging. Comply with NDPR (Nigeria Data Protection Regulation). |
| **Browser extension (Chrome)** | Quick-transfer without visiting the website. Right-click → send via SwissTransfer. | Build a Chrome extension for quick uploads. Low effort, high utility for power users and businesses. |
| **Mobile apps (iOS + Android)** | Native apps with full upload/download, dark mode, QR sharing, WhatsApp/Signal integration. | **Must-have for Nigeria (75%+ mobile).** Build native-feeling PWA first (faster to ship), then native apps. Must support: dark mode, share sheet integration, QR codes, WhatsApp/SMS sharing. |
| **Real-time download notifications** | Senders get notified instantly when files are accessed. | Same — push notification (PWA) + email. |
| **500 transfers/day limit** | Generous daily limit for power users. No throttling for reasonable use. | Free: 10 transfers/day. Pro: 100/day. Business: 500/day. |
| **No file quality/size reduction** | Files transfer in original quality — no compression. | Same. Never compress or modify uploaded files. This is a key differentiator vs WhatsApp. Emphasize: "Original quality. Always." |
| **SSL encryption + secure hosting** | End-to-end encryption during transfer. Files encrypted at rest. | Implement TLS for transit. Encrypt files at rest on the Oracle VM. Optional: client-side encryption for Business tier (zero-knowledge). |
| **QR code sharing** | Generate QR code for the transfer link — perfect for in-person sharing. | QR code on every transfer success page. Huge in Nigeria for in-person document handoff (offices, events, markets). |
| **Open-source mobile apps** | SwissTransfer's iOS app is open-source on GitHub. | Consider open-sourcing the frontend to build trust and community. |

### NigeriaTransfer Exclusive Features (Not in Either Competitor)

| Feature | Why It Matters for Nigeria |
|---------|--------------------------|
| **"Share via WhatsApp" button** | WhatsApp is THE messaging app in Nigeria. One-tap sharing of transfer links via WhatsApp deep link is non-negotiable. |
| **"Share via SMS" button** | Many Nigerians still rely on SMS. Generate a short link and open the SMS app with pre-filled message. |
| **USSD payment support** | Via Paystack — users without smartphones or cards can pay for Pro via USSD codes. |
| **Lightweight mode / data saver** | Toggle that disables background images, animations, and preview thumbnails. For users on expensive metered data. |
| **Naira pricing** | All prices in ₦. No USD conversion confusion. Feels local. |
| **Sell Your Files (Paystack)** | Nigerian creators can sell digital assets (music, video, photos, templates) via transfer links. Paystack handles payment. 5% platform fee = revenue for NigeriaTransfer. |
| **File Request portals** | Businesses create upload portals — "Submit your CV here", "Upload project files here." HR departments, media companies, schools. |
| **Offline upload queue** | If connection drops mid-selection, queue files and auto-upload when connection returns. Service worker + IndexedDB. |
| **Transfer receipt** | After successful transfer, generate a downloadable PDF receipt: files sent, sizes, recipient, date, expiry. Useful for business record-keeping. |
| **Bandwidth estimation** | Before upload starts, estimate upload time based on connection speed. "This will take approximately 12 minutes on your connection." Helps users on slow networks decide whether to proceed. |

---

## Core Product Requirements

### 1. File Transfer Flow (The Core Loop)

```
UPLOAD FLOW:
User visits site → drags/selects files → optionally sets:
  - Expiry (1–30 days)
  - Download limit (1–250)
  - Password protection
  - Email notification to recipient(s)
→ files upload with resumable chunked upload (tus protocol) →
→ progress bar with speed indicator and ETA →
→ upload completes → user gets a shareable short link + QR code
→ optional: send link via email or copy to clipboard

DOWNLOAD FLOW:
Recipient opens link → sees transfer details (file names, sizes, expiry) →
→ if password protected: enter password screen →
→ if free tier: show non-intrusive ad (5-second countdown optional) →
→ download starts (direct stream, no zip unless multiple files) →
→ download counter increments →
→ if limit reached or expired: show "transfer expired" page with CTA to create own transfer
```

### 2. File Size & Storage Strategy

The Oracle Cloud free VM has 200GB block storage. Strategy:

| Tier | Max Per Transfer | Max Total Storage | Expiry Default | Expiry Max |
|------|-----------------|-------------------|----------------|------------|
| Free (anonymous) | 4 GB | — | 7 days | 7 days |
| Free (registered) | 5 GB | — | 7 days | 14 days |
| Pro (₦2,000/mo) | 10 GB | 50 GB active | 14 days | 30 days |
| Business (₦10,000/mo) | 50 GB | 200 GB active | 30 days | 60 days |

**Critical:** Aggressive automated cleanup of expired files is essential. A cron job must run every hour to delete expired transfers and reclaim storage. Without this, the 200GB fills up fast.

### 3. Resumable Uploads (Non-Negotiable)

Nigerian internet is unstable. Uploads MUST be resumable. Use the **tus protocol** (https://tus.io).
- Chunk size: 5MB (balances progress granularity vs overhead on slow connections)
- Resume from where it left off after disconnect
- Show: progress %, upload speed, ETA, "paused/resuming" states
- Allow manual pause/resume button
- Store upload state in localStorage so refreshing the page doesn't lose progress

### 4. Resumable Downloads

Large downloads also need resume support:
- Serve files with `Accept-Ranges: bytes` header
- Support HTTP Range requests
- Users with download managers (common in Nigeria) can resume interrupted downloads

---

## Technical Architecture

### Infrastructure: Oracle Cloud Always-Free Tier

```
┌─────────────────────────────────────────────────┐
│              Cloudflare (Free Tier)              │
│  - DNS management                                │
│  - CDN for static assets                         │
│  - DDoS protection                               │
│  - SSL termination                               │
│  - Page Rules for caching                        │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│         Oracle Cloud ARM VM (Always Free)        │
│         4 OCPU / 24 GB RAM / Ubuntu 22.04        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              Caddy (Reverse Proxy)           │ │
│  │         Auto HTTPS / Rate Limiting           │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │                             │
│  ┌──────────────────▼──────────────────────────┐ │
│  │           Application Server                 │ │
│  │                                               │ │
│  │   Next.js 14+ (App Router)                   │ │
│  │   - Server-side rendering for SEO            │ │
│  │   - API routes for backend logic             │ │
│  │   - tus server middleware for uploads        │ │
│  │   - Streaming downloads                      │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │                             │
│  ┌──────────────────▼──────────────────────────┐ │
│  │            PostgreSQL / SQLite               │ │
│  │                                               │ │
│  │   Tables:                                     │ │
│  │   - transfers (id, short_code, type,          │ │
│  │     created_at, expires_at, password_hash,    │ │
│  │     download_limit, download_count, total_size│ │
│  │     sender_email, recipient_emails, message,  │ │
│  │     tier, user_id, is_paid, price_amount,     │ │
│  │     preview_only, custom_bg_path, brand_logo) │ │
│  │   - files (id, transfer_id, filename, size,   │ │
│  │     mime_type, storage_path, checksum,         │ │
│  │     preview_path, preview_generated)          │ │
│  │   - users (id, email, phone, name, tier,      │ │
│  │     plan_start, plan_end, paystack_cust_id,   │ │
│  │     paystack_sub_id, stripe_connect_id)       │ │
│  │   - download_logs (id, transfer_id, file_id,  │ │
│  │     ip, user_agent, downloaded_at, country)   │ │
│  │   - payments (id, user_id, transfer_id,       │ │
│  │     type, amount, currency, fee, provider,    │ │
│  │     reference, status, created_at)            │ │
│  │   - file_requests (id, user_id, short_code,   │ │
│  │     title, message, status, created_at)       │ │
│  │   - file_request_uploads (id, request_id,     │ │
│  │     uploader_email, files, uploaded_at)        │ │
│  │   - wallpapers (id, image_path, artist_name,  │ │
│  │     artist_url, active, display_order)        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         Block Storage (200 GB)               │ │
│  │         /mnt/transfers/{transfer_id}/        │ │
│  │         {original_filename}                  │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │              Cron Jobs                        │ │
│  │  - Hourly: delete expired transfers + files  │ │
│  │  - Daily: storage usage report               │ │
│  │  - Daily: email digest (transfers about to   │ │
│  │           expire, download notifications)    │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js 20+ | Async I/O for concurrent uploads/downloads, huge ecosystem |
| **Framework** | Next.js 14+ (App Router) | SSR for SEO, API routes, React frontend, single deployment |
| **Database** | PostgreSQL 16 (via Docker) or SQLite (simpler start) | Reliable, free, handles the scale |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Upload Protocol** | tus (via @tus/server) | Resumable uploads, battle-tested |
| **CSS** | Tailwind CSS 4 | Fast development, responsive, mobile-first |
| **UI Components** | shadcn/ui | Beautiful, accessible, customizable |
| **Auth** | NextAuth.js (Auth.js v5) | Email magic link + Google OAuth, optional (not required to send) |
| **Payments** | Paystack (primary), Flutterwave (fallback) | Naira payments, subscriptions, Nigerian market leaders |
| **Email** | Resend (free tier: 100/day) or Brevo (free: 300/day) | Transactional emails for transfer notifications |
| **Reverse Proxy** | Caddy | Auto HTTPS, simple config, performant |
| **Process Manager** | PM2 | Keep Node.js alive, auto-restart, logs |
| **Analytics** | Umami (self-hosted, free) | Privacy-friendly, GDPR compliant, no cookie banner needed |
| **Ads** | Google AdSense + AdHang (Nigerian network) | Dual ad provider for better fill rates in Nigeria |
| **Monitoring** | Uptime Kuma (self-hosted) | Free uptime monitoring |

---

## Frontend Design Requirements

### Design Philosophy
- **Mobile-first.** 75%+ of Nigerian users are on mobile. Design for 360px width first, then scale up.
- **Lightweight.** Target < 200KB initial JS bundle. Nigerian data is expensive — respect bandwidth.
- **Fast.** Target < 3 second First Contentful Paint on 3G connection.
- **Offline-tolerant.** Show meaningful states when connection drops mid-upload. Never lose progress silently.
- **Nigerian identity.** Use green (#008751) and white as accent colors (Nigerian flag). Modern, clean, trustworthy design. NOT cluttered or cheap-looking.

### Design Aesthetic — WeTransfer-Inspired with Nigerian Identity

The homepage must feel like WeTransfer: **full-bleed background artwork** behind a clean, floating upload widget. But with Nigerian soul.

- **Rotating backgrounds:** Stunning full-screen Nigerian photography and art — Lagos at night, Zuma Rock, Nigerian textile patterns, Afrobeats concert shots, Niger Delta waterways, market scenes. Partner with Nigerian photographers/artists and credit them.
- **Upload widget:** Floating card/panel centered on the page (like WeTransfer's), semi-transparent or frosted glass effect over the background. Clean, minimal, premium.
- **Color palette:** Primary: Nigerian green (#008751). Accent: white (#FFFFFF). Neutral: dark charcoal (#1A1A2E). Success: gold (#FFD700). Error: warm red (#E74C3C). This is NOT a generic SaaS palette — it's unmistakably Nigerian.
- **Typography:** System font stack for speed (no web font downloads). Or single lightweight font max (Inter or Plus Jakarta Sans).
- **Dark mode:** Support dark mode toggle. Auto-detect system preference. Dark backgrounds are also great for showcasing the wallpaper art.

### Pages Required

1. **Homepage / Upload Page** (`/`) — THE most important page
   - Full-bleed rotating background artwork (Nigerian art/photography, new image on each visit)
   - Floating upload widget (centered card):
     - Drag-and-drop zone with "+" button and "or click to select files" text
     - File list with thumbnails (images), icons (other types), individual sizes, remove button per file
     - Total size indicator: "3 files — 847 MB total"
     - Two-tab toggle: **"Email Transfer"** (enter recipient emails + your email) vs **"Get a Link"** (just generate a shareable link)
     - Settings accordion/panel (expandable):
       - Expiry dropdown (7 days default for free)
       - Download limit input
       - Password toggle + password field
       - Personal message textarea
     - Big green "Transfer" button
     - Progress state: per-file progress bars, overall progress %, upload speed (MB/s), ETA, pause/resume button
     - Success state: shareable link, QR code, copy button, "Share via WhatsApp" / "Share via SMS" / "Share via Email" buttons
   - Below the fold (scrollable):
     - "How it works" — 3 steps with icons
     - "Why NigeriaTransfer?" — trust signals, comparison vs WhatsApp/Drive/WeTransfer
     - "For Businesses" CTA
     - Nigerian artist credit: "Background by [Artist Name] — [View their work]"
   - **Lightweight mode toggle** in corner: disables background image + animations for data-saving users

2. **Download Page** (`/d/{shortCode}`) — Second most important page
   - Background: same rotating Nigerian art (or sender's custom background for Business tier)
   - Floating download card:
     - Sender info: "Files from [sender name/email]"
     - Sender's personal message (if any)
     - **File preview section:** image thumbnails (clickable to preview full), video thumbnail with play button (streams preview), PDF first-page preview. Other file types show icon + metadata.
     - File list: filename, size, type icon, individual "Download" button per file
     - "Download All" button (ZIP bundle with progress)
     - Expiry countdown: "Expires in 5 days, 3 hours"
     - Downloads remaining: "47 of 50 downloads left"
   - Password gate (if protected): clean password input screen shown BEFORE any file details are visible
   - Ad placement (free tier transfers only):
     - Single non-intrusive banner below the download card
     - OR 5-second countdown: "Your download is ready in 5... 4... 3..." with ad displayed
     - NO popups. NO interstitials that block. NO auto-playing video ads.
   - "Send your own files — free!" CTA at bottom
   - "Powered by NigeriaTransfer" branding (removable for Business tier)

3. **Transfer Success Page** (inline state change on homepage, not a new page)
   - Upload widget transforms to show:
     - Green checkmark animation
     - Shareable link (big, prominent, one-tap copy to clipboard with "Copied!" toast)
     - QR code (scannable for in-person sharing)
     - Share buttons row: WhatsApp | SMS | Email | Copy Link
     - Transfer summary: files, total size, expiry date, download limit
     - "Send Another Transfer" button
     - "Download transfer receipt (PDF)" link — generates a PDF receipt for business record-keeping

4. **File Request Page** (`/request/{code}`) — Reverse flow
   - Someone has requested files FROM the visitor
   - Message: "[Person/Company] is requesting files from you"
   - Requester's message
   - Upload zone (same drag-and-drop as homepage)
   - No sign-up needed for the uploader
   - Files go to the requester's dashboard

5. **Sell Your Files Page** (`/buy/{shortCode}`) — Creator monetization
   - File preview (images, video thumbnails, descriptions)
   - Price displayed in Naira: "₦5,000"
   - "Buy & Download" button → Paystack checkout
   - After payment → instant download access
   - Seller gets paid via Paystack (minus 5% NigeriaTransfer fee)

6. **Pricing Page** (`/pricing`)
   - Three tiers: Free / Pro (₦2,000/mo) / Business (₦10,000/mo)
   - All prices in Naira (₦)
   - Feature comparison table (detailed, every feature listed)
   - "Start free — no account needed" big CTA
   - "Upgrade to Pro" / "Contact for Business" CTAs
   - FAQ section: "Is it really free?", "How do I pay?", "Can I cancel anytime?", "What payment methods?"
   - Testimonials (add after launch)

7. **Dashboard** (`/dashboard`) — Authenticated users only
   - **My Transfers tab:** List of active transfers with: file count, total size, downloads count, expiry countdown, status (active/expired), actions (copy link, delete, extend expiry)
   - **File Requests tab:** Active request portals, received files
   - **Sales tab:** Files being sold, revenue earned, Paystack payout history
   - **Storage meter:** Visual bar showing usage vs limit
   - **Subscription card:** Current plan, next billing date, upgrade/cancel buttons
   - **Transfer history:** Searchable/filterable archive of all past transfers
   - **Analytics:** Downloads per transfer over time (simple chart)

8. **Auth Pages** (`/login`, `/register`)
   - Email magic link (primary — no password to remember)
   - Google OAuth (secondary)
   - Phone number + OTP (via Paystack/Termii — important for Nigeria, many prefer phone auth)
   - Registration is optional — big message: "No account needed to send files"

9. **Static Pages**
   - `/about` — Nigerian-owned story, team, mission ("Built in Nigeria, for Nigeria")
   - `/privacy` — Privacy policy (NDPR compliant)
   - `/terms` — Terms of service
   - `/contact` — Contact form + email + WhatsApp business link
   - `/artists` — Gallery of featured background artists with links to their work

10. **SEO Landing Pages**
    - `/send-large-files-nigeria` — "Send Large Files in Nigeria — Free"
    - `/wetransfer-alternative-nigeria` — "Best WeTransfer Alternative for Nigerians"
    - `/nollywood-file-sharing` — "File Sharing for Nollywood Productions"
    - `/sell-digital-files-nigeria` — "Sell Your Digital Files in Nigeria"

11. **Error/Status Pages**
    - Transfer expired — with "Send your own files" CTA
    - Download limit reached — with explanation + CTA
    - File not found (404) — friendly, branded
    - Upload failed — with retry button + tips for slow connections
    - Payment failed — with retry + alternative payment methods
    - Server error (500) — "We're fixing this. Try again shortly."

### Key UI Components

- **UploadZone:** Drag-and-drop + click-to-select, file thumbnails (images) / icons (other types), individual file removal, total size counter, "Add more files" button
- **ProgressBar:** Per-file and overall progress, upload speed (MB/s), ETA, pause/resume button, "resuming..." state indicator, connection quality indicator
- **TransferSettings:** Expandable accordion — expiry dropdown, download limit input, password toggle + input, email recipients (tag input), personal message textarea, "Sell this transfer" toggle (paid tiers)
- **ShareCard:** After upload — link with copy button, QR code, WhatsApp share button, SMS share, email share, "Download receipt" link
- **DownloadCard:** File list with previews/thumbnails, sizes, type icons, download individual or all, expiry countdown timer, downloads remaining counter
- **FilePreview:** Modal/lightbox for previewing images (full size), videos (stream), PDFs (embedded viewer), audio (player). Opens on click from download page.
- **BackgroundWallpaper:** Full-bleed image behind all pages. Rotating set of Nigerian art. Crossfade transition. Lazy-loaded. Respects lightweight mode toggle.
- **LightweightToggle:** Corner toggle button that disables: background images, animations, file preview thumbnails, non-essential images. For data-conscious users.
- **BandwidthEstimator:** Small inline component showing estimated upload/download time based on measured connection speed.
- **PricingTable:** Responsive comparison table with highlight on recommended plan
- **AdBanner:** Only on free-tier download pages, non-intrusive, with fallback if ad doesn't load (no blank space)

---

## Backend API Specification

### Public Endpoints (No Auth Required)

```
POST   /api/upload/create     — Initialize a new transfer, returns transfer_id + tus upload URLs
POST   /api/upload/files/*    — tus upload endpoint (handled by tus server)
GET    /api/transfer/{code}   — Get transfer metadata (for download page)
POST   /api/transfer/{code}/verify-password — Verify download password
GET    /api/transfer/{code}/download/{fileId} — Stream file download (with range support)
GET    /api/transfer/{code}/download-all — Stream ZIP of all files
GET    /api/transfer/{code}/preview/{fileId} — Get file preview (thumbnail, first page, video poster)
POST   /api/transfer/{code}/notify — Send email notification to recipient
```

### File Request Endpoints (Public)

```
GET    /api/request/{code}          — Get file request details (who's requesting, message)
POST   /api/request/{code}/upload   — Upload files to a request (tus endpoint)
```

### Sell/Purchase Endpoints (Public)

```
GET    /api/buy/{code}              — Get sellable transfer details (preview, price)
POST   /api/buy/{code}/initiate     — Initiate Paystack payment for transfer purchase
GET    /api/buy/{code}/verify       — Verify payment and grant download access
```

### Authenticated Endpoints

```
GET    /api/user/transfers          — List user's transfers
DELETE /api/user/transfers/{id}     — Delete a transfer early
PATCH  /api/user/transfers/{id}     — Update transfer settings (extend expiry, change limits)
GET    /api/user/storage            — Get storage usage
GET    /api/user/subscription       — Get subscription status
POST   /api/user/subscription/create — Create Paystack subscription
POST   /api/user/subscription/cancel — Cancel subscription

# File Requests
POST   /api/user/requests/create    — Create a file request portal
GET    /api/user/requests           — List active file requests
DELETE /api/user/requests/{id}      — Close a file request
GET    /api/user/requests/{id}/files — Get files uploaded to a request

# Sell Files
POST   /api/user/sell/create        — Create a paid transfer (set price)
GET    /api/user/sell/earnings      — Get earnings/payout summary
GET    /api/user/sell/transactions  — List purchase transactions

# Analytics
GET    /api/user/analytics/{transferId} — Download stats over time for a transfer
```

### Webhook Endpoints

```
POST   /api/webhooks/paystack       — Handle Paystack payment/subscription/purchase events
```

### Internal / Cron

```
Cron: cleanup-expired       — Delete expired transfers + files (hourly)
Cron: send-expiry-warnings  — Email users about transfers expiring in 24h (daily)
Cron: storage-report        — Log storage metrics (daily)
Cron: payout-sellers        — Process pending seller payouts (daily)
Cron: rotate-wallpaper      — Update featured background art rotation (weekly)
```

---

## Security Requirements

1. **File isolation:** Each transfer gets its own directory. No path traversal possible. Sanitize all filenames.
2. **Rate limiting:**
   - Upload creation: 10/hour per IP (anonymous), 50/hour (authenticated)
   - Downloads: 100/hour per IP
   - Password attempts: 5/minute per transfer per IP (brute-force protection)
3. **Password hashing:** bcrypt with salt for transfer passwords
4. **No direct file access:** All downloads go through the API which checks expiry, download limits, and password
5. **Virus scanning:** Optional but recommended — integrate ClamAV (free, open-source) to scan uploads. Reject known malware.
6. **Input validation:** Validate all inputs server-side. Sanitize filenames, limit message lengths, validate emails.
7. **CORS:** Restrictive — only allow requests from your own domain
8. **Helmet.js:** Security headers on all responses
9. **CSP:** Strict Content Security Policy (allow AdSense/ad network domains)
10. **No sensitive data in URLs:** Transfer codes should be random UUIDs or nanoid, not sequential

---

## Payment Integration (Paystack)

### Subscription Plans

```javascript
const PLANS = {
  pro: {
    name: 'NigeriaTransfer Pro',
    amount: 200000, // ₦2,000 in kobo
    interval: 'monthly',
    currency: 'NGN',
    features: {
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      maxExpiry: 30,
      defaultExpiry: 14,
      downloadLimit: 250,
      passwordProtection: true,
      noAds: true,
      prioritySpeed: true,
    }
  },
  business: {
    name: 'NigeriaTransfer Business',
    amount: 1000000, // ₦10,000 in kobo
    interval: 'monthly',
    currency: 'NGN',
    features: {
      maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
      maxExpiry: 60,
      defaultExpiry: 30,
      downloadLimit: -1, // unlimited
      passwordProtection: true,
      noAds: true,
      prioritySpeed: true,
      customBranding: true,
      apiAccess: true,
      teamMembers: 5,
    }
  }
};
```

### Paystack Integration Flow

```
User clicks "Upgrade to Pro" →
  POST /api/user/subscription/create →
    Server creates Paystack subscription via API →
      Redirect to Paystack checkout (Naira, card/bank/USSD) →
        User pays →
          Paystack webhook fires →
            Server activates subscription →
              User redirected to dashboard with "Pro" badge
```

Support these payment methods (all via Paystack):
- Debit/credit card
- Bank transfer
- USSD (important for users without smartphones/cards)
- Mobile money

---

## SEO & Growth Strategy (Build Into the Product)

### SEO Pages
- `/send-large-files-nigeria` — Landing page targeting "send large files Nigeria"
- `/wetransfer-alternative-nigeria` — Comparison page
- `/nollywood-file-sharing` — Niche landing page for film industry
- Blog at `/blog` with articles like:
  - "How to send large files in Nigeria without WhatsApp"
  - "Best free file sharing for Nollywood productions"
  - "NigeriaTransfer vs WeTransfer: Which is better for Nigerians?"

### Viral Mechanics Built Into Product
- Every download page has "Send your own files free" CTA
- "Share via WhatsApp" button on transfer success (WhatsApp is king in Nigeria)
- QR code for in-person sharing
- Email notifications: "You received files via NigeriaTransfer" with branding
- Referral program: "Invite 3 friends, get 1 month Pro free"

### Technical SEO
- Server-side rendered pages (Next.js SSR)
- Open Graph tags on download pages (preview in WhatsApp/social)
- Sitemap.xml, robots.txt
- Schema markup for SoftwareApplication
- Fast Core Web Vitals (< 3s LCP)

---

## Deployment & DevOps

### Oracle Cloud VM Setup

```bash
# VM Spec (Always Free)
# Shape: VM.Standard.A1.Flex (ARM)
# OCPU: 4, RAM: 24 GB
# OS: Ubuntu 22.04 aarch64
# Boot Volume: 50 GB
# Block Volume: 200 GB (mounted at /mnt/transfers)

# Software Stack
- Caddy (reverse proxy, auto-HTTPS)
- Node.js 20 LTS (via nvm)
- PostgreSQL 16 (via Docker or apt)
- PM2 (process manager)
- Umami (analytics, Docker)
- Uptime Kuma (monitoring, Docker)
- ClamAV (virus scanning, optional)
- Docker + Docker Compose (for ancillary services)
```

### Deployment Flow

```
Developer pushes to main →
  GitHub Actions runs tests + build →
    SSH deploy to Oracle VM →
      Pull latest, install deps, run migrations, restart PM2
```

### Backup Strategy (Free)

- **Database:** Daily pg_dump to Oracle Object Storage (20GB free)
- **Files:** No backup needed — files are temporary by design. Only backup the DB.
- **Config:** All config in git (secrets in .env, not committed)

---

## Performance Optimization

1. **Chunked streaming downloads:** Don't load files into memory. Stream from disk to response using `fs.createReadStream()` with pipe.
2. **Upload directly to disk:** tus server writes chunks directly to block storage. No memory buffering.
3. **Cloudflare caching:** Cache static assets (JS, CSS, images) at the edge. Don't cache API responses or file downloads.
4. **Compression:** gzip/brotli for HTML/JS/CSS. Don't compress file downloads (they're often already compressed media).
5. **Connection pooling:** PostgreSQL connection pool (max 20 connections).
6. **Image optimization:** Next.js Image component for any images. WebP format.
7. **Lazy loading:** Lazy load ad scripts, analytics, non-critical JS.
8. **Service Worker:** Cache app shell for repeat visitors. Offline upload queue (start upload when back online).

---

## Monitoring & Observability

- **Uptime Kuma** (self-hosted): Monitor HTTP endpoints, alert via Telegram/email
- **PM2 monitoring:** Process health, restart counts, memory/CPU
- **Umami analytics:** Page views, unique visitors, referrers, countries
- **Custom metrics logged to DB:**
  - Daily active uploads/downloads
  - Storage utilization %
  - Average file sizes
  - Upload completion rate (started vs completed — measures how many fail due to connection)
  - Revenue (MRR, new subscriptions, churn)

---

## Phase Rollout Plan

### BUILD EVERYTHING AT ONCE — Full Feature Set From Day One

This is NOT a phased rollout. Build and ship the complete product in a single pass:

**Core Transfer Engine:**
- Upload files (single + multiple) with resumable upload (tus protocol)
- Generate shareable short link + QR code
- Download page with file streaming + Range request support
- ZIP download for multiple files
- Expiry system (7 days default free tier, configurable per tier)
- Download limits enforcement
- Password protection (bcrypt hashed)
- Hourly cron job to delete expired transfers and reclaim storage

**User System & Auth:**
- User registration with email magic link + Google OAuth
- Anonymous transfers (no account required)
- User dashboard (active transfers, storage usage, billing, transfer history)

**Monetization (Live from Launch):**
- Paystack subscription integration (Pro ₦2,000/mo + Business ₦10,000/mo)
- Tiered limits enforcement (4GB free / 10GB Pro / 50GB Business)
- Google AdSense + AdHang ads on free-tier download pages
- Referral program ("Invite 3 friends, get 1 month Pro free")

**Communication:**
- Email notifications to recipients ("You received files via NigeriaTransfer")
- WhatsApp share button (deep link)
- Expiry warning emails (24h before expiry)

**SEO & Growth Pages:**
- SEO landing pages (`/send-large-files-nigeria`, `/wetransfer-alternative-nigeria`)
- Blog with 3-5 initial articles
- Pricing page with Naira pricing
- About, Privacy, Terms pages

**Monitoring & Analytics:**
- Umami self-hosted analytics
- Uptime Kuma monitoring
- Custom metrics (uploads, downloads, storage %, MRR)

**Security:**
- Rate limiting on all endpoints
- ClamAV virus scanning on uploads
- CSP headers, Helmet.js, CORS
- Input validation and filename sanitization

**Mobile-first responsive UI across all pages.**

---

## Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Upload success rate on 3G | > 90% (resumable handles drops) |
| Time to interactive (mobile) | < 3 seconds |
| Max concurrent uploads | 50 simultaneous |
| Max concurrent downloads | 200 simultaneous |
| Uptime | 99.5% (single VM, acceptable for free tier) |
| File cleanup lag | < 2 hours after expiry |
| TTFB | < 500ms (from Nigeria, via Cloudflare) |

---

## Key Differentiators to Emphasize

1. **Nigerian-owned and operated** — not a foreign product adapted for Nigeria
2. **No account required** — zero friction for basic transfers
3. **Naira pricing** — not USD converted to Naira
4. **Resumable uploads** — built for Nigerian internet reality
5. **WhatsApp-native sharing** — one tap to share via the app everyone uses
6. **Privacy-focused** — no tracking beyond basic analytics, files auto-delete
7. **Free tier is genuinely useful** — 4GB is 2x WeTransfer's free tier, enough for real work

---

## Important Implementation Notes

- **DO NOT** over-engineer. Ship MVP fast, iterate based on real Nigerian user feedback.
- **DO** test on actual Nigerian network conditions (throttle to 5-10 Mbps, simulate packet loss).
- **DO** test on low-end Android devices (Samsung A-series, Tecno, Infinix — these dominate in Nigeria).
- **DO** make the upload experience bulletproof. A failed upload = a lost user forever.
- **DO** show file sizes in MB/GB clearly — users on metered data need to know what they're downloading.
- **DO** add a "lightweight mode" toggle that disables images/animations for users saving data.
- **DON'T** require JavaScript for the download page if possible (SSR the critical path).
- **DON'T** auto-play anything. Ever. Data is expensive.
- **DON'T** use heavy fonts. System font stack or a single lightweight web font max.
