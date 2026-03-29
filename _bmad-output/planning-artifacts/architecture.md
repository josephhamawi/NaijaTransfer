---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
workflowType: architecture
project_name: NigeriaTransfer
date: '2026-03-28'
status: complete
completedAt: '2026-03-28'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-transfer.md
  - _bmad-output/planning-artifacts/product-brief-transfer-distillate.md
  - prompt.md
classification:
  projectType: web_app
  domain: fintech
  complexity: high
  projectContext: greenfield
---

# Technical Architecture Document — NigeriaTransfer

**Author:** Mac
**Date:** 2026-03-28
**Classification:** Web App (PWA + Public API) | Fintech / File Infrastructure | High Complexity | Greenfield
**PRD Reference:** `_bmad-output/planning-artifacts/prd.md`

---

## 1. System Overview

NigeriaTransfer is a full-stack file transfer platform comprising a Progressive Web App (PWA), REST API backend, public developer API, and asynchronous job processing layer. The system is designed for resilience on unreliable networks, near-zero infrastructure cost at launch, and clean separation between compute (Oracle Cloud) and storage (Cloudflare R2).

### 1.1 Architecture Diagram

```
                        ┌─────────────────────────────────────────────────┐
                        │            Cloudflare (Free Tier)               │
                        │                                                 │
                        │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
                        │  │   DNS    │  │   CDN    │  │    DDoS      │  │
                        │  │ Mgmt     │  │  Static  │  │  Protection  │  │
                        │  └──────────┘  └──────────┘  └──────────────┘  │
                        └────────────────────┬────────────────────────────┘
                                             │
                              HTTPS (TLS 1.2+)
                                             │
                        ┌────────────────────▼────────────────────────────┐
                        │       Oracle Cloud ARM VM (Always-Free)         │
                        │       4 OCPU / 24 GB RAM / Ubuntu 22.04         │
                        │                                                 │
                        │  ┌───────────────────────────────────────────┐  │
                        │  │         Caddy (Reverse Proxy)             │  │
                        │  │   Auto-HTTPS · Rate Limiting · gzip/br   │  │
                        │  └──────────────────┬────────────────────────┘  │
                        │                     │                           │
                        │  ┌──────────────────▼────────────────────────┐  │
                        │  │         Next.js 14+ (App Router)          │  │
                        │  │                                           │  │
                        │  │  ┌─────────┐ ┌──────────┐ ┌───────────┐  │  │
                        │  │  │   SSR   │ │ API      │ │ tus       │  │  │
                        │  │  │  Pages  │ │ Routes   │ │ Upload    │  │  │
                        │  │  │         │ │ (REST)   │ │ Server    │  │  │
                        │  │  └─────────┘ └──────────┘ └───────────┘  │  │
                        │  │                                           │  │
                        │  │  ┌─────────────────────────────────────┐  │  │
                        │  │  │       Service Layer                 │  │  │
                        │  │  │  Transfer · Auth · Payment · File   │  │  │
                        │  │  └──────────────────┬──────────────────┘  │  │
                        │  │                     │                     │  │
                        │  │  ┌──────────────────▼──────────────────┐  │  │
                        │  │  │       Prisma ORM (Data Layer)       │  │  │
                        │  │  └──────────────────┬──────────────────┘  │  │
                        │  └─────────────────────┼─────────────────────┘  │
                        │                        │                        │
                        │  ┌─────────────────────▼─────────────────────┐  │
                        │  │        PostgreSQL 16 (Docker)             │  │
                        │  │   Connection Pool: max 20 connections     │  │
                        │  └───────────────────────────────────────────┘  │
                        │                                                 │
                        │  ┌───────────────────────────────────────────┐  │
                        │  │     Block Storage (200 GB)                │  │
                        │  │     /mnt/uploads/ (tus temp chunks)       │  │
                        │  └───────────────────────────────────────────┘  │
                        │                                                 │
                        │  ┌───────────────────────────────────────────┐  │
                        │  │     PM2 Process Manager                   │  │
                        │  │     Cron Jobs (node-cron or system cron)  │  │
                        │  └───────────────────────────────────────────┘  │
                        └──────────────────┬──────────────────────────────┘
                                           │
                              S3-compatible API
                                           │
                        ┌──────────────────▼──────────────────────────────┐
                        │            Cloudflare R2                        │
                        │                                                 │
                        │  ┌──────────────┐  ┌────────────────────────┐  │
                        │  │  File Bucket  │  │  Backup Bucket         │  │
                        │  │  (transfers)  │  │  (DB dumps, previews)  │  │
                        │  └──────────────┘  └────────────────────────┘  │
                        │                                                 │
                        │  Zero egress fees · AES-256 at rest             │
                        └─────────────────────────────────────────────────┘

  ┌────────────────────────────────────┐   ┌──────────────────────────────┐
  │  Oracle AMD Micro VM (Monitoring)  │   │  External Services           │
  │                                    │   │                              │
  │  ┌────────────┐  ┌─────────────┐   │   │  Paystack (Payments)         │
  │  │   Umami    │  │ Uptime Kuma │   │   │  Brevo (Transactional Email) │
  │  │ Analytics  │  │  Monitoring │   │   │  Google OAuth                │
  │  └────────────┘  └─────────────┘   │   │  Termii (Phone OTP)          │
  └────────────────────────────────────┘   │  Google AdSense (Ads)        │
                                           └──────────────────────────────┘
```

### 1.2 Core Design Principles

1. **Resilience-first.** Every flow assumes the network will drop. Uploads are resumable (tus). Downloads support Range requests. Sessions persist in localStorage. Lightweight mode is the default on mobile.
2. **Storage-compute decoupling.** Files live on Cloudflare R2, not Oracle block storage. Oracle VM is compute-only. If Oracle terminates the free account, files survive and migration is a DNS + VM rebuild.
3. **Zero-egress architecture.** File downloads are served directly from R2 (zero egress fees). Oracle egress is reserved for SSR HTML, API JSON responses, and tus chunk uploads to R2.
4. **Single-deployment simplicity.** One Next.js process serves SSR pages, API routes, tus middleware, and cron scheduling. No microservices, no message queues, no container orchestration at launch.
5. **Progressive enhancement.** Download pages render critical content server-side. The core download link works without JavaScript. PWA features (service worker, offline queue) enhance but do not gate functionality.

---

## 2. Tech Stack Decisions

### 2.1 Complete Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Runtime** | Node.js | 20 LTS | Async I/O ideal for concurrent upload/download streams. ARM64 binary available for Oracle Ampere. |
| **Framework** | Next.js (App Router) | 14+ | SSR for SEO, API routes for backend, React for interactive upload UX, single deployment artifact. Hybrid rendering matches the need for SSR download pages + client-side upload interactivity. |
| **Language** | TypeScript | 5.x | Type safety across full stack. Prisma generates typed client. Catches API contract mismatches at build time. |
| **Database** | PostgreSQL | 16 (Docker) | ACID compliance for payment records. JSON columns for flexible metadata. Proven at scale. Free. Docker isolates from OS. |
| **ORM** | Prisma | 5.x | Type-safe queries, declarative schema, migration management, introspection. Generates TypeScript client from schema. |
| **Upload Protocol** | tus | @tus/server 1.x | Battle-tested resumable upload protocol. Open source. 5MB chunk size balances progress granularity vs overhead on Nigerian 3G. |
| **CSS** | Tailwind CSS | 4.x | Utility-first for rapid mobile-first development. Purges unused CSS for small bundles. No runtime overhead. |
| **UI Components** | shadcn/ui | latest | Copy-paste components built on Radix UI primitives. Accessible (WCAG AA). Customizable without library lock-in. |
| **Auth** | NextAuth.js (Auth.js v5) | 5.x | Email magic link, Google OAuth, credential (phone OTP) providers. Session management via JWT or database sessions. |
| **Payments** | Paystack | REST API v2 | Nigerian market leader. Naira-native. Card, bank transfer, USSD, mobile money. Webhook-driven subscription management. |
| **Email** | Brevo (Sendinblue) | REST API v3 | 300 free emails/day (borderline at 57 transfers/day). Paid tier ~$9/month for 5,000/month. SPF/DKIM/DMARC support. |
| **Reverse Proxy** | Caddy | 2.x | Automatic HTTPS via Let's Encrypt. Simple Caddyfile config. Built-in rate limiting. HTTP/2 and HTTP/3. |
| **Process Manager** | PM2 | 5.x | Process supervision, auto-restart on crash, log management, cluster mode for CPU utilization. |
| **Analytics** | Umami | 2.x (Docker) | Self-hosted, privacy-friendly, no cookie banner needed. Tracks page views, referrers, countries. Runs on separate micro VM. |
| **Monitoring** | Uptime Kuma | 1.x (Docker) | Self-hosted uptime monitoring. HTTP/TCP checks every 60 seconds. Alerts via Telegram/email. Runs on separate micro VM. |
| **File Storage** | Cloudflare R2 | S3-compatible API | Zero egress fees (critical for file downloads). AES-256 encryption at rest. Signed URL generation. 10GB free storage + $0.015/GB. |
| **CDN** | Cloudflare | Free tier | DNS management, static asset caching, DDoS protection. File downloads bypass CDN (require auth via signed R2 URLs). |
| **Ads** | Google AdSense | - | Non-intrusive banners on free-tier download pages only. Fallback to empty space (no broken layout). |
| **Short Codes** | nanoid | 5.x | Cryptographically random, URL-safe, 10-character codes. 21 characters for API keys. |
| **Validation** | Zod | 3.x | Runtime schema validation for API inputs. Integrates with TypeScript types. Used in API routes and form validation. |
| **QR Codes** | qrcode (npm) | - | Server-side QR code generation as SVG/PNG for transfer links. |

### 2.2 Key Technology Decisions

**Why Next.js 14+ over alternatives:**
- Astro with React islands was considered (lighter JS) but rejected because the upload flow requires sustained client-side interactivity (tus progress, pause/resume, file previews) that would fight against Astro's island model.
- Remix was considered but Next.js has a larger ecosystem, better Oracle ARM support, and the team's existing familiarity.
- The App Router provides React Server Components for lightweight SSR pages (download, SEO landing) while allowing client components for the upload widget.

**Why PostgreSQL over SQLite:**
- SQLite was considered for simplicity but rejected because: (a) concurrent write contention from simultaneous uploads + webhook processing + cron jobs would cause lock contention; (b) Paystack payment records require ACID transactions; (c) PostgreSQL supports read replicas for future scaling; (d) pg_dump to R2 provides reliable backup pipeline.

**Why Caddy over Nginx:**
- Automatic HTTPS certificate management (no certbot cron). Simpler configuration for the single-origin reverse proxy use case. Built-in rate limiting module. Modern HTTP/3 support.

**Why tus over presigned R2 uploads:**
- Direct-to-R2 presigned uploads would save Oracle bandwidth but do not support resumable chunked upload with progress tracking. tus provides pause/resume, chunk-level progress, and session persistence -- critical for Nigerian network conditions. The trade-off is that files transit through Oracle block storage temporarily before moving to R2.

---

## 3. Component Architecture

### 3.1 Frontend Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth required)
│   │   ├── page.tsx              # Homepage / Upload page
│   │   ├── d/[code]/page.tsx     # Download page (SSR)
│   │   ├── request/[code]/       # File request upload page
│   │   ├── pricing/page.tsx      # Pricing page (SSR)
│   │   ├── about/page.tsx        # About page (SSR)
│   │   ├── privacy/page.tsx      # Privacy policy (SSR)
│   │   ├── terms/page.tsx        # Terms of service (SSR)
│   │   ├── contact/page.tsx      # Contact page (SSR)
│   │   ├── artists/page.tsx      # Artist gallery (SSR)
│   │   └── send-large-files-nigeria/page.tsx  # SEO landing
│   ├── (auth)/                   # Auth routes
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Authenticated routes
│   │   ├── dashboard/page.tsx    # User dashboard
│   │   ├── dashboard/transfers/
│   │   ├── dashboard/requests/
│   │   ├── dashboard/subscription/
│   │   ├── dashboard/api-keys/
│   │   └── dashboard/analytics/
│   ├── api/                      # API routes (backend)
│   │   ├── upload/               # tus upload endpoints
│   │   ├── transfer/             # Transfer CRUD + download
│   │   ├── request/              # File request endpoints
│   │   ├── user/                 # Authenticated user endpoints
│   │   ├── webhooks/             # Paystack webhooks
│   │   ├── v1/                   # Public API (versioned)
│   │   └── cron/                 # Internal cron trigger endpoints
│   ├── docs/
│   │   └── api/page.tsx          # API documentation page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles (Tailwind)
│   └── not-found.tsx             # Custom 404
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── upload/                   # Upload widget components
│   │   ├── UploadZone.tsx        # Drag-and-drop file selection
│   │   ├── ProgressBar.tsx       # Per-file + overall progress
│   │   ├── TransferSettings.tsx  # Expiry, password, limits
│   │   ├── BandwidthEstimator.tsx
│   │   └── ShareCard.tsx         # Post-upload sharing UI
│   ├── download/                 # Download page components
│   │   ├── DownloadCard.tsx      # File list + download buttons
│   │   ├── FilePreview.tsx       # Image/video/PDF previews
│   │   ├── PasswordGate.tsx      # Password verification form
│   │   └── AdBanner.tsx          # Free-tier ad placement
│   ├── layout/                   # Layout components
│   │   ├── BackgroundWallpaper.tsx
│   │   ├── LightweightToggle.tsx
│   │   ├── DarkModeToggle.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── dashboard/                # Dashboard components
│   └── shared/                   # Cross-cutting components
│       ├── QRCode.tsx
│       └── PricingTable.tsx
├── lib/                          # Core libraries
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth configuration
│   ├── r2.ts                     # R2 client (S3 SDK)
│   ├── paystack.ts               # Paystack API client
│   ├── email.ts                  # Brevo email client
│   ├── tus.ts                    # tus server configuration
│   ├── utils.ts                  # Shared utilities
│   ├── nanoid.ts                 # Short code generation
│   ├── tier-limits.ts            # Tier enforcement logic
│   └── constants.ts              # App-wide constants
├── services/                     # Business logic layer
│   ├── transfer.service.ts       # Transfer CRUD + lifecycle
│   ├── file.service.ts           # File storage + R2 operations
│   ├── auth.service.ts           # Auth + user management
│   ├── payment.service.ts        # Paystack subscription mgmt
│   ├── notification.service.ts   # Email + notification dispatch
│   ├── cleanup.service.ts        # Expired transfer cleanup
│   ├── storage-monitor.service.ts # Storage utilization tracking
│   ├── analytics.service.ts      # Custom metrics + reporting
│   └── api-key.service.ts        # Public API key management
├── types/                        # TypeScript type definitions
│   ├── transfer.ts
│   ├── user.ts
│   ├── api.ts
│   └── payment.ts
├── hooks/                        # React hooks
│   ├── useUpload.ts              # tus upload hook
│   ├── useBandwidth.ts           # Bandwidth estimation
│   ├── useLightweightMode.ts     # Lightweight mode state
│   └── useDarkMode.ts            # Dark mode state
└── middleware.ts                  # Next.js middleware (auth, rate limit)
```

**State management:** React Context for global state (auth, lightweight mode, dark mode). No Redux or Zustand -- the application state is simple enough that Context + server state (via fetch) is sufficient. Upload state is managed locally in the upload widget component tree via the tus client.

**Code splitting strategy:** Next.js App Router automatically code-splits per route. The upload widget (heaviest component: tus client + file preview + progress UI) only loads on the homepage. Download pages are SSR-heavy with minimal client JS. AdSense script is lazy-loaded. Umami analytics script uses `defer`.

**Target bundle:** <200KB initial JS on homepage. Download page target: <80KB client JS (most content is server-rendered).

### 3.2 Backend Architecture

The backend is organized as a layered architecture within Next.js API routes:

```
API Route → Middleware (auth, rate limit, validation) → Service Layer → Data Layer (Prisma) → PostgreSQL
                                                          ↓
                                                     R2 Client → Cloudflare R2
                                                     Email Client → Brevo
                                                     Payment Client → Paystack
```

**Service layer pattern:** Each service encapsulates a domain (transfers, files, payments, notifications). API routes are thin controllers that validate input (Zod), call service methods, and format responses. Services contain business logic. Prisma handles data access.

**Error handling pattern:** All API routes use a consistent try/catch wrapper. Errors are categorized:
- `ValidationError` (400) — invalid input, Zod parse failures
- `AuthenticationError` (401) — missing or invalid auth
- `ForbiddenError` (403) — insufficient tier, rate limited
- `NotFoundError` (404) — transfer/file not found
- `ConflictError` (409) — duplicate, limit exceeded
- `ServerError` (500) — unexpected errors, logged but not exposed

### 3.3 Storage Architecture

```
Upload Flow:
  Browser ──tus chunks──▶ Oracle Block Storage (/mnt/uploads/{uploadId}/)
                                    │
                          On upload complete:
                                    │
                                    ▼
                          Assemble chunks → Stream to R2
                                    │
                                    ▼
                          R2 Bucket: transfers/{transferId}/{fileId}/{filename}
                                    │
                          Delete local chunks from /mnt/uploads/

Download Flow:
  Browser ◀──signed R2 URL──  API validates expiry + limits + password
                                    │
                          Generate presigned R2 GET URL (5-minute expiry)
                                    │
                          Redirect browser to R2 URL
                                    │
                          R2 serves file directly (zero Oracle egress)
```

**Block storage usage (/mnt/uploads/):** Temporary only. Holds tus upload chunks during active uploads. Cleaned immediately after R2 transfer completes. Also cleaned by hourly cron for orphaned chunks (uploads that were abandoned). Target: block storage utilization stays below 50% at all times during normal operation.

**R2 bucket structure:**
```
nigeriatransfer-files/
├── transfers/{transferId}/{fileId}/{sanitized_filename}
├── previews/{transferId}/{fileId}/thumb.webp
├── previews/{transferId}/{fileId}/poster.webp
└── previews/{transferId}/{fileId}/pdf-first.webp

nigeriatransfer-backups/
├── db/{date}/nigeriatransfer.sql.gz
└── db/{date}/nigeriatransfer.sql.gz.sha256
```

### 3.4 CDN Architecture

Cloudflare CDN is used selectively:

| Asset Type | CDN Cached? | Cache TTL | Rationale |
|------------|-------------|-----------|-----------|
| Static JS/CSS/images | Yes | 1 year (immutable hashes) | Next.js generates hashed filenames |
| Wallpaper background images | Yes | 24 hours | Rotated daily, large images benefit from edge cache |
| SSR HTML pages | No | - | Dynamic content, user-specific |
| API responses | No | - | Dynamic, auth-dependent |
| File downloads | No | - | Served from R2 with signed URLs, bypass CDN |
| Fonts (system stack) | N/A | - | No web fonts to cache |

---

## 4. Data Model / Database Schema

### 4.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users     │────<│    transfers     │────<│     files        │
│              │     │                  │     │                  │
│ id (PK)      │     │ id (PK)          │     │ id (PK)          │
│ email        │     │ short_code (UQ)  │     │ transfer_id (FK) │
│ phone        │     │ user_id (FK,null)│     │ filename         │
│ name         │     │ type (enum)      │     │ original_name    │
│ tier (enum)  │     │ status (enum)    │     │ size             │
│ ...          │     │ ...              │     │ mime_type        │
└──────┬───────┘     └────────┬─────────┘     │ r2_key           │
       │                      │               │ preview_r2_key   │
       │                      │               └──────────────────┘
       │                      │
       │             ┌────────▼─────────┐
       │             │  download_logs   │
       │             │                  │
       │             │ id (PK)          │
       │             │ transfer_id (FK) │
       │             │ file_id (FK,null)│
       │             │ ip_hash          │
       │             │ user_agent       │
       │             │ country          │
       │             │ downloaded_at    │
       │             └──────────────────┘
       │
       ├────<┌──────────────────┐     ┌────────────────────────┐
       │     │    payments      │     │   file_requests        │
       │     │                  │     │                        │
       │     │ id (PK)          │     │ id (PK)                │
       │     │ user_id (FK)     │     │ user_id (FK)           │
       │     │ type (enum)      │     │ short_code (UQ)        │
       │     │ amount           │     │ title                  │
       │     │ currency         │     │ message                │
       │     │ status (enum)    │     │ status (enum)          │
       │     │ paystack_ref     │     │ created_at             │
       │     │ ...              │     │ ...                    │
       │     └──────────────────┘     └──────────┬─────────────┘
       │                                         │
       │                              ┌──────────▼─────────────┐
       │                              │ file_request_uploads   │
       │                              │                        │
       │                              │ id (PK)                │
       │                              │ request_id (FK)        │
       │                              │ uploader_name          │
       │                              │ uploader_email         │
       │                              │ transfer_id (FK)       │
       │                              │ uploaded_at            │
       │                              └────────────────────────┘
       │
       │     ┌──────────────────┐     ┌──────────────────┐
       │     │   api_keys       │     │   wallpapers     │
       │     │                  │     │                  │
       │     │ id (PK)          │     │ id (PK)          │
       │     │ user_id (FK)     │     │ image_path       │
       │     │ key_hash (UQ)    │     │ artist_name      │
       │     │ prefix           │     │ artist_url       │
       │     │ name             │     │ active           │
       │     │ tier (enum)      │     │ display_order    │
       │     │ rate_limit       │     └──────────────────┘
       │     │ last_used_at     │
       │     │ created_at       │
       │     └──────────────────┘
       │
       └────<┌──────────────────┐
             │  webhook_events  │
             │                  │
             │ id (PK)          │
             │ provider         │
             │ event_type       │
             │ payload (JSON)   │
             │ processed        │
             │ created_at       │
             └──────────────────┘
```

### 4.2 Prisma Schema (Complete)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ──────────────────────────────────────────────

enum UserTier {
  FREE
  PRO
  BUSINESS
}

enum TransferType {
  LINK       // Generate shareable link
  EMAIL      // Send to recipient emails
}

enum TransferStatus {
  UPLOADING  // tus upload in progress
  PROCESSING // Transferring chunks to R2
  ACTIVE     // Available for download
  EXPIRED    // Past expiry date
  DELETED    // Manually deleted by user
}

enum PaymentType {
  SUBSCRIPTION
  ONE_TIME
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum FileRequestStatus {
  OPEN
  CLOSED
}

enum ApiKeyTier {
  FREE
  PRO
  BUSINESS
}

// ─── MODELS ─────────────────────────────────────────────

model User {
  id                String    @id @default(cuid())
  email             String?   @unique
  emailVerified     DateTime?
  phone             String?   @unique
  phoneVerified     DateTime?
  name              String?
  image             String?
  tier              UserTier  @default(FREE)
  planStartDate     DateTime?
  planEndDate       DateTime?
  paystackCustomerId String?  @unique
  paystackSubCode    String?
  storageUsedBytes  BigInt    @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  transfers         Transfer[]
  payments          Payment[]
  fileRequests      FileRequest[]
  apiKeys           ApiKey[]
  accounts          Account[]   // NextAuth OAuth accounts
  sessions          Session[]   // NextAuth sessions

  @@index([email])
  @@index([phone])
  @@index([paystackCustomerId])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Transfer {
  id              String         @id @default(cuid())
  shortCode       String         @unique
  userId          String?
  type            TransferType   @default(LINK)
  status          TransferStatus @default(UPLOADING)
  title           String?
  message         String?
  senderEmail     String?
  recipientEmails String[]       // Array of recipient emails
  passwordHash    String?        // bcrypt hash, null if no password
  expiresAt       DateTime
  downloadLimit   Int            @default(50)
  downloadCount   Int            @default(0)
  totalSizeBytes  BigInt         @default(0)
  tier            UserTier       @default(FREE)
  showAds         Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  files           File[]
  downloadLogs    DownloadLog[]

  @@index([shortCode])
  @@index([userId])
  @@index([status, expiresAt])   // For cleanup cron queries
  @@index([createdAt])
  @@map("transfers")
}

model File {
  id               String   @id @default(cuid())
  transferId       String
  filename         String   // Sanitized filename
  originalName     String   // Original user filename
  sizeBytes        BigInt
  mimeType         String
  r2Key            String   // R2 object key: transfers/{transferId}/{fileId}/{filename}
  r2PreviewKey     String?  // R2 key for preview thumbnail
  previewGenerated Boolean  @default(false)
  checksum         String?  // SHA-256 hash for integrity verification
  createdAt        DateTime @default(now())

  transfer         Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  downloadLogs     DownloadLog[]

  @@index([transferId])
  @@map("files")
}

model DownloadLog {
  id           String   @id @default(cuid())
  transferId   String
  fileId       String?  // null for ZIP downloads (all files)
  ipHash       String   // SHA-256 hash of IP (NDPA compliance, no raw IPs)
  userAgent    String?
  country      String?  // GeoIP lookup from Cloudflare CF-IPCountry header
  downloadedAt DateTime @default(now())

  transfer     Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  file         File?    @relation(fields: [fileId], references: [id], onDelete: SetNull)

  @@index([transferId])
  @@index([downloadedAt])         // For log retention cleanup
  @@index([ipHash, transferId])   // For rate limit lookups
  @@map("download_logs")
}

model Payment {
  id             String        @id @default(cuid())
  userId         String
  type           PaymentType
  amount         Int           // Amount in kobo (NGN smallest unit)
  currency       String        @default("NGN")
  paystackRef    String        @unique  // Paystack transaction reference
  paystackSubCode String?      // Subscription code (for recurring)
  status         PaymentStatus @default(PENDING)
  metadata       Json?         // Additional Paystack response data
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([paystackRef])
  @@index([status])
  @@map("payments")
}

model FileRequest {
  id          String            @id @default(cuid())
  userId      String
  shortCode   String            @unique
  title       String
  message     String?
  status      FileRequestStatus @default(OPEN)
  maxUploads  Int?              // Optional limit on number of submissions
  expiresAt   DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  uploads     FileRequestUpload[]

  @@index([shortCode])
  @@index([userId])
  @@map("file_requests")
}

model FileRequestUpload {
  id            String   @id @default(cuid())
  requestId     String
  uploaderName  String?
  uploaderEmail String?
  transferId    String   // Links to the Transfer created for these files
  uploadedAt    DateTime @default(now())

  request       FileRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)

  @@index([requestId])
  @@map("file_request_uploads")
}

model ApiKey {
  id          String     @id @default(cuid())
  userId      String
  keyHash     String     @unique  // SHA-256 hash of the API key (never store plaintext)
  keyPrefix   String               // First 8 chars for identification: "nt_live_..."
  name        String               // User-given name for the key
  tier        ApiKeyTier @default(FREE)
  rateLimit   Int        @default(100)  // Requests per hour
  lastUsedAt  DateTime?
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([keyHash])
  @@index([userId])
  @@map("api_keys")
}

model Wallpaper {
  id           String  @id @default(cuid())
  imagePath    String  // Path or R2 key for the image
  imageUrl     String? // CDN URL for the image
  artistName   String
  artistUrl    String? // Link to artist's portfolio/social
  description  String?
  active       Boolean @default(true)
  displayOrder Int     @default(0)

  @@index([active, displayOrder])
  @@map("wallpapers")
}

model WebhookEvent {
  id         String   @id @default(cuid())
  provider   String   // "paystack"
  eventType  String   // "charge.success", "subscription.create", etc.
  payload    Json     // Full webhook payload for audit trail
  processed  Boolean  @default(false)
  error      String?  // Error message if processing failed
  createdAt  DateTime @default(now())

  @@index([provider, eventType])
  @@index([processed])
  @@map("webhook_events")
}
```

### 4.3 Key Schema Design Decisions

1. **IP hashing in download_logs:** Raw IPs are never stored. SHA-256 hash satisfies NDPA audit requirements while protecting user privacy. Country is derived from Cloudflare's `CF-IPCountry` header at request time.

2. **BigInt for file sizes:** JavaScript `Number` loses precision above 2^53. Files can be up to 50GB (53,687,091,200 bytes). BigInt ensures accuracy.

3. **API key hashing:** API keys are hashed with SHA-256 before storage. Only the prefix (`nt_live_XXXXXXXX`) is stored in plaintext for identification. The full key is shown to the user exactly once at creation.

4. **Webhook event log:** All Paystack webhooks are stored raw in `webhook_events` before processing. This provides an audit trail and enables replay of failed webhook processing.

5. **Cascade deletes:** Files cascade-delete with their Transfer. Download logs cascade-delete with their Transfer. This ensures the hourly cleanup cron can delete a Transfer and all associated data in one operation.

6. **Transfer-FileRequestUpload linking:** Each file request submission creates a standard Transfer. The `file_request_uploads` table links the submission metadata (uploader info) to the transfer. This reuses the entire transfer/file/download infrastructure.

7. **Index strategy:** Composite index on `(status, expiresAt)` for the cleanup cron query (`WHERE status = 'ACTIVE' AND expiresAt < NOW()`). Index on `(ipHash, transferId)` for password rate limiting lookups.

---

## 5. API Design

### 5.1 Public Endpoints (No Auth Required)

All API responses follow a consistent envelope:

```typescript
// Success response
{ "data": T, "meta"?: { pagination?, timing? } }

// Error response
{ "error": { "code": string, "message": string, "details"?: any } }
```

#### Transfer & Upload

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/upload/create` | Initialize transfer, returns transfer ID + tus upload URLs | 10/hr per IP (anon), 50/hr (auth) |
| `POST` | `/api/upload/files/*` | tus upload endpoint (handled by @tus/server middleware) | Per transfer |
| `GET` | `/api/transfer/{code}` | Get transfer metadata for download page | 100/hr per IP |
| `POST` | `/api/transfer/{code}/verify-password` | Verify download password | 5/min per transfer per IP |
| `GET` | `/api/transfer/{code}/download/{fileId}` | Get signed R2 download URL (redirect) | 100/hr per IP |
| `GET` | `/api/transfer/{code}/download-all` | Stream ZIP of all files | 100/hr per IP |
| `GET` | `/api/transfer/{code}/preview/{fileId}` | Get file preview (thumbnail/poster) | 200/hr per IP |

#### File Requests (Public)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `GET` | `/api/request/{code}` | Get file request details | 100/hr per IP |
| `POST` | `/api/request/{code}/upload` | Upload files to a request (creates transfer) | 10/hr per IP |

### 5.2 Authenticated Endpoints

All authenticated endpoints require a valid session cookie (web) or `Authorization: Bearer <API_KEY>` header (API).

#### User Transfers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/transfers` | List user's transfers (paginated) |
| `DELETE` | `/api/user/transfers/{id}` | Delete a transfer (cascades files + R2 objects) |
| `PATCH` | `/api/user/transfers/{id}` | Update transfer settings (extend expiry, change limits) |

#### User Account

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/storage` | Get storage usage (bytes used, tier limit) |
| `GET` | `/api/user/subscription` | Get subscription status + billing history |
| `POST` | `/api/user/subscription/create` | Initialize Paystack subscription checkout |
| `POST` | `/api/user/subscription/cancel` | Cancel active subscription |

#### File Requests (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/user/requests/create` | Create a file request portal |
| `GET` | `/api/user/requests` | List user's file requests |
| `PATCH` | `/api/user/requests/{id}` | Close a file request |
| `GET` | `/api/user/requests/{id}/files` | List files uploaded to a request |

#### API Key Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/user/api-keys` | Create a new API key |
| `GET` | `/api/user/api-keys` | List API keys (prefix only) |
| `DELETE` | `/api/user/api-keys/{id}` | Revoke an API key |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/analytics/{transferId}` | Download stats for a specific transfer |
| `GET` | `/api/user/analytics/summary` | Overall account analytics |

### 5.3 Public Developer API (Versioned)

The public API mirrors core functionality for external developers. Authenticated via API key.

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| `POST` | `/api/v1/transfers` | Create transfer programmatically | Per API key tier |
| `GET` | `/api/v1/transfers/{id}` | Get transfer status + metadata | Per API key tier |
| `DELETE` | `/api/v1/transfers/{id}` | Delete a transfer | Per API key tier |
| `GET` | `/api/v1/transfers/{id}/files` | List files in a transfer | Per API key tier |
| `POST` | `/api/v1/webhooks` | Register webhook URL for events | Per API key tier |
| `GET` | `/api/v1/usage` | Get API usage stats | Per API key tier |

**API key rate limits by tier:**
- Free: 100 requests/hour, 10 transfers/day, 4GB max per transfer
- Pro: 500 requests/hour, 100 transfers/day, 10GB max per transfer
- Business: 2,000 requests/hour, 500 transfers/day, 50GB max per transfer

### 5.4 Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/paystack` | Handle Paystack events (signature verified via HMAC) |

**Paystack webhook events handled:**
- `charge.success` — Payment completed, activate subscription
- `subscription.create` — New subscription created
- `subscription.not_renew` — Subscription cancelled by user
- `subscription.disable` — Subscription deactivated (failed payment)
- `invoice.payment_failed` — Recurring payment failed, send notification

**Developer webhook callbacks (outbound):** When API consumers register webhooks, the system sends POST requests to their URLs on:
- `transfer.complete` — Upload finished, files available
- `transfer.downloaded` — File was downloaded
- `transfer.expired` — Transfer reached expiry

### 5.5 Internal Cron Endpoints

These endpoints are triggered by system cron (or node-cron within PM2) and protected by an internal secret header.

| Schedule | Endpoint/Job | Description |
|----------|-------------|-------------|
| Hourly | `cleanup-expired` | Delete expired transfers + R2 objects + local chunks |
| Hourly | `cleanup-orphaned-uploads` | Delete tus chunks for abandoned uploads (>24h old) |
| Daily (03:00) | `backup-database` | pg_dump compressed to R2 backup bucket |
| Daily (06:00) | `send-expiry-warnings` | Email users about transfers expiring in 24h |
| Daily (07:00) | `storage-report` | Log storage utilization metrics |
| Daily (08:00) | `egress-report` | Track Oracle + R2 bandwidth against limits |

---

## 6. File Upload Flow

### 6.1 Complete Upload Sequence

```
1. USER INITIATES UPLOAD
   Browser: User selects files via UploadZone component
   │
   ├── Client validates: file count, individual file size vs tier limit
   ├── Client runs bandwidth estimation (small test upload to /api/upload/probe)
   ├── Client displays: estimated time, file list, total size
   │
   ▼
2. CREATE TRANSFER
   POST /api/upload/create
   Body: { files: [{name, size, type}], settings: {expiry, password, ...} }
   │
   ├── Server validates: tier limits, storage capacity (<85% threshold)
   ├── Server creates Transfer record (status: UPLOADING)
   ├── Server creates File records (placeholder, no r2Key yet)
   ├── Server generates tus upload URLs for each file
   ├── Server returns: { transferId, files: [{fileId, tusUploadUrl}] }
   │
   ▼
3. TUS CHUNKED UPLOAD (per file, parallel up to 2 concurrent)
   POST /api/upload/files/{fileId}
   │
   ├── tus server receives 5MB chunks sequentially
   ├── Chunks written to /mnt/uploads/{uploadId}/ (Oracle block storage)
   ├── Client tracks progress: per-file %, overall %, speed, ETA
   ├── On network drop: client auto-retries current chunk (tus PATCH)
   ├── On manual pause: client stops sending chunks, session preserved
   ├── On resume: client sends HEAD to get offset, continues from there
   ├── Upload state persisted in localStorage (survives page refresh/crash)
   │
   ▼
4. FILE COMPLETION (per file)
   tus server fires "upload complete" event
   │
   ├── Server assembles chunks into single file (if needed)
   ├── Server computes SHA-256 checksum
   ├── Server streams file to Cloudflare R2:
   │     PUT transfers/{transferId}/{fileId}/{sanitized_filename}
   ├── Server generates preview (async, non-blocking):
   │     - Images: sharp → 400px WebP thumbnail → R2
   │     - Videos: ffmpeg (if available) → poster frame → R2
   │     - PDFs: pdf-lib → first page render → R2
   ├── Server updates File record: r2Key, checksum, previewGenerated
   ├── Server deletes local chunks from /mnt/uploads/
   │
   ▼
5. TRANSFER ACTIVATION
   When all files complete:
   │
   ├── Server updates Transfer status: UPLOADING → ACTIVE
   ├── Server generates short code (nanoid, 10 chars)
   ├── Server computes total size, updates Transfer.totalSizeBytes
   ├── Server updates user's storageUsedBytes (if authenticated)
   ├── If email transfer: send notification emails to recipients
   ├── Server returns: { shortCode, downloadUrl, qrCodeSvg }
   │
   ▼
6. SHARE
   Client displays ShareCard: link, QR code, WhatsApp/SMS/email buttons
```

### 6.2 Upload Resilience Mechanisms

| Failure Scenario | Recovery Mechanism | PRD Requirement |
|-----------------|-------------------|-----------------|
| Network drop during chunk | tus client auto-retries with exponential backoff | FR5, FR6 |
| Browser crash mid-upload | tus upload URL + offset stored in localStorage; resume on reopen | FR6 |
| Page refresh | Same as browser crash — localStorage persistence | FR6 |
| Oracle VM restart | tus chunks on block storage survive restart; client resumes via HEAD | FR6 |
| R2 transfer failure | Retry with exponential backoff (3 attempts); keep local chunks until success | NFR6 |
| Storage at 85% | Reject new upload creation with clear error message | FR19 |
| IOPS throttle | Queue uploads when concurrent count > 10; show "queued" state to user | NFR20 |

### 6.3 Upload Throttling

To respect Oracle free-tier IOPS limits (~3,000 baseline):

```
Concurrent upload tracking:
  - Global counter in Node.js process memory (or Redis if multi-process)
  - Increment on tus upload start, decrement on file completion
  - When counter >= 10: new uploads enter "queued" state
  - Queued uploads start automatically when slot opens
  - Client receives 429 with Retry-After header
```

---

## 7. File Download Flow

### 7.1 Complete Download Sequence

```
1. RECIPIENT OPENS LINK
   GET /d/{shortCode}  (Next.js SSR page)
   │
   ├── Server fetches Transfer by shortCode
   ├── If not found → 404 page
   ├── If expired → expired page with "Send your own files" CTA
   ├── If download limit reached → limit reached page
   ├── If password protected → render PasswordGate component
   │     (no file details visible until password verified)
   ├── Server renders download page with:
   │     - File list (names, sizes, types, preview thumbnails)
   │     - Sender message
   │     - Expiry countdown
   │     - Downloads remaining counter
   │     - Individual download buttons
   │     - "Download All" ZIP button
   │     - Ad banner (free tier only, paid tier: no ads)
   │
   ▼
2. PASSWORD VERIFICATION (if required)
   POST /api/transfer/{code}/verify-password
   Body: { password: "user_input" }
   │
   ├── Server: bcrypt.compare(input, transfer.passwordHash)
   ├── Rate limit: 5 attempts per minute per transfer per IP
   ├── On success: set httpOnly cookie for this transfer session
   ├── On failure: return error with remaining attempts
   │
   ▼
3. INDIVIDUAL FILE DOWNLOAD
   GET /api/transfer/{code}/download/{fileId}
   │
   ├── Server validates: transfer active, not expired, downloads remaining
   ├── Server validates: password session cookie (if password-protected)
   ├── Server generates presigned R2 GET URL (5-minute expiry)
   │     - URL includes Content-Disposition: attachment; filename="original_name"
   │     - R2 supports Range requests natively (resumable downloads)
   ├── Server increments Transfer.downloadCount
   ├── Server logs download in download_logs (ip_hash, user_agent, country)
   ├── Server sends email notification to sender (debounced, max 1/hour per transfer)
   ├── 302 Redirect to presigned R2 URL
   │
   ▼
4. FILE SERVED FROM R2
   Browser downloads directly from R2
   │
   ├── Zero Oracle egress cost
   ├── R2 handles Range requests for resumable downloads
   ├── Cloudflare edge delivers from nearest PoP
   │
   ▼
5. ZIP DOWNLOAD (all files)
   GET /api/transfer/{code}/download-all
   │
   ├── Server validates same as individual download
   ├── Server creates streaming ZIP (archiver npm package):
   │     - For each file: fetch from R2 and pipe into ZIP stream
   │     - ZIP streams to response as it builds (no buffering entire ZIP)
   │     - Content-Disposition: attachment; filename="{shortCode}-files.zip"
   ├── Server increments downloadCount by 1 (not per file)
   ├── Server logs download
   │
   NOTE: ZIP download does transit through Oracle VM (R2 → VM → browser)
   This uses Oracle egress. For very large transfers, individual downloads
   are preferred. Consider adding a warning for ZIP > 2GB.
```

### 7.2 Download Page SSR Strategy

The download page (`/d/{code}`) is server-side rendered for two critical reasons:

1. **No-JS download link (NFR25):** The download link must work without JavaScript. The server renders the R2 signed URL directly in an `<a href>` tag. Opera Mini extreme mode, users with JS disabled, and screen readers all get a working download.

2. **WhatsApp/social preview (SEO):** Open Graph meta tags render the transfer title, file count, and sender info. When shared on WhatsApp, the link preview shows meaningful content.

```html
<!-- Server-rendered, works without JS -->
<a href="/api/transfer/{code}/download/{fileId}"
   class="download-btn"
   download="{filename}">
  Download {filename} ({sizeFormatted})
</a>
```

---

## 8. Authentication Architecture

### 8.1 Auth Strategy Overview

Authentication is optional for the core product (anonymous transfers). Three providers serve different Nigerian user segments.

```
┌─────────────────────────────────────────────────────────┐
│                  NextAuth.js (Auth.js v5)                │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Email Magic │  │ Google      │  │ Phone + OTP     │ │
│  │ Link        │  │ OAuth 2.0   │  │ (Credential)    │ │
│  │             │  │             │  │                 │ │
│  │ Brevo sends │  │ Standard    │  │ Termii SMS API  │ │
│  │ link with   │  │ OAuth flow  │  │ sends 6-digit   │ │
│  │ token       │  │ via Google  │  │ OTP to phone    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────────┘ │
│         │                │                │             │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│                   Session (JWT)                         │
│           Stored in httpOnly secure cookie              │
│                                                         │
│  Session contains: userId, email, tier, name            │
│  Refreshed on each request via middleware               │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Provider Details

**Email Magic Link (Primary — FR27):**
- User enters email. Server generates token, stores in `verification_tokens`.
- Brevo sends email with `https://nigeriatransfer.com/api/auth/callback/email?token=xxx`.
- User clicks link. NextAuth verifies token, creates/updates User, sets session cookie.
- Token expires in 10 minutes. Single-use.

**Google OAuth (Secondary — FR28):**
- Standard OAuth 2.0 flow via NextAuth Google provider.
- Creates User with Google email. Links via `accounts` table.
- Primary for diaspora users familiar with Google sign-in.

**Phone + OTP (Credential Provider — FR29):**
- User enters Nigerian phone number (+234...).
- Server sends 6-digit OTP via Termii SMS API. OTP stored hashed with 5-minute expiry.
- User enters OTP. Server verifies. Creates/updates User. Sets session cookie.
- Critical for Nigerian market: many users prefer phone auth over email.

### 8.3 Session Management

- **Session type:** JWT (stateless, no DB lookup per request).
- **Storage:** httpOnly, secure, sameSite=lax cookie.
- **Expiry:** 30 days, sliding window (refreshed on activity).
- **Content:** Minimal: `{ userId, email, tier, name }`. No sensitive data in JWT payload.

### 8.4 API Key Authentication

For the public developer API (`/api/v1/*`):

```
Request: Authorization: Bearer nt_live_XXXXXXXXXXXXXXXXXXXXXXXX

Server:
1. Extract key from header
2. SHA-256 hash the key
3. Look up in api_keys table by keyHash
4. Verify isActive = true
5. Check rate limit (requests this hour < rateLimit)
6. Update lastUsedAt
7. Attach user context to request
```

API keys use the format `nt_live_{random_42_chars}` (total 50 chars). The prefix `nt_live_` allows easy identification in logs and user dashboards.

---

## 9. Infrastructure Architecture

### 9.1 Oracle Cloud ARM VM (Primary Compute)

| Resource | Specification | Usage |
|----------|--------------|-------|
| Shape | VM.Standard.A1.Flex (Ampere ARM) | Always-Free tier |
| OCPU | 4 | Next.js SSR, tus processing, file transfers to R2 |
| RAM | 24 GB | Next.js ~512MB, PostgreSQL ~2GB, PM2 overhead, OS ~1GB. Headroom: ~20GB |
| OS | Ubuntu 22.04 aarch64 | LTS, ARM64 native |
| Boot Volume | 50 GB | OS, Node.js, application code, Docker images |
| Block Volume | 200 GB mounted at /mnt | Temporary tus upload chunks. NOT for long-term file storage. |
| Egress | 10 TB/month | SSR HTML, API responses, tus chunks to R2. File downloads bypass Oracle (R2 direct). |
| IOPS | ~3,000 baseline | Limits concurrent uploads. Throttle at 10 concurrent. |

### 9.2 Oracle AMD Micro VM (Monitoring)

| Resource | Specification | Usage |
|----------|--------------|-------|
| Shape | VM.Standard.E2.1.Micro (AMD) | Always-Free tier |
| OCPU | 1 | Sufficient for Umami + Uptime Kuma |
| RAM | 1 GB | Tight but workable with Docker resource limits |
| OS | Ubuntu 22.04 x86_64 | Separate from ARM VM |
| Storage | 50 GB boot volume | Umami DB (SQLite or small PostgreSQL), Uptime Kuma DB |

**Services on monitoring VM:**
```yaml
# docker-compose.yml on monitoring VM
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://...
    restart: always

  uptime-kuma:
    image: louislam/uptime-kuma:1
    ports: ["3001:3001"]
    volumes: ["./data:/app/data"]
    restart: always
```

Caddy on the monitoring VM reverse proxies `analytics.nigeriatransfer.com` → Umami and `status.nigeriatransfer.com` → Uptime Kuma.

### 9.3 Cloudflare R2 (File Storage)

| Bucket | Purpose | Lifecycle Policy |
|--------|---------|-----------------|
| `nigeriatransfer-files` | Transfer files + preview thumbnails | Objects deleted by application on transfer cleanup |
| `nigeriatransfer-backups` | Daily PostgreSQL dumps | 30-day retention policy (auto-delete older backups) |

**R2 cost estimation:**
- Storage: 10 GB free, then $0.015/GB/month. At 500GB active files: ~$7.35/month.
- Class A operations (writes): 1M free, then $4.50/1M. At 10K uploads/month with 5MB chunks: ~40K operations = free tier.
- Class B operations (reads): 10M free, then $0.36/10M. Downloads well within free tier at launch.
- Egress: $0.00 always. This is the key cost advantage over S3/GCS.

### 9.4 Network Architecture

```
User (Nigeria/Diaspora)
    │
    ▼
Cloudflare DNS (nigeriatransfer.com)
    │
    ├── Static assets (*.js, *.css, images) → Cloudflare CDN edge cache
    │
    ├── HTML pages + API requests → Cloudflare proxy → Oracle ARM VM :443
    │     Caddy terminates TLS, reverse proxies to Next.js :3000
    │
    └── File downloads → Redirect to R2 presigned URL
          R2 serves from Cloudflare's global network
          (likely from Lagos, London, or Johannesburg PoP)
```

**DNS records:**
```
nigeriatransfer.com      A     <Oracle ARM VM public IP>  (proxied via Cloudflare)
analytics.nigeriatransfer.com  A  <Oracle AMD VM public IP>  (proxied)
status.nigeriatransfer.com     A  <Oracle AMD VM public IP>  (proxied)
```

---

## 10. Security Architecture

### 10.1 Transport Security

- **TLS 1.2+ everywhere (NFR7).** Caddy auto-provisions Let's Encrypt certificates. Cloudflare enforces minimum TLS 1.2 on its edge. HSTS header with 1-year max-age.
- **Cloudflare Full (Strict) SSL mode.** Origin (Caddy) has a valid certificate. No HTTP allowed; all requests redirected to HTTPS.

### 10.2 Rate Limiting

Rate limits are enforced at the Caddy level (IP-based) and application level (per user/API key).

| Endpoint Category | Limit | Scope | Implementation |
|-------------------|-------|-------|----------------|
| Upload creation (anonymous) | 10/hour | Per IP | Caddy rate_limit directive (NFR11) |
| Upload creation (authenticated) | 50/hour | Per user | Application middleware (NFR11) |
| Downloads | 100/hour | Per IP | Caddy rate_limit directive (NFR12) |
| Password attempts | 5/minute | Per transfer per IP | Application middleware (NFR10) |
| API requests (free key) | 100/hour | Per API key | Application middleware (FR54) |
| API requests (pro key) | 500/hour | Per API key | Application middleware (FR54) |
| API requests (business key) | 2,000/hour | Per API key | Application middleware (FR54) |
| General page requests | 300/minute | Per IP | Caddy rate_limit directive |

**Rate limit response:** HTTP 429 with `Retry-After` header and JSON error body.

### 10.3 Input Validation & Sanitization

- **File path sanitization (NFR13):** All filenames are sanitized via a strict allowlist: alphanumeric, hyphens, underscores, dots. Path separators (`/`, `\`, `..`) are stripped. Filenames are truncated to 255 characters. The sanitized filename is stored in `files.filename`; the original is stored in `files.originalName` for display.

- **Zod validation on all API inputs:** Every API route validates the request body/query with Zod schemas. Invalid input returns 400 with specific field errors.

- **Message/title length limits:** Transfer messages: max 500 characters. File request titles: max 200 characters. Prevents abuse and DB bloat.

- **Email validation:** Zod email schema + max 10 recipients per transfer (FR24).

### 10.4 Password Security

- **Transfer passwords (NFR9):** Hashed with bcrypt, minimum 10 rounds. Salt is auto-generated by bcrypt. No plaintext storage.
- **API keys:** SHA-256 hashed before storage. Prefix stored separately for identification.
- **No user passwords:** All auth is passwordless (magic link, OAuth, OTP). No password storage for user accounts.

### 10.5 Content Security Policy (NFR16)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://pagead2.googlesyndication.com https://analytics.nigeriatransfer.com 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.googleusercontent.com https://*.r2.cloudflarestorage.com;
  connect-src 'self' https://analytics.nigeriatransfer.com https://api.paystack.co;
  frame-src https://pagead2.googlesyndication.com;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### 10.6 CORS Policy

```typescript
// Next.js middleware
const ALLOWED_ORIGINS = [
  'https://nigeriatransfer.com',
  'https://www.nigeriatransfer.com',
];

// Public API v1 endpoints allow any origin (API consumers embed widgets)
// Internal API endpoints restrict to own domain only
```

### 10.7 Additional Security Measures

- **Short code generation (NFR14):** nanoid with 10 characters from URL-safe alphabet (A-Za-z0-9_-). ~64^10 = 1.15 quadrillion combinations. No sequential IDs exposed.
- **No direct file access (NFR15):** All file downloads go through `/api/transfer/{code}/download/{fileId}` which validates expiry, download limits, password, and tier.
- **Webhook signature verification:** Paystack webhooks verified via HMAC-SHA512 signature in `x-paystack-signature` header.
- **SQL injection prevention:** Prisma uses parameterized queries exclusively. No raw SQL.
- **XSS prevention:** React auto-escapes output. CSP restricts script sources. User-submitted content (messages, filenames) is escaped in all rendering contexts.

---

## 11. Deployment Architecture

### 11.1 CI/CD Pipeline

```
Developer pushes to main branch
         │
         ▼
┌─────────────────────────────────────┐
│       GitHub Actions Workflow       │
│                                     │
│  1. Checkout code                   │
│  2. Setup Node.js 20 (ARM runner   │
│     or cross-compile)              │
│  3. Install dependencies (npm ci)  │
│  4. Run linter (ESLint)            │
│  5. Run type check (tsc --noEmit)  │
│  6. Run tests (Vitest)             │
│  7. Build (next build)             │
│  8. If all pass → Deploy           │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        SSH Deploy to Oracle VM      │
│                                     │
│  1. SSH into Oracle ARM VM          │
│  2. cd /opt/nigeriatransfer         │
│  3. git pull origin main            │
│  4. npm ci --production             │
│  5. npx prisma migrate deploy       │
│  6. npm run build                   │
│  7. pm2 restart nigeriatransfer     │
│  8. Health check: curl localhost    │
│  9. If health check fails: rollback │
└─────────────────────────────────────┘
```

### 11.2 Rollback Strategy

```bash
# Rollback is a git revert + redeploy
git revert HEAD --no-edit
git push origin main
# GitHub Actions triggers redeploy automatically

# Emergency manual rollback:
ssh oracle-vm
cd /opt/nigeriatransfer
git checkout HEAD~1
npm ci --production
npx prisma migrate deploy
npm run build
pm2 restart nigeriatransfer
```

### 11.3 PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nigeriatransfer',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/opt/nigeriatransfer',
    instances: 2,           // 2 instances across 4 OCPUs
    exec_mode: 'cluster',   // Cluster mode for load balancing
    max_memory_restart: '4G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '/var/log/nigeriatransfer/error.log',
    out_file: '/var/log/nigeriatransfer/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
```

### 11.4 Caddy Configuration

```caddyfile
nigeriatransfer.com {
    # Rate limiting
    rate_limit {remote.ip} 300r/m

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
    }

    # Static assets: long cache
    @static path /_next/static/* /favicon.ico /robots.txt /sitemap.xml
    header @static Cache-Control "public, max-age=31536000, immutable"

    # Compression
    encode gzip zstd

    # Reverse proxy to Next.js
    reverse_proxy localhost:3000 {
        header_up X-Forwarded-For {remote_host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # tus upload: increase timeouts and body size
    @tus path /api/upload/files/*
    handle @tus {
        request_body {
            max_size 50GB
        }
        reverse_proxy localhost:3000 {
            transport http {
                read_timeout 30m
                write_timeout 30m
            }
        }
    }
}
```

### 11.5 Environment Configuration

```bash
# .env (NEVER committed to git)

# Database
DATABASE_URL="postgresql://nigeriatransfer:PASSWORD@localhost:5432/nigeriatransfer"

# NextAuth
NEXTAUTH_URL="https://nigeriatransfer.com"
NEXTAUTH_SECRET="cryptographically-random-32-bytes"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Paystack
PAYSTACK_SECRET_KEY="sk_live_xxx"
PAYSTACK_PUBLIC_KEY="pk_live_xxx"
PAYSTACK_WEBHOOK_SECRET="whsec_xxx"
PAYSTACK_PRO_PLAN_CODE="PLN_xxx"
PAYSTACK_BUSINESS_PLAN_CODE="PLN_xxx"

# Cloudflare R2
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="nigeriatransfer-files"
R2_BACKUP_BUCKET_NAME="nigeriatransfer-backups"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# Brevo (Email)
BREVO_API_KEY="xkeysib-xxx"
BREVO_SENDER_EMAIL="noreply@nigeriatransfer.com"
BREVO_SENDER_NAME="NigeriaTransfer"

# Termii (Phone OTP)
TERMII_API_KEY="xxx"
TERMII_SENDER_ID="NigeriaT"

# Application
CRON_SECRET="internal-cron-secret-key"
STORAGE_THRESHOLD_PERCENT=85
MAX_CONCURRENT_UPLOADS=10
TUS_UPLOAD_DIR="/mnt/uploads"

# Analytics
UMAMI_URL="https://analytics.nigeriatransfer.com"
UMAMI_WEBSITE_ID="xxx"
```

---

## 12. Monitoring and Observability

### 12.1 Uptime Kuma Monitors

| Monitor | Type | Interval | Alert Channel |
|---------|------|----------|---------------|
| Homepage | HTTP(S) GET / | 60s | Telegram + Email |
| API health | HTTP(S) GET /api/health | 60s | Telegram + Email |
| Download page (sample) | HTTP(S) GET /d/test-code | 5m | Telegram |
| PostgreSQL | TCP port 5432 | 60s | Telegram + Email |
| R2 connectivity | HTTP(S) HEAD on R2 object | 5m | Telegram |
| Oracle VM SSH | TCP port 22 | 5m | Email |
| Monitoring VM SSH | TCP port 22 | 5m | Email |

Target: >99.5% uptime (NFR26). Allows ~3.6 hours downtime/month.

### 12.2 Umami Analytics

Tracks (privacy-friendly, no cookies):
- Page views by URL
- Unique visitors by day/week/month
- Referrer sources (WhatsApp, direct, search, social)
- Country distribution (Nigeria vs diaspora)
- Device/browser breakdown (Chrome, Samsung Internet, Opera Mini, Safari)
- Custom events: upload_started, upload_completed, download_started, share_whatsapp, share_sms, upgrade_clicked

### 12.3 Custom Application Metrics

Stored in the database and computed by the daily `storage-report` cron job:

```typescript
interface DailyMetrics {
  date: string;
  uploadsStarted: number;
  uploadsCompleted: number;
  uploadCompletionRate: number;      // completed/started — key health metric
  totalBytesUploaded: bigint;
  totalBytesDownloaded: bigint;      // From R2 analytics API
  downloadsTotal: number;
  uniqueDownloaders: number;         // Distinct IP hashes
  activeTransfers: number;
  storageUsedBytes: bigint;
  storageUsedPercent: number;
  oracleEgressBytes: bigint;         // From Oracle metrics API
  r2StorageBytes: bigint;            // From R2 analytics
  newRegistrations: number;
  activeSubscriptions: number;
  mrrKobo: number;                   // Monthly recurring revenue in kobo
  newSubscriptions: number;
  cancelledSubscriptions: number;
  apiKeyCount: number;
  apiRequestsTotal: number;
}
```

### 12.4 PM2 Monitoring

```bash
# Process health
pm2 monit                    # Real-time CPU/memory
pm2 logs nigeriatransfer     # Application logs
pm2 status                   # Process status, uptime, restarts

# Log rotation (logrotate config)
/var/log/nigeriatransfer/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
}
```

### 12.5 Health Check Endpoint

```typescript
// /api/health — returns 200 if all systems operational
{
  "status": "ok",
  "timestamp": "2026-03-28T12:00:00Z",
  "checks": {
    "database": "ok",         // Prisma.$queryRaw`SELECT 1`
    "r2": "ok",               // HeadObject on test key
    "storage": {
      "usedPercent": 42,
      "status": "ok"          // "warning" at 75%, "critical" at 85%
    },
    "uptime": "3d 14h 22m"
  }
}
```

---

## 13. Disaster Recovery

### 13.1 Oracle Account Termination (Primary Risk)

Oracle's free tier has a history of unexpected account terminations. The architecture explicitly mitigates this:

| Component | Risk | Mitigation | Recovery Time |
|-----------|------|------------|---------------|
| Files | Lost with VM | Files stored on R2 (decoupled from Oracle) | Zero — files survive |
| Database | Lost with VM | Daily pg_dump to R2 backup bucket | < 30 minutes to restore |
| Application code | Lost with VM | All code in GitHub | < 5 minutes to clone |
| Configuration | Lost with VM | .env template in repo; secrets in password manager | < 10 minutes to recreate |
| TLS certificates | Lost with VM | Caddy auto-provisions new certs (2 minutes) | Automatic |
| DNS | Oracle IP changes | Update Cloudflare DNS A record | < 5 minutes |

**Total recovery time target: < 1 hour (tested runbook).**

### 13.2 Migration Runbook (Oracle → Hetzner)

Tested quarterly. Target: 1 hour from decision to live.

```
STEP 1 (5 min): Provision Hetzner CAX11 (ARM, 2 vCPU, 4GB RAM, €3.79/mo)
STEP 2 (10 min): Install stack: Node.js 20, Docker, Caddy, PM2
STEP 3 (5 min): Clone repo, npm ci, copy .env with updated DATABASE_URL
STEP 4 (10 min): Start PostgreSQL Docker, restore latest R2 backup:
    aws s3 cp s3://nigeriatransfer-backups/db/latest/nigeriatransfer.sql.gz - \
      | gunzip | psql -U nigeriatransfer
STEP 5 (5 min): Run prisma migrate deploy, build Next.js, start PM2
STEP 6 (5 min): Update Cloudflare DNS A record to Hetzner IP
STEP 7 (5 min): Verify: health check, test upload, test download
STEP 8 (5 min): Update monitoring VM to point Uptime Kuma at new IP
```

### 13.3 Database Backup Strategy

```bash
# Daily backup cron (03:00 WAT)
# Runs on Oracle ARM VM

#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/tmp/db-backup"
BUCKET="nigeriatransfer-backups"

mkdir -p $BACKUP_DIR

# Dump and compress
pg_dump -U nigeriatransfer -Fc nigeriatransfer | gzip > $BACKUP_DIR/nigeriatransfer.sql.gz

# Compute checksum
sha256sum $BACKUP_DIR/nigeriatransfer.sql.gz > $BACKUP_DIR/nigeriatransfer.sql.gz.sha256

# Upload to R2
aws s3 cp $BACKUP_DIR/nigeriatransfer.sql.gz s3://$BUCKET/db/$DATE/ --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
aws s3 cp $BACKUP_DIR/nigeriatransfer.sql.gz.sha256 s3://$BUCKET/db/$DATE/ --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com

# Also keep a "latest" copy for quick recovery
aws s3 cp $BACKUP_DIR/nigeriatransfer.sql.gz s3://$BUCKET/db/latest/ --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com

# Cleanup local
rm -rf $BACKUP_DIR

# Verify backup exists in R2
aws s3 ls s3://$BUCKET/db/$DATE/ --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com | grep nigeriatransfer.sql.gz
if [ $? -ne 0 ]; then
  # Send alert via webhook
  curl -X POST "$ALERT_WEBHOOK_URL" -d '{"text":"DB backup FAILED for '$DATE'"}'
fi
```

**Retention:** R2 lifecycle rule deletes backups older than 30 days from the backup bucket.

### 13.4 Data Loss Scenarios

| Scenario | Data at Risk | Protection | RPO |
|----------|-------------|------------|-----|
| Oracle VM dies | Temp upload chunks in /mnt/uploads | In-progress uploads lost; users resume from tus offset | Minutes (active uploads only) |
| Oracle VM dies | Database | Last successful R2 backup | < 24 hours |
| R2 outage | All stored files | Cloudflare manages R2 redundancy (11 9s durability) | N/A |
| R2 bucket deletion | All stored files | No secondary backup of files (acceptable: files are temporary by design) | N/A (files expire anyway) |
| Database corruption | All application state | R2 backup + replay Paystack webhooks | < 24 hours |

---

## 14. Scalability Strategy

### 14.1 Current Capacity Estimates

| Resource | Capacity | Expected Usage (Month 6) | Expected Usage (Month 24) |
|----------|----------|-------------------------|--------------------------|
| Oracle OCPU | 4 cores | ~20% utilization | ~50% utilization |
| Oracle RAM | 24 GB | ~4 GB used | ~8 GB used |
| Oracle Block Storage | 200 GB | ~30 GB temp chunks | ~80 GB temp chunks |
| Oracle Egress | 10 TB/month | ~500 GB | ~3 TB |
| R2 Storage | Unlimited | ~200 GB | ~2 TB |
| PostgreSQL connections | 20 pool | ~5 concurrent | ~15 concurrent |
| Concurrent uploads | 10 throttle | ~3 average | ~8 average |
| Concurrent downloads | 50+ (R2 handles) | ~10 average | ~40 average |

### 14.2 Scaling Triggers & Actions

| Trigger | Threshold | Action |
|---------|-----------|--------|
| CPU sustained >70% | 1 hour | Increase PM2 instances to 3-4; consider paid Oracle tier |
| RAM sustained >80% | 1 hour | Analyze memory leaks; increase PostgreSQL shared_buffers tuning |
| Block storage >60% | Continuous | Reduce orphan chunk cleanup interval from 1 hour to 15 minutes |
| Block storage >85% | Immediate | Auto-reject new uploads (FR19); alert operator |
| Oracle egress >7 TB/month | Daily check | Verify all file downloads use R2 URLs; throttle SSR if needed |
| PostgreSQL connections >15 | Continuous | Optimize slow queries; consider PgBouncer |
| Upload completion rate <85% | Weekly review | Investigate: chunk size tuning, server capacity, R2 transfer speed |
| MRR > NGN 50K | Business trigger | Migrate to paid hosting (Hetzner CAX21: 4 vCPU, 8GB, $8/mo) |

### 14.3 Future Scaling Path

**Phase 1 (Current — Free Tier):**
- Single Oracle ARM VM, single PostgreSQL instance
- R2 for file storage (already scales independently — NFR18)
- PM2 cluster mode for CPU utilization

**Phase 2 (Revenue > NGN 50K/month — Paid Hosting):**
- Migrate to Hetzner CAX21 or similar (NFR17: no code changes required)
- Dedicated PostgreSQL (Neon free tier or Hetzner managed)
- Consider read replica for analytics queries (NFR19)
- Increase concurrent upload limit to 25-50

**Phase 3 (Revenue > NGN 500K/month — Growth):**
- Multiple application instances behind load balancer
- Dedicated PostgreSQL with read replicas
- Redis for session storage, rate limiting, upload tracking
- Consider dedicated upload server (separate from SSR/API)
- CDN-level image optimization for previews

### 14.4 R2 Scaling (NFR18)

Cloudflare R2 scales independently with zero code changes:
- Storage: unlimited (pay per GB)
- Throughput: Cloudflare's global network handles concurrent downloads
- No per-request egress cost regardless of scale
- Multiple buckets can be added for organizational purposes

---

## 15. Key Architectural Decisions (ADR Log)

### ADR-001: Files on R2, Not Oracle Block Storage

**Context:** Oracle free tier can be terminated. 200GB block storage is limited.
**Decision:** All permanent file storage on Cloudflare R2. Oracle block storage is temporary (tus chunks only).
**Consequence:** Uploads transit through Oracle (extra latency per file). Files survive Oracle termination. Storage scales independently.
**Supports:** FR1-FR4, NFR17, NFR18, disaster recovery.

### ADR-002: tus Protocol for Uploads (Not Direct-to-R2)

**Context:** Could use R2 presigned multipart uploads to bypass Oracle entirely.
**Decision:** Use tus protocol via @tus/server on Oracle VM. Files transit through Oracle before R2 transfer.
**Rationale:** tus provides standardized pause/resume, chunk-level progress, session persistence. R2 multipart uploads lack these client-side features. Nigerian network resilience is the #1 priority.
**Consequence:** Files use Oracle bandwidth and IOPS temporarily. Upload flow is more resilient.
**Supports:** FR5, FR6, FR7, NFR1.

### ADR-003: JWT Sessions (Not Database Sessions)

**Context:** NextAuth supports both JWT and database sessions.
**Decision:** JWT sessions stored in httpOnly cookies. No database lookup per request.
**Rationale:** Reduces database load. Stateless sessions simplify scaling. Session data is minimal (userId, tier). Trade-off: cannot instantly revoke sessions (acceptable; tier changes apply on next JWT refresh).
**Supports:** NFR4, scalability.

### ADR-004: Single Next.js Deployment (No Microservices)

**Context:** Could separate API, SSR, tus server, and cron into distinct services.
**Decision:** Single Next.js process handles everything. PM2 cluster mode for multi-core.
**Rationale:** Single free-tier VM. Microservices add operational complexity (service discovery, inter-service auth, Docker orchestration) with no benefit at current scale. Next.js API routes + middleware pattern is sufficient.
**Consequence:** Simpler deployment. All scaling is vertical until Phase 3.
**Supports:** NFR17 (single deployment artifact migrates easily).

### ADR-005: Presigned R2 URLs for Downloads (Not Proxy)

**Context:** Could proxy downloads through Oracle VM, or redirect to R2 presigned URLs.
**Decision:** Generate presigned R2 GET URLs with 5-minute expiry. Redirect browser to R2. R2 serves file directly.
**Rationale:** Zero Oracle egress cost for file downloads. R2 handles Range requests natively (resumable downloads). Cloudflare edge serves from nearest PoP for faster Nigerian downloads.
**Exception:** ZIP downloads are proxied through Oracle (must assemble ZIP from multiple R2 objects in a stream).
**Supports:** FR17, NFR5, cost optimization.

### ADR-006: PostgreSQL over SQLite

**Context:** SQLite is simpler, no Docker needed.
**Decision:** PostgreSQL 16 in Docker container.
**Rationale:** Concurrent writes from uploads, webhooks, and cron jobs would cause SQLite write-lock contention. Payment records require proper ACID. PostgreSQL supports read replicas for future scaling. pg_dump is a proven backup mechanism.
**Supports:** NFR4, NFR19, NFR28, NFR29.

### ADR-007: Caddy over Nginx

**Context:** Nginx is the industry standard reverse proxy.
**Decision:** Caddy 2 as reverse proxy.
**Rationale:** Automatic HTTPS (no certbot cron). Simple Caddyfile syntax (operational simplicity for a solo developer). Built-in rate limiting module. Modern HTTP/3 support. Performance is comparable for our scale.
**Supports:** NFR7, NFR10-12.

### ADR-008: IP Hashing for Download Logs

**Context:** NDPA requires audit logging. Could store raw IPs or hashed IPs.
**Decision:** Store SHA-256 hash of IP. Store country from Cloudflare header.
**Rationale:** NDPA compliance requires data minimization. Hashed IPs satisfy audit requirements (can verify a specific IP against logs) without storing PII. Country is derived from Cloudflare's geo header (no IP lookup service needed).
**Supports:** FR62, NDPA compliance.

### ADR-009: Email Provider Selection (Brevo)

**Context:** Options: Resend (100/day free), Brevo (300/day free), SES, Postmark.
**Decision:** Brevo with paid tier from launch (~$9/month for 5,000/month).
**Rationale:** 300/day free tier is borderline (57 transfers/day could each trigger 1-5 emails). Paid tier provides headroom. SPF/DKIM/DMARC support. Transactional email API is simple. Cheaper than Resend at volume.
**Supports:** FR24, FR25, FR26, NFR31.

### ADR-010: No ClamAV at Launch

**Context:** Virus scanning protects recipients but consumes significant CPU/RAM.
**Decision:** No virus scanning at launch. Add ClamAV when on dedicated hosting (Phase 3).
**Rationale:** ClamAV requires ~1GB RAM for virus definitions + significant CPU during scans. On a shared free-tier VM with 24GB RAM, this is workable but reduces headroom for concurrent uploads. The risk is acceptable: files are temporary (7-60 day expiry), users download at their own risk, and the download page can display a disclaimer.
**Supports:** Resource conservation, PRD explicit decision.

### ADR-011: Monitoring on Separate VM

**Context:** Could run Umami and Uptime Kuma on the same ARM VM as the application.
**Decision:** Dedicated Oracle AMD micro VM for monitoring services.
**Rationale:** Monitoring must survive application VM failure. If the ARM VM goes down, Uptime Kuma on the AMD VM detects it and alerts. Separating monitoring from the monitored system is a reliability best practice.
**Supports:** NFR26, FR63-FR66.

### ADR-012: nanoid Short Codes (Not UUID)

**Context:** Transfer links need unique, URL-safe identifiers.
**Decision:** nanoid with 10 characters from URL-safe alphabet for transfer short codes. 21 characters for API keys.
**Rationale:** Shorter than UUIDs for cleaner URLs (important for WhatsApp sharing). Cryptographically random (NFR14). 10-character nanoid provides ~6.4 * 10^17 combinations — collision probability negligible at our scale. URL-safe alphabet avoids encoding issues.
**Supports:** FR8, NFR14, FR20-FR23.

---

## 16. Implementation Patterns & Consistency Rules

### 16.1 Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Database tables | snake_case, plural | `download_logs`, `file_requests` |
| Database columns | snake_case | `short_code`, `created_at`, `user_id` |
| Prisma models | PascalCase, singular | `Transfer`, `DownloadLog`, `FileRequest` |
| Prisma fields | camelCase | `shortCode`, `createdAt`, `userId` |
| API endpoints | kebab-case, plural nouns | `/api/user/api-keys`, `/api/v1/transfers` |
| API query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| API request/response body | camelCase | `{ shortCode, downloadCount, expiresAt }` |
| React components | PascalCase | `UploadZone`, `DownloadCard`, `FilePreview` |
| React component files | PascalCase.tsx | `UploadZone.tsx`, `DownloadCard.tsx` |
| Hooks | camelCase with `use` prefix | `useUpload`, `useBandwidth` |
| Hook files | camelCase.ts | `useUpload.ts`, `useBandwidth.ts` |
| Service files | kebab-case.service.ts | `transfer.service.ts`, `payment.service.ts` |
| Library files | kebab-case.ts | `tier-limits.ts`, `r2.ts` |
| TypeScript types/interfaces | PascalCase | `TransferMetadata`, `UserSession` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `PAYSTACK_SECRET_KEY` |
| CSS classes | Tailwind utilities | `bg-nigerian-green text-white rounded-lg` |

### 16.2 API Response Format

All API responses use a consistent envelope:

```typescript
// Success (200, 201)
{
  "data": { /* response payload */ },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}

// Success with no body (204)
// Empty response

// Error (4xx, 5xx)
{
  "error": {
    "code": "TRANSFER_EXPIRED",
    "message": "This transfer has expired and is no longer available.",
    "details": { "expiredAt": "2026-03-20T00:00:00Z" }
  }
}
```

**Standard error codes:**
- `VALIDATION_ERROR` — Invalid input (400)
- `UNAUTHORIZED` — Missing/invalid authentication (401)
- `FORBIDDEN` — Insufficient permissions or tier (403)
- `NOT_FOUND` — Resource not found (404)
- `RATE_LIMITED` — Rate limit exceeded (429)
- `TRANSFER_EXPIRED` — Transfer past expiry date (410)
- `DOWNLOAD_LIMIT_REACHED` — No downloads remaining (410)
- `STORAGE_FULL` — Storage threshold exceeded (507)
- `INTERNAL_ERROR` — Unexpected server error (500)

### 16.3 File Organization Rules

- **One export per file** for services and major utilities.
- **Co-located tests:** Test files live next to the code they test: `transfer.service.ts` / `transfer.service.test.ts`.
- **Barrel exports:** Each directory has an `index.ts` re-exporting public API.
- **No circular imports:** Services import from `lib/` but never from each other directly. Use the service layer entry point.

### 16.4 Error Handling Pattern

```typescript
// API route handler pattern (every API route follows this)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTransferSchema.parse(body); // Zod validation
    const result = await transferService.create(validated);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
```

### 16.5 Date/Time Handling

- **Database:** All timestamps stored as UTC (`DateTime` in Prisma, `TIMESTAMPTZ` in PostgreSQL).
- **API responses:** ISO 8601 strings in UTC: `"2026-03-28T12:00:00Z"`.
- **Client display:** Converted to user's local timezone using `Intl.DateTimeFormat` or `date-fns`.
- **Expiry calculation:** Server-side only. `expiresAt = now + (days * 86400000)`.

### 16.6 Logging Conventions

```typescript
// Structured logging with context
console.log(JSON.stringify({
  level: 'info',
  service: 'transfer',
  action: 'create',
  transferId: 'xxx',
  userId: 'xxx',
  fileCount: 3,
  totalBytes: 1073741824,
  timestamp: new Date().toISOString(),
}));

// Error logging — always include stack trace
console.error(JSON.stringify({
  level: 'error',
  service: 'payment',
  action: 'webhook_process',
  error: error.message,
  stack: error.stack,
  paystackRef: 'xxx',
  timestamp: new Date().toISOString(),
}));
```

---

## 17. Project Structure (Complete)

```
nigeriatransfer/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test, build
│       └── deploy.yml                # SSH deploy to Oracle VM
├── prisma/
│   ├── schema.prisma                 # Complete schema (Section 4.2)
│   ├── migrations/                   # Auto-generated by Prisma
│   └── seed.ts                       # Seed wallpapers, test data
├── public/
│   ├── favicon.ico
│   ├── manifest.json                 # PWA manifest
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── sw.js                         # Service worker (offline queue, app shell cache)
│   └── wallpapers/                   # Fallback wallpaper images (also on R2/CDN)
├── scripts/
│   ├── backup-db.sh                  # Database backup to R2
│   ├── restore-db.sh                 # Database restore from R2
│   ├── migrate-hetzner.sh            # Migration runbook script
│   └── seed-wallpapers.ts            # Import wallpaper data
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx              # Homepage / Upload
│   │   │   ├── d/[code]/page.tsx     # Download page (SSR)
│   │   │   ├── request/[code]/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── artists/page.tsx
│   │   │   ├── send-large-files-nigeria/page.tsx
│   │   │   └── wetransfer-alternative-nigeria/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx          # Dashboard overview
│   │   │       ├── transfers/page.tsx
│   │   │       ├── requests/page.tsx
│   │   │       ├── subscription/page.tsx
│   │   │       ├── api-keys/page.tsx
│   │   │       └── analytics/page.tsx
│   │   ├── api/
│   │   │   ├── health/route.ts
│   │   │   ├── upload/
│   │   │   │   ├── create/route.ts
│   │   │   │   ├── probe/route.ts    # Bandwidth estimation endpoint
│   │   │   │   └── files/[...path]/route.ts  # tus handler
│   │   │   ├── transfer/
│   │   │   │   └── [code]/
│   │   │   │       ├── route.ts      # GET transfer metadata
│   │   │   │       ├── verify-password/route.ts
│   │   │   │       ├── download/[fileId]/route.ts
│   │   │   │       ├── download-all/route.ts
│   │   │   │       └── preview/[fileId]/route.ts
│   │   │   ├── request/
│   │   │   │   └── [code]/
│   │   │   │       ├── route.ts      # GET request details
│   │   │   │       └── upload/route.ts
│   │   │   ├── user/
│   │   │   │   ├── transfers/
│   │   │   │   │   ├── route.ts      # GET list, POST create
│   │   │   │   │   └── [id]/route.ts # DELETE, PATCH
│   │   │   │   ├── storage/route.ts
│   │   │   │   ├── subscription/
│   │   │   │   │   ├── route.ts      # GET status
│   │   │   │   │   ├── create/route.ts
│   │   │   │   │   └── cancel/route.ts
│   │   │   │   ├── requests/
│   │   │   │   │   ├── route.ts      # GET list, POST create
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts  # PATCH close
│   │   │   │   │       └── files/route.ts
│   │   │   │   ├── api-keys/
│   │   │   │   │   ├── route.ts      # GET list, POST create
│   │   │   │   │   └── [id]/route.ts # DELETE
│   │   │   │   └── analytics/
│   │   │   │       ├── summary/route.ts
│   │   │   │       └── [transferId]/route.ts
│   │   │   ├── v1/                   # Public developer API
│   │   │   │   ├── transfers/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       └── files/route.ts
│   │   │   │   ├── webhooks/route.ts
│   │   │   │   └── usage/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── paystack/route.ts
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts  # NextAuth catch-all
│   │   │   └── cron/
│   │   │       ├── cleanup/route.ts
│   │   │       ├── backup/route.ts
│   │   │       ├── expiry-warnings/route.ts
│   │   │       └── storage-report/route.ts
│   │   ├── docs/
│   │   │   └── api/page.tsx          # API documentation
│   │   ├── layout.tsx                # Root layout (providers, analytics)
│   │   ├── globals.css
│   │   ├── not-found.tsx             # Custom 404
│   │   └── error.tsx                 # Custom error boundary
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── upload/
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── TransferSettings.tsx
│   │   │   ├── BandwidthEstimator.tsx
│   │   │   ├── ShareCard.tsx
│   │   │   └── FileList.tsx
│   │   ├── download/
│   │   │   ├── DownloadCard.tsx
│   │   │   ├── FilePreview.tsx
│   │   │   ├── PasswordGate.tsx
│   │   │   ├── ExpiryCountdown.tsx
│   │   │   └── AdBanner.tsx
│   │   ├── layout/
│   │   │   ├── BackgroundWallpaper.tsx
│   │   │   ├── LightweightToggle.tsx
│   │   │   ├── DarkModeToggle.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── TransferList.tsx
│   │   │   ├── StorageMeter.tsx
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── RequestList.tsx
│   │   │   └── AnalyticsChart.tsx
│   │   └── shared/
│   │       ├── QRCode.tsx
│   │       ├── PricingTable.tsx
│   │       ├── TierBadge.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── r2.ts                     # S3 client for R2
│   │   ├── paystack.ts              # Paystack API wrapper
│   │   ├── email.ts                  # Brevo email client
│   │   ├── tus.ts                    # tus server config
│   │   ├── nanoid.ts                # Short code generator
│   │   ├── tier-limits.ts           # Tier enforcement constants
│   │   ├── validation.ts            # Zod schemas
│   │   ├── errors.ts                # Custom error classes
│   │   ├── rate-limit.ts            # Rate limiter utility
│   │   ├── file-sanitizer.ts        # Filename sanitization
│   │   ├── constants.ts             # App constants
│   │   └── utils.ts                 # formatBytes, formatDate, etc.
│   ├── services/
│   │   ├── transfer.service.ts
│   │   ├── transfer.service.test.ts
│   │   ├── file.service.ts
│   │   ├── file.service.test.ts
│   │   ├── auth.service.ts
│   │   ├── payment.service.ts
│   │   ├── payment.service.test.ts
│   │   ├── notification.service.ts
│   │   ├── cleanup.service.ts
│   │   ├── cleanup.service.test.ts
│   │   ├── storage-monitor.service.ts
│   │   ├── analytics.service.ts
│   │   ├── api-key.service.ts
│   │   ├── wallpaper.service.ts
│   │   └── webhook-dispatch.service.ts  # Outbound webhooks to API consumers
│   ├── hooks/
│   │   ├── useUpload.ts
│   │   ├── useBandwidth.ts
│   │   ├── useLightweightMode.ts
│   │   ├── useDarkMode.ts
│   │   └── useLocalStorage.ts
│   ├── types/
│   │   ├── transfer.ts
│   │   ├── user.ts
│   │   ├── api.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   ├── middleware.ts                 # Auth check, rate limit, CSP headers
│   └── providers/
│       ├── ThemeProvider.tsx          # Dark mode provider
│       ├── AuthProvider.tsx           # NextAuth session provider
│       └── LightweightProvider.tsx    # Lightweight mode context
├── tests/
│   ├── e2e/
│   │   ├── upload.spec.ts
│   │   ├── download.spec.ts
│   │   └── auth.spec.ts
│   └── fixtures/
│       ├── test-file-1mb.bin
│       └── test-image.jpg
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── Caddyfile
├── docker-compose.yml               # PostgreSQL (dev + prod)
├── ecosystem.config.js               # PM2 configuration
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 18. Requirements Coverage Matrix

### 18.1 Functional Requirements Mapping

| FR | Requirement | Architecture Component | Section |
|----|------------|----------------------|---------|
| FR1-FR3 | File size limits by tier | `lib/tier-limits.ts` + `services/transfer.service.ts` | 6.1 |
| FR4 | Multi-file upload | tus per-file upload + Transfer→File one-to-many | 4.2, 6.1 |
| FR5-FR6 | Pause/resume upload | tus protocol + localStorage persistence | 6.1, 6.2 |
| FR7 | Upload progress + ETA | Client-side tus events + `BandwidthEstimator` | 3.1 |
| FR8 | Short code links | nanoid 10-char + `transfers.shortCode` | 4.2, 15 ADR-012 |
| FR9-FR10 | Configurable expiry + download limits | `transfers.expiresAt` + `transfers.downloadLimit` | 4.2 |
| FR11 | Password protection | bcrypt hash in `transfers.passwordHash` | 7.1, 10.4 |
| FR12-FR14 | File previews | Preview generation in upload flow + R2 storage | 6.1 step 4 |
| FR15 | Individual file download | `/api/transfer/{code}/download/{fileId}` | 7.1 |
| FR16 | ZIP download | `/api/transfer/{code}/download-all` streaming ZIP | 7.1 |
| FR17 | Resumable download | R2 presigned URLs support Range requests natively | 7.1, 15 ADR-005 |
| FR18 | Auto-delete expired | Hourly `cleanup-expired` cron | 5.5 |
| FR19 | Storage auto-rejection | `storage-monitor.service.ts` + STORAGE_THRESHOLD_PERCENT | 6.2, 14.2 |
| FR20-FR23 | Sharing (WhatsApp, SMS, QR, copy) | `ShareCard` component + WhatsApp deep link + QR generation | 3.1 |
| FR24 | Email notifications | `notification.service.ts` + Brevo | 5.1, 15 ADR-009 |
| FR25 | Download notification to sender | Download flow step 3 (debounced email) | 7.1 |
| FR26 | Expiry warning emails | Daily `send-expiry-warnings` cron | 5.5 |
| FR27 | Email magic link auth | NextAuth email provider + Brevo | 8.2 |
| FR28 | Google OAuth | NextAuth Google provider | 8.2 |
| FR29 | Phone OTP auth | NextAuth credential provider + Termii | 8.2 |
| FR30-FR34 | User dashboard | `/dashboard/*` routes + services | 3.1 |
| FR35-FR39 | File request portals | `file_requests` + `file_request_uploads` tables + API | 4.2, 5.2 |
| FR40-FR44 | Paystack subscriptions | `payment.service.ts` + Paystack API + webhooks | 5.4 |
| FR45 | Upgrade prompts | Client-side tier limit checks + UI prompts | 3.1 |
| FR46-FR47 | Ads (free tier only) | `AdBanner` component + `transfer.showAds` field | 3.1, 4.2 |
| FR48 | API key registration | `api_keys` table + dashboard UI | 4.2, 5.2, 8.4 |
| FR49-FR53 | Public API | `/api/v1/*` routes | 5.3 |
| FR54 | API rate limiting | Per-key rate limit in `api_keys.rateLimit` | 5.3, 10.2 |
| FR55 | API documentation | `/docs/api` page | 3.1 |
| FR56-FR58 | Wallpapers + lightweight mode | `BackgroundWallpaper` + `LightweightToggle` + `wallpapers` table | 3.1, 4.2 |
| FR59 | Dark mode | `DarkModeToggle` + `ThemeProvider` | 3.1 |
| FR60 | Bandwidth estimation | `BandwidthEstimator` + `/api/upload/probe` | 3.1, 6.1 |
| FR61 | Artist credit | `wallpapers.artistName` + `wallpapers.artistUrl` | 4.2 |
| FR62 | Download logging | `download_logs` table with IP hash | 4.2, 7.1, 15 ADR-008 |
| FR63 | Storage monitoring | `storage-monitor.service.ts` + health endpoint | 12.5 |
| FR64 | Daily DB backups | `backup-db.sh` cron to R2 | 5.5, 13.3 |
| FR65 | Daily reports | `storage-report` cron + `analytics.service.ts` | 5.5, 12.3 |
| FR66 | Egress tracking | `egress-report` cron + Oracle/R2 metrics APIs | 5.5, 12.3 |

### 18.2 Non-Functional Requirements Mapping

| NFR | Requirement | Architecture Support |
|-----|------------|---------------------|
| NFR1 | tus create <1s | Single DB insert + nanoid generation; no heavy computation |
| NFR2 | Download page <2s 3G | SSR with minimal client JS; R2 preview images via CDN |
| NFR3 | FCP <3s 3G | Code splitting, system fonts, lazy-loaded ads/analytics, <200KB JS |
| NFR4 | 10 concurrent uploads + 50 downloads | PM2 cluster mode; uploads throttled at 10; R2 handles downloads |
| NFR5 | ZIP streaming <3s start | archiver npm streams from R2 pipes; no full buffering |
| NFR6 | R2 transfer <30s/GB | S3 multipart upload to R2 over internal network |
| NFR7 | TLS 1.2+ | Caddy auto-HTTPS + Cloudflare minimum TLS 1.2 |
| NFR8 | R2 encryption at rest | R2 default AES-256 |
| NFR9 | bcrypt 10 rounds | `bcrypt.hash(password, 10)` in transfer service |
| NFR10 | Password rate limit 5/min | Application middleware with IP+transferId tracking |
| NFR11 | Upload rate limit | Caddy + application middleware |
| NFR12 | Download rate limit | Caddy rate_limit directive |
| NFR13 | Path sanitization | `lib/file-sanitizer.ts` strict allowlist |
| NFR14 | Cryptographic short codes | nanoid with crypto-random source |
| NFR15 | No direct file access | All downloads through API validation layer |
| NFR16 | CSP headers | Next.js middleware + Caddy headers |
| NFR17 | Migration without code changes | Environment variables for all infra config; no Oracle-specific code |
| NFR18 | R2 scales independently | S3-compatible API; bucket is external to compute |
| NFR19 | Read replica support | PostgreSQL; Prisma supports read replicas via datasource proxy |
| NFR20 | Upload throttling | In-process concurrent counter; 429 when threshold exceeded |
| NFR21 | 44x44px touch targets | Tailwind `min-w-11 min-h-11` on all interactive elements |
| NFR22 | ARIA live regions | Upload progress, errors, success use `aria-live="polite"` |
| NFR23 | WCAG AA contrast | Nigerian green (#008751) on white passes 4.5:1; verified in design |
| NFR24 | Keyboard accessible | shadcn/ui (Radix primitives) provides keyboard support by default |
| NFR25 | No-JS download | SSR renders download link as plain `<a href>` tag |
| NFR26 | 99.5% uptime | Uptime Kuma monitoring; PM2 auto-restart; separate monitoring VM |
| NFR27 | Cleanup <0.1% failure | Idempotent cleanup service; error logging + retry |
| NFR28 | Daily backup zero failures | Backup script with verification + alert on failure |
| NFR29 | Webhook 99.9% success | Webhook event log + retry mechanism + dead-letter logging |
| NFR30 | Webhook processing <5s | Async processing; immediate 200 response, queue processing |
| NFR31 | Email <60s | Brevo API call in service layer; async, non-blocking |
| NFR32 | R2 operations <2s | Cloudflare edge proximity; S3 SDK with connection reuse |
| NFR33 | API 95th percentile <500ms | DB queries indexed; no N+1; connection pooling; response caching where safe |

---

## 19. Architecture Validation

### 19.1 Coherence Check

- All technology choices are compatible: Next.js 14+ (Node 20) + Prisma 5 + PostgreSQL 16 + TypeScript 5 is a proven, well-tested combination.
- tus upload to local disk followed by R2 transfer is compatible with the single-VM architecture.
- NextAuth v5 integrates natively with Next.js App Router.
- Paystack REST API is consumed from Node.js service layer with no incompatibilities.
- PM2 cluster mode works with Next.js standalone output.

### 19.2 Gap Analysis

**No critical gaps identified.** All 66 FRs and 33 NFRs have explicit architectural support.

**Minor items to address during implementation:**
- **Preview generation tooling:** sharp (images) is available for ARM64. ffmpeg for video poster frames may need to be installed separately on the Oracle ARM VM. If ffmpeg is too heavy, video previews can use the first frame extracted client-side via canvas.
- **Service worker:** The offline upload queue service worker requires careful testing on Samsung Internet and Opera Mini (normal mode). Fallback: if service worker is not supported, the upload still works normally (just without offline queue).
- **AdSense approval:** Google AdSense requires site review. The ad placement architecture is ready, but the AdSense account may not be approved immediately at launch. The `AdBanner` component should handle graceful fallback (empty space, not broken layout).

### 19.3 Completeness Checklist

- [x] System overview with architecture diagram
- [x] Tech stack decisions with version-specific justifications
- [x] Component architecture (frontend, backend, storage, CDN)
- [x] Complete data model with Prisma schema (all 10 tables)
- [x] API design (public, authenticated, developer API v1, webhooks, cron)
- [x] File upload flow with resilience mechanisms
- [x] File download flow with SSR strategy
- [x] Authentication architecture (3 providers + API keys)
- [x] Infrastructure architecture (Oracle ARM, Oracle AMD, R2, Cloudflare)
- [x] Security architecture (rate limiting, CSP, bcrypt, path sanitization, CORS)
- [x] Deployment architecture (GitHub Actions, SSH deploy, PM2)
- [x] Monitoring and observability (Umami, Uptime Kuma, custom metrics, health check)
- [x] Disaster recovery (R2 decoupling, daily backups, Hetzner migration runbook)
- [x] Scalability strategy (triggers, actions, future scaling path)
- [x] 15 architectural decision records with rationale
- [x] Implementation patterns and consistency rules
- [x] Complete project directory structure
- [x] Requirements coverage matrix (all 66 FRs + 33 NFRs mapped)

### 19.4 Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High

**Key Strengths:**
- Storage-compute decoupling eliminates the primary infrastructure risk (Oracle termination)
- Resilience-first design matches Nigerian network reality across all user journeys
- Single-deployment simplicity keeps operational complexity low for a solo developer
- Every PRD requirement has a clear architectural home
- Consistent patterns will keep AI agent implementations compatible

**Areas for Future Enhancement:**
- Redis for shared state if/when scaling to multiple VM instances (Phase 3)
- ClamAV virus scanning when on dedicated hosting
- WebSocket/SSE for real-time download notifications (currently email-based)
- Client-side encryption for Business tier (Phase 3 zero-knowledge encryption)
