---
status: complete
completedAt: '2026-03-28'
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design.md
  - _bmad-output/planning-artifacts/product-brief-transfer.md
  - prompt.md
project_name: NigeriaTransfer
totalEpics: 14
totalStories: 60
---

# NigeriaTransfer -- Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for NigeriaTransfer, decomposing the requirements from the PRD, Architecture, and UX Design specifications into implementable stories. All features ship simultaneously (no phased MVP). Stories are sized for a single developer to complete in 1-3 days.

## Requirements Inventory

### Functional Requirements

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
- FR20: Users can share a transfer link via WhatsApp deep link with one tap
- FR21: Users can share a transfer link via SMS with pre-formatted message
- FR22: Users can generate a QR code for any transfer link
- FR23: Users can copy a transfer link to clipboard
- FR24: Users can send transfer notification emails to up to 10 recipients
- FR25: Senders receive email notification when their files are downloaded
- FR26: System sends expiry warning emails 24 hours before transfer expires
- FR27: Users can create an account via email magic link (passwordless)
- FR28: Users can create an account via Google OAuth
- FR29: Users can create an account via phone number + OTP
- FR30: Authenticated users can view a dashboard of their active transfers
- FR31: Authenticated users can view transfer download statistics (count, timestamps)
- FR32: Authenticated users can delete their own transfers before expiry
- FR33: Authenticated users can view their storage utilization
- FR34: Authenticated users can view their subscription status and billing history
- FR35: Authenticated users can create a file request portal with a title and message
- FR36: File request portals generate a unique shareable link
- FR37: Anyone with a file request link can upload files without creating an account
- FR38: Portal owners can view all files uploaded to their request
- FR39: Portal owners can close a file request to stop accepting uploads
- FR40: Users can subscribe to Pro tier (NGN 2,000/month) via Paystack
- FR41: Users can subscribe to Business tier (NGN 10,000/month) via Paystack
- FR42: Users can pay via card, bank transfer, or USSD
- FR43: Users can cancel their subscription from the dashboard
- FR44: System enforces tier-appropriate limits on file size, expiry, and download count
- FR45: System displays targeted upgrade prompts at 80% and 95% of tier limits
- FR46: Free-tier download pages display a single banner ad below the download card
- FR47: Paid-tier download pages display no ads
- FR48: Developers can register for API keys via the dashboard
- FR49: Developers can create transfers programmatically via API
- FR50: Developers can embed the NigeriaTransfer upload widget in external applications
- FR51: Developers can receive webhook callbacks for upload completion and download events
- FR52: Developers can query transfer status and metadata via API
- FR53: Developers can delete transfers via API
- FR54: API requests are rate-limited per API key (configurable per tier)
- FR55: API documentation is publicly accessible at /docs/api
- FR56: Homepage displays full-bleed rotating Nigerian artwork as background
- FR57: Users can toggle lightweight mode to disable backgrounds, animations, and preview thumbnails
- FR58: Lightweight mode is enabled by default on mobile devices
- FR59: Users can toggle dark mode (auto-detects system preference)
- FR60: System displays bandwidth estimate before upload begins
- FR61: Download pages display artist credit and link for the current background artwork
- FR62: System logs all downloads with timestamp, IP hash, user-agent, and country
- FR63: System monitors storage utilization and triggers auto-rejection at configurable threshold
- FR64: System performs daily database backups to Cloudflare R2
- FR65: System generates daily storage utilization and transfer volume reports
- FR66: System tracks and reports egress bandwidth consumption against 10TB monthly limit
- FR67: System preserves upload session state in browser localStorage
- FR68: Service worker caches the app shell for instant repeat visits and offline access
- FR69: Users can queue files for upload that automatically begin when connectivity restores
- FR70: Upload UI displays connection quality indicator and reconnecting/resuming states
- FR71: Business tier users can upload a custom logo displayed on their transfer download pages
- FR72: Business tier users can set custom brand colors applied to their download page accent elements
- FR73: Business tier users can upload a custom background image for their download pages
- FR74: Business tier download pages do not display "Powered by NigeriaTransfer" branding
- FR75: Authenticated users can extend the expiry date of their active transfers
- FR76: Authenticated users can modify the download limit of their active transfers
- FR77: Authenticated users can add or change password protection on their active transfers
- FR78: Users can print a browser-native transfer receipt
- FR79: System serves static pages: /about, /privacy, /terms, /contact
- FR80: System serves an /artists page displaying credited artwork
- FR81: System serves a /pricing page with tier comparison table in Naira
- FR82: System generates and serves sitemap.xml, robots.txt, and Open Graph meta tags
- FR83: Download pages include Open Graph meta tags for rich WhatsApp/social previews
- FR84: System serves SEO landing pages at /send-large-files-nigeria and /wetransfer-alternative-nigeria
- FR85: Free tier users are limited to 10 transfers per day
- FR86: Pro tier users are limited to 100 transfers per day
- FR87: Business tier users are limited to 500 transfers per day
- FR88: System displays clear messaging when a user reaches their daily transfer limit
- FR89: Download pages include an "Report Abuse" link that submits a report to the admin
- FR90: Administrators can disable/delete any transfer via admin interface
- FR91: Terms of Service prohibit illegal content, malware, and copyright infringement

### Non-Functional Requirements

- NFR1: Upload initiation (tus create) completes in <1 second
- NFR2: Download page loads in <2 seconds on mobile 3G
- NFR3: First Contentful Paint <3 seconds on mobile 3G
- NFR4: System supports 10 concurrent uploads and 50 concurrent downloads without degradation
- NFR5: ZIP archive generation begins streaming within 3 seconds
- NFR6: File transfer from Oracle block storage to R2 completes within 30 seconds per GB
- NFR7: All connections use TLS 1.2+ via Caddy
- NFR8: Files on R2 encrypted at rest (AES-256)
- NFR9: Transfer passwords hashed with bcrypt (min 10 rounds)
- NFR10: Password attempts rate-limited to 5 per minute per transfer per IP
- NFR11: Upload creation rate-limited (10/hr anon, 50/hr auth)
- NFR12: Downloads rate-limited to 100 per hour per IP
- NFR13: All file paths sanitized to prevent path traversal
- NFR14: Transfer short codes use cryptographically random generation (nanoid)
- NFR15: No direct file access -- all downloads through API validation
- NFR16: CSP headers restrict script sources
- NFR17: Architecture supports migration from Oracle to paid hosting without code changes
- NFR18: R2 storage scales independently from compute
- NFR19: Database schema supports horizontal read scaling
- NFR20: Upload throttling activates at concurrent upload threshold
- NFR21: All interactive elements have min 44x44px touch targets on mobile
- NFR22: Upload progress/errors announced to screen readers via ARIA live regions
- NFR23: Color contrast meets WCAG 2.1 AA
- NFR24: All functionality is keyboard-accessible
- NFR25: Download page functions without JavaScript
- NFR26: System maintains >99.5% uptime
- NFR27: Hourly cleanup cron executes with <0.1% failure rate
- NFR28: Daily database backup completes with zero failures
- NFR29: Paystack webhook processing >99.9% success rate
- NFR30: Paystack webhooks processed within 5 seconds
- NFR31: Email notifications sent within 60 seconds of trigger
- NFR32: R2 file operations complete within 2 seconds
- NFR33: Public API responds within 500ms for 95th percentile
- NFR34: TTI <5 seconds on Tecno Spark on 3G
- NFR35: LCP <4 seconds on mobile 3G
- NFR36: Initial JS bundle <200KB gzipped
- NFR37: TTFB <500ms from Nigeria via Cloudflare
- NFR38: Download logs retained 90 days then purged
- NFR39: User account data deleted within 30 days of request
- NFR40: Database backup RPO 24 hours, RTO 1 hour
- NFR41: Abuse reports processed within 24 hours
- NFR42: Reported transfers disabled within 5 minutes of admin action

### Additional Requirements (Architecture)

- Starter: Greenfield Next.js 14+ App Router project with TypeScript, Tailwind CSS 4, shadcn/ui
- PostgreSQL 16 in Docker on Oracle ARM VM
- Prisma 5.x ORM with complete schema (users, transfers, files, download_logs, payments, file_requests, file_request_uploads, api_keys, wallpapers, webhook_events)
- Caddy 2.x reverse proxy with auto-HTTPS, rate limiting, security headers
- PM2 process manager with cluster mode (2 instances)
- tus protocol via @tus/server for chunked resumable uploads (5MB chunks)
- Cloudflare R2 with two buckets: files + backups
- NextAuth.js v5 for auth (email magic link, Google OAuth, phone+OTP credential)
- Brevo for transactional email
- Termii for SMS OTP
- Umami analytics + Uptime Kuma monitoring on separate Oracle AMD micro VM
- CI/CD via GitHub Actions with SSH deploy to Oracle VM
- Consistent API response envelope: { data, meta } / { error: { code, message, details } }
- Zod validation on all API inputs
- Service layer pattern: API routes -> middleware -> services -> Prisma
- Health check endpoint at /api/health

### UX Design Requirements

- UX-DR1: Implement design token system (color palette with Nigerian green #008751, extended palette, semantic tokens for light/dark mode)
- UX-DR2: Implement typography system (system font stack, type scale from display to caption)
- UX-DR3: Implement spacing system (8px base grid, 16 spacing tokens)
- UX-DR4: Implement component token system (button variants: Primary, Secondary, Ghost, Danger, Gold; input styling; border radius; elevation/shadows)
- UX-DR5: Build UploadZone component (drag-and-drop, file picker, drag hover state, file list, mobile tap target)
- UX-DR6: Build ProgressBar component (per-file + overall, speed, ETA, pause/resume, connection states)
- UX-DR7: Build TransferSettings component (expiry, download limit, password, message as expandable accordion)
- UX-DR8: Build ShareCard component (link, QR, WhatsApp/SMS/Email/Copy buttons)
- UX-DR9: Build DownloadCard component (file list, individual + ZIP download, metadata, expiry countdown)
- UX-DR10: Build FilePreview component (image thumbnails, video poster, PDF first page, lightbox)
- UX-DR11: Build PasswordGate component (password input, attempt counter, rate limit messaging)
- UX-DR12: Build AdBanner component (responsive sizes, graceful fallback, free tier only)
- UX-DR13: Build BackgroundWallpaper component (full-bleed image, artist credit bar, crossfade)
- UX-DR14: Build LightweightToggle component (icon toggle, localStorage persistence, body class)
- UX-DR15: Build DarkModeToggle component (light/dark/system, localStorage, prefers-color-scheme)
- UX-DR16: Build BandwidthEstimator component (probe test, estimated time display)
- UX-DR17: Build dashboard layout (sidebar desktop, bottom tabs mobile, transfer cards, pagination)
- UX-DR18: Build PricingTable component (3-tier comparison, feature matrix, FAQ accordion, Naira pricing)
- UX-DR19: Implement responsive breakpoints (360/768/1024) with layout adaptations per screen
- UX-DR20: Implement ARIA live regions for upload progress, success/failure, connection states
- UX-DR21: Implement keyboard navigation (tab order, focus indicators, focus trap in modals)
- UX-DR22: Implement reduced motion support (@media prefers-reduced-motion)
- UX-DR23: Implement no-JS degradation (server-rendered download links, noscript messages)
- UX-DR24: Build error/status pages (expired, limit reached, 404, 500, upload failed, payment failed)
- UX-DR25: Implement conversion trigger UI (file size limit, storage warning, expiry gate, post-transfer upsell)

### FR Coverage Map

- FR1-FR7: Epic 2 (Core Transfer Engine)
- FR8: Epic 2 (Core Transfer Engine)
- FR9-FR11: Epic 3 (File Management & Download)
- FR12-FR17: Epic 3 (File Management & Download)
- FR18-FR19: Epic 1 (Infrastructure & DevOps Setup)
- FR20-FR26: Epic 4 (Sharing & Distribution)
- FR27-FR34: Epic 5 (Authentication & User System)
- FR35-FR39: Epic 7 (File Request Portals)
- FR40-FR47: Epic 6 (Subscriptions & Payments)
- FR48-FR55: Epic 8 (Public API)
- FR56-FR61: Epic 9 (Frontend & Design System)
- FR62-FR66: Epic 1 (Infrastructure & DevOps Setup)
- FR67-FR70: Epic 10 (Offline & Resilience)
- FR71-FR74: Epic 11 (Custom Branding)
- FR75-FR78: Epic 3 (File Management & Download)
- FR79-FR84: Epic 12 (SEO & Marketing Pages)
- FR85-FR88: Epic 14 (Daily Limits & Tier Enforcement)
- FR89-FR91: Epic 13 (Content Moderation & Admin)

## Epic List

### Epic 1: Infrastructure & DevOps Setup
Users can rely on a stable, monitored, and backed-up platform. Developers can deploy code changes safely and automatically.
**FRs covered:** FR18, FR19, FR62, FR63, FR64, FR65, FR66
**NFRs covered:** NFR4, NFR7, NFR17, NFR20, NFR26, NFR27, NFR28, NFR40
**Dependencies:** None (foundational)
**Priority:** 1 (must be first)
**Complexity:** L

### Epic 2: Core Transfer Engine
Anonymous users can upload files (up to 4GB), get a shareable link, and have their uploads survive connection drops and browser crashes through resumable chunked uploads.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8
**NFRs covered:** NFR1, NFR4, NFR6, NFR11, NFR13, NFR14, NFR20
**Dependencies:** Epic 1
**Priority:** 2
**Complexity:** XL

### Epic 3: File Management & Download
Recipients can preview files, download individually or as ZIP, and senders can protect transfers with passwords, set expiry, configure download limits, and manage transfers post-creation.
**FRs covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR75, FR76, FR77, FR78
**NFRs covered:** NFR2, NFR5, NFR9, NFR10, NFR12, NFR15, NFR25
**Dependencies:** Epic 2
**Priority:** 3
**Complexity:** XL

### Epic 4: Sharing & Distribution
Users can share transfer links via WhatsApp, SMS, QR code, email, and clipboard, and senders/recipients receive timely notifications about downloads and expiry.
**FRs covered:** FR20, FR21, FR22, FR23, FR24, FR25, FR26
**NFRs covered:** NFR31
**Dependencies:** Epic 2, Epic 3
**Priority:** 4
**Complexity:** M

### Epic 5: Authentication & User System
Users can create accounts via magic link, Google OAuth, or phone OTP, and access a dashboard showing their transfers, storage usage, and account settings.
**FRs covered:** FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34
**NFRs covered:** NFR24
**Dependencies:** Epic 1, Epic 2
**Priority:** 5
**Complexity:** L

### Epic 6: Subscriptions & Payments
Users can subscribe to Pro or Business tiers via Paystack, pay with card/bank/USSD, and the system enforces tier-appropriate limits with contextual upgrade prompts.
**FRs covered:** FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47
**NFRs covered:** NFR29, NFR30
**Dependencies:** Epic 5
**Priority:** 6
**Complexity:** L

### Epic 7: File Request Portals
Authenticated users can create file request portals, share request links, and collect file uploads from anyone without requiring the uploader to have an account.
**FRs covered:** FR35, FR36, FR37, FR38, FR39
**Dependencies:** Epic 2, Epic 5
**Priority:** 7
**Complexity:** M

### Epic 8: Public API
External developers can register API keys, create/manage transfers programmatically, embed the upload widget, receive webhook callbacks, and access API documentation.
**FRs covered:** FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55
**NFRs covered:** NFR33
**Dependencies:** Epic 2, Epic 5
**Priority:** 8
**Complexity:** L

### Epic 9: Frontend & Design System
Users experience a polished, culturally resonant interface with Nigerian art backgrounds, lightweight mode for data savings, dark mode, and a consistent design language across all pages.
**FRs covered:** FR56, FR57, FR58, FR59, FR60, FR61
**UX-DRs covered:** UX-DR1 through UX-DR25
**Dependencies:** Epic 1 (for project scaffold)
**Priority:** Parallel with Epics 2-3 (design system is a dependency for UI work)
**Complexity:** L

### Epic 10: Offline & Resilience
Users on unreliable connections can queue uploads offline, recover from browser crashes, and see meaningful connection status indicators throughout the upload process.
**FRs covered:** FR67, FR68, FR69, FR70
**Dependencies:** Epic 2
**Priority:** 10
**Complexity:** M

### Epic 11: Custom Branding (Business Tier)
Business tier users can customize their download pages with company logo, brand colors, custom background image, and remove NigeriaTransfer branding.
**FRs covered:** FR71, FR72, FR73, FR74
**Dependencies:** Epic 3, Epic 6
**Priority:** 11
**Complexity:** S

### Epic 12: SEO & Marketing Pages
The platform serves optimized static pages, SEO landing pages, a pricing page, and an artists gallery to drive organic traffic and convert visitors.
**FRs covered:** FR79, FR80, FR81, FR82, FR83, FR84
**NFRs covered:** NFR3, NFR35, NFR36, NFR37
**Dependencies:** Epic 9 (design system)
**Priority:** 12
**Complexity:** M

### Epic 13: Content Moderation & Admin
Administrators can review abuse reports, disable transfers, and the platform enforces terms of service to protect users and the brand.
**FRs covered:** FR89, FR90, FR91
**NFRs covered:** NFR41, NFR42
**Dependencies:** Epic 2, Epic 3
**Priority:** 13
**Complexity:** S

### Epic 14: Daily Limits & Tier Enforcement
The system enforces daily transfer caps per tier, displays clear messaging at limit boundaries, and ties limits to the subscription system.
**FRs covered:** FR85, FR86, FR87, FR88
**Dependencies:** Epic 2, Epic 6
**Priority:** 14
**Complexity:** S

---

## Epic 1: Infrastructure & DevOps Setup

Users can rely on a stable, monitored, and backed-up platform. Developers can deploy code changes safely with CI/CD, and the system automatically manages expired files, backups, and storage health.

### Story 1.1: Initialize Next.js Project with Full Tech Stack

As a developer,
I want a fully configured Next.js 14+ App Router project with TypeScript, Tailwind CSS 4, shadcn/ui, Prisma, and the complete project directory structure,
So that all subsequent development work has a consistent foundation to build upon.

**Acceptance Criteria:**

**Given** the project repository is initialized
**When** `npm run dev` is executed
**Then** a Next.js 14+ App Router application starts with TypeScript strict mode, Tailwind CSS 4, and shadcn/ui installed
**And** the project directory structure matches the architecture specification (app/, components/, lib/, services/, types/, hooks/)
**And** Prisma is configured with the complete schema from the architecture document (all models, enums, indexes, and relations)
**And** ESLint and Prettier are configured with consistent rules
**And** environment variable template (.env.example) documents all required variables
**And** the project compiles with `tsc --noEmit` without errors

### Story 1.2: Configure PostgreSQL, Caddy, and PM2 on Oracle ARM VM

As an operator,
I want PostgreSQL running in Docker, Caddy reverse proxy with auto-HTTPS and security headers, and PM2 managing the Node.js process,
So that the application has a production-ready runtime environment.

**Acceptance Criteria:**

**Given** an Oracle ARM VM with Ubuntu 22.04 is provisioned
**When** the setup scripts are executed
**Then** PostgreSQL 16 runs in Docker with a 20-connection pool
**And** Caddy serves HTTPS with auto-provisioned TLS certificates, HSTS, security headers (X-Content-Type-Options, X-Frame-Options, CSP), and gzip/zstd compression
**And** Caddy rate limits general requests to 300/minute per IP and tus uploads allow 50GB body size with 30-minute timeouts
**And** PM2 runs Next.js in cluster mode (2 instances) with log rotation and auto-restart
**And** block storage (200GB) is mounted at /mnt/uploads for temporary tus chunks
**And** a health check endpoint at /api/health returns status of database, R2 connectivity, and storage utilization

### Story 1.3: Configure Cloudflare R2 Storage and CDN

As an operator,
I want Cloudflare R2 buckets for file storage and backups with proper access controls, and Cloudflare CDN configured for static assets,
So that files are stored durably with zero egress costs and static assets are cached at the edge.

**Acceptance Criteria:**

**Given** a Cloudflare account with R2 enabled
**When** the storage configuration is applied
**Then** two R2 buckets exist: nigeriatransfer-files (transfers + previews) and nigeriatransfer-backups (DB dumps with 30-day lifecycle policy)
**And** an R2 client library (lib/r2.ts) using the S3 SDK can upload, download, delete, and generate presigned URLs
**And** Cloudflare DNS proxies nigeriatransfer.com to the Oracle VM
**And** static assets (/_next/static/*, favicon, robots.txt, sitemap.xml) have Cache-Control headers with 1-year max-age and immutable flag
**And** wallpaper background images are cached at the CDN edge with 24-hour TTL

### Story 1.4: Set Up CI/CD Pipeline with GitHub Actions

As a developer,
I want automated linting, type checking, testing, and deployment on push to main,
So that code quality is enforced and deployments are consistent and reliable.

**Acceptance Criteria:**

**Given** code is pushed to the main branch
**When** the GitHub Actions workflow triggers
**Then** the pipeline runs ESLint, TypeScript type check (tsc --noEmit), and Vitest tests
**And** on all checks passing, the pipeline SSHs to the Oracle VM, pulls latest code, runs `npm ci --production`, `prisma migrate deploy`, `next build`, and `pm2 restart`
**And** a health check (curl localhost) verifies the deployment succeeded
**And** on health check failure, the pipeline reports failure (rollback documented in runbook)
**And** the pipeline completes in under 10 minutes

### Story 1.5: Implement Expired Transfer Cleanup and Orphan Chunk Removal

As an operator,
I want hourly automated cleanup of expired transfers (database records + R2 objects) and orphaned tus upload chunks,
So that storage is reclaimed within 2 hours of expiry and abandoned uploads do not fill block storage.

**Acceptance Criteria:**

**Given** the hourly cron job runs
**When** transfers with status ACTIVE and expiresAt < now() exist
**Then** their status is set to EXPIRED, all associated R2 objects (files + previews) are deleted, and download logs are cascade-deleted (FR18)
**And** user storageUsedBytes is decremented by the transfer's totalSizeBytes
**And** tus upload chunks in /mnt/uploads/ older than 24 hours are deleted as orphaned uploads
**And** cron endpoints are protected by an internal secret header (CRON_SECRET)
**And** cleanup execution is logged with counts of transfers deleted, bytes reclaimed, and chunks purged (NFR27)

### Story 1.6: Implement Database Backup to R2

As an operator,
I want daily automated PostgreSQL backups compressed and uploaded to R2 with checksum verification,
So that the database can be recovered within 1 hour if the Oracle VM is lost.

**Acceptance Criteria:**

**Given** the daily backup cron triggers at 03:00 WAT
**When** the backup script executes
**Then** pg_dump compresses the database to .sql.gz format
**And** a SHA-256 checksum file is generated alongside the backup
**And** both files are uploaded to nigeriatransfer-backups/db/{date}/ and nigeriatransfer-backups/db/latest/
**And** the backup script verifies the upload exists in R2
**And** on verification failure, an alert is sent (webhook or email) (NFR28)
**And** R2 lifecycle policy auto-deletes backups older than 30 days

### Story 1.7: Set Up Monitoring VM with Umami and Uptime Kuma

As an operator,
I want Umami analytics and Uptime Kuma monitoring running on a separate Oracle AMD micro VM,
So that monitoring survives application VM failure and I can track uptime, traffic, and performance.

**Acceptance Criteria:**

**Given** an Oracle AMD micro VM is provisioned
**When** Docker Compose starts the monitoring stack
**Then** Umami is accessible at analytics.nigeriatransfer.com and tracks page views, unique visitors, referrers, countries, device types, and custom events (upload_started, upload_completed, download_started, share_whatsapp)
**And** Uptime Kuma monitors: homepage (60s), /api/health (60s), download page sample (5m), PostgreSQL TCP (60s), R2 HEAD (5m)
**And** Uptime Kuma alerts via Telegram and email on downtime
**And** Caddy on the monitoring VM reverse proxies to both services with auto-HTTPS
**And** target uptime >99.5% is tracked and reportable (NFR26)

### Story 1.8: Implement Storage Monitoring and Auto-Rejection

As an operator,
I want real-time storage utilization tracking with automatic upload rejection at 85% capacity,
So that the system never runs out of storage and degrades gracefully under pressure.

**Acceptance Criteria:**

**Given** storage utilization is being monitored
**When** Oracle block storage utilization exceeds 85%
**Then** new upload creation requests receive HTTP 507 with error code STORAGE_FULL and a user-friendly message (FR19, FR63)
**And** daily storage reports log total R2 storage, block storage usage, active transfer count, and bytes uploaded/downloaded (FR65)
**And** daily egress reports track Oracle egress against the 10TB monthly limit (FR66)
**And** the /api/health endpoint reports storage status as "ok" (<75%), "warning" (75-85%), or "critical" (>85%)

---

## Epic 2: Core Transfer Engine

Anonymous users can upload files up to 4GB (or tier limits for authenticated users), get a shareable link with a unique short code, and have their uploads survive connection drops through tus resumable chunked uploads with progress tracking.

### Story 2.1: Implement tus Upload Server with Chunked Resumable Uploads

As an anonymous user,
I want to upload files using resumable chunked uploads that survive connection drops,
So that I can reliably transfer large files even on unstable Nigerian internet connections.

**Acceptance Criteria:**

**Given** a user has selected files to upload
**When** POST /api/upload/create is called with file metadata and transfer settings
**Then** a Transfer record (status: UPLOADING) and File records (placeholders) are created in the database
**And** tus upload URLs are returned for each file
**And** the tus server accepts 5MB chunks at /api/upload/files/{fileId} and writes them to /mnt/uploads/{uploadId}/
**And** on network drop, the tus client can resume from the last completed chunk via HEAD request
**And** upload creation is rate-limited: 10/hour per IP for anonymous, 50/hour for authenticated (NFR11)
**And** file paths are sanitized to prevent path traversal: only alphanumeric, hyphens, underscores, dots allowed (NFR13)

### Story 2.2: Implement R2 File Transfer and Transfer Activation

As a user who has completed an upload,
I want my files to be securely stored on Cloudflare R2 and a shareable link generated,
So that my files are durable, accessible via link, and local storage is freed.

**Acceptance Criteria:**

**Given** tus upload completes for a file
**When** the upload-complete event fires
**Then** the server assembles chunks, computes SHA-256 checksum, and streams the file to R2 at transfers/{transferId}/{fileId}/{sanitized_filename}
**And** the File record is updated with r2Key and checksum
**And** local chunks are deleted from /mnt/uploads/ after successful R2 transfer
**And** R2 transfer completes within 30 seconds per GB with retry (3 attempts, exponential backoff) (NFR6)
**And** when ALL files in a transfer complete, Transfer status changes to ACTIVE, a nanoid short code (10 chars) is generated, totalSizeBytes is computed, and user storageUsedBytes is updated
**And** the response includes shortCode, download URL, and QR code SVG

### Story 2.3: Build Upload Widget UI with Progress, Pause, and Resume

As a user,
I want to see per-file and overall upload progress with speed and ETA, and pause/resume my upload,
So that I know how long the transfer will take and can control it on my connection.

**Acceptance Criteria:**

**Given** files are uploading via tus
**When** the upload is in progress
**Then** the UI shows per-file progress bars (4px, green), overall progress bar (8px), upload speed (MB/s, updated every 2s rolling average), and ETA (updated every 5s, smoothed) (FR7)
**And** a Pause button toggles to Resume and stops/continues chunk transmission (FR5)
**And** when connection drops, the UI shows "Reconnecting..." with animated dots, speed shows "--", and on reconnection shows "Resuming from {X}%..." (FR6, FR70)
**And** file selection supports drag-and-drop (desktop) and native file picker (mobile with 44x44px tap target)
**And** each file row shows thumbnail/icon, filename (truncated), size, and remove [x] button
**And** files exceeding tier limit show red warning: "This file exceeds the {limit} limit"
**And** concurrent uploads are limited to 2 files in parallel; additional files queue automatically

### Story 2.4: Implement Upload Throttling and Concurrent Upload Management

As an operator,
I want the system to throttle uploads when concurrent sessions exceed safe IOPS limits,
So that the Oracle free-tier VM remains stable under load.

**Acceptance Criteria:**

**Given** the concurrent upload counter tracks active tus upload sessions
**When** concurrent uploads reach the configurable threshold (default: 10)
**Then** new upload requests receive HTTP 429 with Retry-After header and enter a "queued" state (NFR20)
**And** queued uploads start automatically when a slot opens
**And** the client displays "Upload queued -- waiting for server capacity" with a position indicator
**And** the counter increments on tus upload start and decrements on file completion or session timeout

### Story 2.5: Implement Tier-Based File Size Validation

As a user,
I want the system to enforce file size limits based on my tier (4GB free, 10GB Pro, 50GB Business),
So that tier limits are respected and I get clear feedback about upgrading.

**Acceptance Criteria:**

**Given** a user initiates a transfer
**When** file metadata is validated at POST /api/upload/create
**Then** anonymous/free users are rejected for any file exceeding 4GB (FR1)
**And** Pro users are rejected for any file exceeding 10GB (FR2)
**And** Business users are rejected for any file exceeding 50GB (FR3)
**And** multiple files in a single transfer are accepted (FR4)
**And** validation errors return specific messages with the current tier limit and a prompt to upgrade
**And** client-side validation runs before server call to provide instant feedback

---

## Epic 3: File Management & Download

Recipients can view transfer details, preview files (images, video, PDF), download individually or as ZIP, and interact with password-protected transfers. Senders can configure expiry, download limits, and manage transfers post-creation.

### Story 3.1: Build Download Page with Server-Side Rendering

As a file recipient,
I want to open a transfer link and see file details, previews, and download buttons on a fast-loading page,
So that I can access shared files quickly even on a slow connection.

**Acceptance Criteria:**

**Given** a recipient opens /d/{shortCode}
**When** the server renders the page
**Then** the page displays: sender name/email (if provided), message, file list (name, size, type icon), expiry countdown, downloads remaining counter (FR15)
**And** the download link is rendered server-side as an `<a href>` tag that works without JavaScript (NFR25)
**And** the page loads in <2 seconds on mobile 3G (NFR2)
**And** Open Graph meta tags render transfer title, file count, and sender info for WhatsApp/social previews (FR83)
**And** if transfer is expired, show expired page with "Send your own files" CTA
**And** if download limit reached, show limit-reached page with messaging
**And** if not found, show 404 page

### Story 3.2: Implement Individual File Download with Signed R2 URLs

As a file recipient,
I want to download individual files that resume if my connection drops,
So that I can get specific files without downloading everything.

**Acceptance Criteria:**

**Given** a recipient clicks download on an individual file
**When** GET /api/transfer/{code}/download/{fileId} is called
**Then** the server validates: transfer is ACTIVE, not expired, downloads remaining > 0, password session valid (if protected)
**And** a presigned R2 GET URL with 5-minute expiry and Content-Disposition: attachment is generated
**And** the browser is redirected (302) to the R2 URL, which serves the file directly with zero Oracle egress
**And** R2 serves with Range request support for resumable downloads (FR17)
**And** Transfer.downloadCount is incremented
**And** a download log entry is created with ip_hash (SHA-256), user_agent, country (from CF-IPCountry header) (FR62)
**And** downloads are rate-limited to 100 per hour per IP (NFR12)

### Story 3.3: Implement ZIP Download for Multi-File Transfers

As a file recipient,
I want to download all files in a transfer as a single ZIP archive,
So that I can get everything at once without clicking each file individually.

**Acceptance Criteria:**

**Given** a recipient clicks "Download All (ZIP)"
**When** GET /api/transfer/{code}/download-all is called
**Then** the server validates the same conditions as individual download
**And** a streaming ZIP is generated using the archiver package: each file is fetched from R2 and piped into the ZIP stream (no full buffering)
**And** Content-Disposition is set to attachment; filename="{shortCode}-files.zip"
**And** ZIP streaming begins within 3 seconds of request (NFR5)
**And** downloadCount is incremented by 1 (not per file)
**And** for ZIP > 2GB, a warning is displayed suggesting individual downloads to save bandwidth

### Story 3.4: Implement Password Protection for Transfers

As a sender,
I want to add password protection to my transfer so only people with the password can access the files,
So that I can share sensitive documents securely.

**Acceptance Criteria:**

**Given** a sender enables password protection and enters a password during transfer creation
**When** the transfer is created
**Then** the password is hashed with bcrypt (minimum 10 rounds) and stored in Transfer.passwordHash (NFR9)
**And** the download page shows only a PasswordGate component (no file names, no sender info) until password is verified
**And** POST /api/transfer/{code}/verify-password compares the input with the stored hash
**And** on success, an httpOnly session cookie is set for this transfer
**And** password attempts are rate-limited to 5 per minute per transfer per IP (NFR10)
**And** after 5 failed attempts, show "Too many attempts. Try again in 1 minute."

### Story 3.5: Implement Transfer Settings (Expiry, Download Limit, Message)

As a sender,
I want to configure expiry period, download limit, and add a personal message to my transfer,
So that I can control how long files are available and how many times they can be downloaded.

**Acceptance Criteria:**

**Given** a user is creating a transfer
**When** they expand the Settings accordion on the upload widget
**Then** they can set expiry: 7 days for free (fixed), up to 30 days for Pro, up to 60 days for Business (FR9)
**And** they can set download limit: 50 for free (fixed), up to 250 for Pro, unlimited for Business (FR10)
**And** they can enter a personal message (max 500 characters) displayed on the download page
**And** free-tier users see disabled options beyond their tier limits with a tooltip: "Available with Pro"
**And** settings default to tier-appropriate values (7-day expiry, 50 downloads for free)

### Story 3.6: Implement File Previews (Image, Video, PDF)

As a file recipient,
I want to preview images as thumbnails, videos as poster frames, and PDFs as first-page renders before downloading,
So that I can verify file contents before using my data to download.

**Acceptance Criteria:**

**Given** files are uploaded and transferred to R2
**When** preview generation runs asynchronously after file completion
**Then** images are processed with sharp to 400px WebP thumbnails stored at previews/{transferId}/{fileId}/thumb.webp (FR12)
**And** videos are processed with ffmpeg (if available) to extract a poster frame as WebP (FR13)
**And** PDFs are processed with pdf-lib to render the first page as WebP (FR14)
**And** File.previewGenerated is set to true and File.r2PreviewKey is updated
**And** on the download page, previews display in a responsive grid (2 cols mobile, 4 cols desktop)
**And** tapping a preview opens a lightbox (full-screen overlay, dark backdrop, pinch-to-zoom for images, play button for video, close via X/tap outside/Escape)
**And** in Lightweight Mode, all previews are replaced with file-type SVG icons (<1KB each)

### Story 3.7: Implement Post-Creation Transfer Management

As an authenticated sender,
I want to extend expiry, modify download limits, and add/change password protection on my active transfers,
So that I can adjust transfer settings after creation without creating a new transfer.

**Acceptance Criteria:**

**Given** an authenticated user views their transfer in the dashboard
**When** they click management actions on an active transfer
**Then** they can extend expiry within their tier limits (FR75)
**And** they can increase or decrease the download limit within their tier limits (FR76)
**And** they can add password protection to an unprotected transfer or change the password (FR77)
**And** changes take effect immediately
**And** a browser-native print receipt is available showing files, sizes, recipient, date, expiry, and link (FR78)

---

## Epic 4: Sharing & Distribution

Users can share transfer links through WhatsApp, SMS, QR code, email, and clipboard copy, and receive timely notifications about downloads and upcoming expiry.

### Story 4.1: Implement Share Sheet (WhatsApp, SMS, Email, Copy, QR)

As a sender who just completed a transfer,
I want to share the download link via WhatsApp, SMS, email, or copy it to clipboard, and see a QR code,
So that I can quickly distribute the link through my preferred channel.

**Acceptance Criteria:**

**Given** a transfer completes successfully
**When** the Success State renders in the upload widget
**Then** a WhatsApp button opens `https://wa.me/?text=I sent you files via NigeriaTransfer: {link}` (FR20)
**And** an SMS button opens `sms:?body=...` with pre-formatted message and short link (FR21)
**And** an Email button opens `mailto:?subject=...&body=...` with transfer link (FR24 supplementary)
**And** a Copy Link button copies to clipboard and shows "Copied!" with green checkmark for 2 seconds (FR23)
**And** a QR code is rendered inline (~120x120px mobile) as SVG, always visible (FR22)
**And** ARIA labels are set on all share buttons (e.g., "Share via WhatsApp")

### Story 4.2: Implement Email Transfer Mode and Recipient Notifications

As a sender,
I want to enter recipient emails and have them automatically notified with a branded download email,
So that recipients get a professional notification without me manually sharing the link.

**Acceptance Criteria:**

**Given** a sender selects "Email Transfer" mode and enters up to 10 recipient emails
**When** the transfer completes and status is ACTIVE
**Then** each recipient receives a branded Brevo email: "You received files via NigeriaTransfer" with a green "Download Your Files" CTA button, sender's message, file count, and total size (FR24)
**And** emails are sent within 60 seconds of transfer activation (NFR31)
**And** email addresses are validated with Zod (max 10 recipients)
**And** the share sheet still appears for additional sharing options

### Story 4.3: Implement Download Notification to Senders

As a sender,
I want to receive an email notification when my files are downloaded,
So that I know the recipient accessed my transfer.

**Acceptance Criteria:**

**Given** a file is downloaded from a transfer where the sender provided their email
**When** the download is logged
**Then** the sender receives an email: "Your files were downloaded" with timestamp, transfer title, and download count (FR25)
**And** notifications are debounced: max 1 email per hour per transfer to avoid spam from multiple downloads
**And** email is sent within 60 seconds of download event (NFR31)

### Story 4.4: Implement Expiry Warning Emails

As a sender,
I want to receive a warning email 24 hours before my transfer expires,
So that I can extend the expiry or notify recipients before files become unavailable.

**Acceptance Criteria:**

**Given** the daily expiry-warning cron runs at 06:00
**When** active transfers have expiresAt within the next 24-25 hours
**Then** senders with email addresses receive: "Your transfer expires tomorrow" with transfer details, download count, and a CTA to extend expiry (if authenticated) (FR26)
**And** each transfer only triggers one warning email (tracked to avoid duplicates)

---

## Epic 5: Authentication & User System

Users can create accounts via email magic link, Google OAuth, or phone OTP, and access a dashboard with their transfers, storage usage, and account management.

### Story 5.1: Implement Email Magic Link Authentication

As a user,
I want to sign in with just my email address by receiving a magic link,
So that I can create an account without remembering a password.

**Acceptance Criteria:**

**Given** a user enters their email on the login/register page
**When** they click "Send Magic Link"
**Then** a verification token is generated, stored in verification_tokens with 10-minute expiry, and a Brevo email is sent with a sign-in link (FR27)
**And** clicking the link verifies the token, creates or updates the User record, and sets a JWT session cookie (httpOnly, secure, sameSite=lax, 30-day sliding expiry)
**And** the token is single-use and expires after 10 minutes
**And** the login page prominently displays "No account needed to send files" with a link to the homepage

### Story 5.2: Implement Google OAuth Authentication

As a user (especially diaspora),
I want to sign in with my Google account in one tap,
So that I can quickly access my dashboard using an account I already have.

**Acceptance Criteria:**

**Given** a user clicks "Continue with Google"
**When** the OAuth 2.0 flow completes via NextAuth Google provider
**Then** a User record is created/updated and linked via the accounts table (FR28)
**And** a JWT session cookie is set with userId, email, tier, and name
**And** subsequent visits auto-detect the existing session

### Story 5.3: Implement Phone + OTP Authentication

As a Nigerian user who prefers phone-based auth,
I want to sign in with my phone number and a one-time code sent via SMS,
So that I can use my phone number as my identity.

**Acceptance Criteria:**

**Given** a user enters their phone number (+234 format)
**When** they click "Send OTP"
**Then** a 6-digit OTP is generated, hashed, stored with 5-minute expiry, and sent via Termii SMS API (FR29)
**And** the OTP verification screen shows 6 input boxes with auto-advance, countdown timer for resend, and "Try a different method" option
**And** on correct OTP, User record is created/updated and JWT session cookie is set
**And** OTP is single-use and rate-limited (max 3 OTP sends per phone per hour)

### Story 5.4: Build User Dashboard (Transfers, Storage, Analytics)

As an authenticated user,
I want a dashboard showing my active transfers, storage usage, download analytics, and account settings,
So that I can manage my transfers and monitor their performance.

**Acceptance Criteria:**

**Given** an authenticated user navigates to /dashboard
**When** the dashboard loads
**Then** a sidebar (desktop) or bottom tab bar (mobile) shows: My Transfers, File Requests, Storage, Subscription, Analytics
**And** My Transfers shows a paginated list of transfers with: file summary, creation date, expiry, download count/limit, status badge (Active/Expired), and actions (Copy Link, Delete with confirmation, Extend Expiry) (FR30, FR31, FR32)
**And** Storage shows a visual progress bar (green <70%, gold >70%, red >90%) with bytes used vs tier limit and largest active transfers (FR33)
**And** Subscription shows current plan, next billing date, amount, Upgrade/Cancel buttons, and billing history (FR34)
**And** Analytics shows a lightweight chart (downloads over time: 7d/30d/90d), total downloads, most downloaded transfer, total data transferred (FR31)
**And** search by filename and filter by status (Active/Expired/All) are available

---

## Epic 6: Subscriptions & Payments

Users can subscribe to Pro or Business tiers via Paystack with card, bank transfer, or USSD, and the system enforces tier limits with contextual upgrade prompts on download pages and the dashboard.

### Story 6.1: Implement Paystack Subscription Checkout

As a user who wants premium features,
I want to subscribe to Pro (NGN 2,000/month) or Business (NGN 10,000/month) via Paystack,
So that I can unlock higher file size limits, longer expiry, and additional features.

**Acceptance Criteria:**

**Given** an authenticated user clicks "Upgrade to Pro" or "Upgrade to Business"
**When** POST /api/user/subscription/create initializes the Paystack checkout
**Then** the user is redirected to Paystack's hosted checkout page with the correct plan code (FR40, FR41)
**And** payment methods include card, bank transfer, and USSD (FR42)
**And** all prices are displayed in Naira (NGN)
**And** on successful payment, Paystack redirects back to the dashboard with a confirmation state

### Story 6.2: Implement Paystack Webhook Processing

As the system,
I want to process Paystack webhook events reliably to manage subscription lifecycle,
So that subscriptions are activated, renewed, and cancelled correctly.

**Acceptance Criteria:**

**Given** Paystack sends a webhook to POST /api/webhooks/paystack
**When** the event is received
**Then** the HMAC-SHA512 signature is verified against PAYSTACK_WEBHOOK_SECRET
**And** the raw payload is stored in webhook_events for audit trail
**And** charge.success activates the subscription (updates User.tier, planStartDate, planEndDate, paystackCustomerId, paystackSubCode)
**And** subscription.not_renew and subscription.disable update the user's tier to FREE at period end
**And** invoice.payment_failed sends a notification email to the user
**And** webhooks are processed within 5 seconds (NFR30) with >99.9% success rate (NFR29)
**And** failed webhook processing is retried and logged in webhook_events.error

### Story 6.3: Implement Subscription Cancellation

As a subscribed user,
I want to cancel my subscription from the dashboard,
So that I stop being charged while keeping access until the end of my billing period.

**Acceptance Criteria:**

**Given** a user with an active Pro or Business subscription
**When** they click "Cancel Plan" in the Subscription section
**Then** a confirmation dialog explains: access continues until {planEndDate}, then tier reverts to Free (FR43)
**And** on confirmation, POST /api/user/subscription/cancel calls Paystack's disable subscription endpoint
**And** the dashboard shows "Cancelling -- active until {date}" status
**And** on planEndDate, the user's tier reverts to FREE

### Story 6.4: Implement Tier Limit Enforcement

As the system,
I want to enforce tier-appropriate limits on file size, expiry, download count, and ads,
So that free users have reasonable limits and paid users get their premium features.

**Acceptance Criteria:**

**Given** a user creates or configures a transfer
**When** the system validates transfer settings
**Then** file size limits are enforced: 4GB free, 10GB Pro, 50GB Business (FR44)
**And** expiry limits are enforced: 7 days free, 30 days Pro, 60 days Business (FR44)
**And** download limits are enforced: 50 free, 250 Pro, unlimited Business (FR44)
**And** free-tier download pages render the AdBanner component (FR46)
**And** paid-tier download pages render no ads (FR47)
**And** tier limits are defined in a central lib/tier-limits.ts configuration

### Story 6.5: Implement Contextual Upgrade Prompts

As the system,
I want to show targeted upgrade prompts when users approach their tier limits,
So that users discover the value of upgrading at the moment they need it most.

**Acceptance Criteria:**

**Given** a user's usage approaches tier limits
**When** they hit 80% or 95% of file size, storage, or download count limits
**Then** a non-blocking, dismissible upgrade banner appears with specific messaging (FR45)
**And** file size trigger: inline warning when file exceeds free limit with "Upgrade to Pro for 10 GB" CTA
**And** storage trigger: gold banner on dashboard storage meter at >80%: "You've used 3.8 GB of your 4 GB limit"
**And** download limit trigger: email when 5 or fewer downloads remain
**And** post-transfer trigger: card below success state: "Want up to 10 GB transfers? Try Pro."
**And** ad-free trigger: subtle text below ad banner on free download pages
**And** all prompts are dismissible and never block the current action

---

## Epic 7: File Request Portals

Authenticated users can create upload request links, share them, and collect files from anyone without requiring the uploader to create an account.

### Story 7.1: Create File Request Portal

As an authenticated user (business, HR, legal),
I want to create a file request portal with a title and message,
So that I can collect documents from clients, candidates, or partners through a branded upload link.

**Acceptance Criteria:**

**Given** an authenticated user is on the dashboard File Requests tab
**When** they click "+ New Request" and fill in title (max 200 chars) and optional message
**Then** a FileRequest record is created with a unique nanoid short code and status OPEN (FR35, FR36)
**And** the request link (/request/{code}) is displayed with Copy Link and Share buttons
**And** the user can set optional limits: max number of uploads, expiry date
**And** the request appears in their File Requests tab with status, upload count, and link

### Story 7.2: Build File Request Upload Page

As anyone with a file request link,
I want to upload files to the request without creating an account,
So that I can submit documents quickly without friction.

**Acceptance Criteria:**

**Given** a visitor opens /request/{code}
**When** the page loads
**Then** it displays the requester's name, message, and a drag-and-drop upload zone (reusing UploadZone component) (FR37)
**And** no account is required for the uploader
**And** an optional email field allows the uploader to receive a confirmation notification
**And** the upload uses the same tus resumable upload flow as the main transfer
**And** on success, "Files submitted successfully" with a green checkmark is displayed (no share buttons)
**And** if the request is closed, show "This file request is no longer accepting uploads" with a CTA to NigeriaTransfer

### Story 7.3: Manage File Request Submissions

As a file request owner,
I want to view all files uploaded to my request and close the request when done,
So that I can manage incoming documents and stop accepting uploads.

**Acceptance Criteria:**

**Given** an authenticated user views their File Request in the dashboard
**When** they navigate to a specific request
**Then** they see all FileRequestUpload entries with uploader name/email, upload timestamp, and linked transfer (FR38)
**And** they can download any submitted file via the linked transfer
**And** they can close the request (status OPEN -> CLOSED), stopping new uploads (FR39)
**And** a closed request page shows the closed message to visitors

---

## Epic 8: Public API

External developers can register API keys, create and manage transfers programmatically, embed the upload widget, receive webhook callbacks, and access comprehensive API documentation.

### Story 8.1: Implement API Key Registration and Management

As a developer (Business tier),
I want to register API keys from my dashboard and manage them,
So that I can authenticate my applications with the NigeriaTransfer API.

**Acceptance Criteria:**

**Given** a Business tier user navigates to Dashboard > API Keys
**When** they click "Create API Key" and provide a name
**Then** an API key is generated in format `nt_live_{random_42_chars}` (50 chars total)
**And** the full key is displayed exactly once; only the prefix (nt_live_XXXXXXXX) is stored alongside the SHA-256 hash (FR48)
**And** API keys list shows: name, prefix, tier, rate limit, last used, created date, and revoke button
**And** revoking a key (DELETE /api/user/api-keys/{id}) sets isActive to false immediately
**And** rate limits default per tier: Free 100/hr, Pro 500/hr, Business 2000/hr (FR54)

### Story 8.2: Implement Public API Endpoints (v1)

As a developer,
I want to create, query, and delete transfers programmatically,
So that I can integrate file transfer into my application's workflow.

**Acceptance Criteria:**

**Given** a developer sends requests with `Authorization: Bearer {api_key}`
**When** calling the versioned API at /api/v1/
**Then** POST /api/v1/transfers creates a transfer and returns upload URLs (FR49)
**And** GET /api/v1/transfers/{id} returns transfer status and metadata (FR52)
**And** DELETE /api/v1/transfers/{id} deletes the transfer and associated R2 objects (FR53)
**And** GET /api/v1/transfers/{id}/files lists files in a transfer
**And** GET /api/v1/usage returns API usage stats for the key
**And** all responses use the standard envelope: { data, meta } / { error: { code, message } }
**And** rate limiting is enforced per API key tier with 429 + Retry-After on limit exceeded (FR54)
**And** 95th percentile response time is <500ms (NFR33)

### Story 8.3: Implement Webhook Callbacks for API Consumers

As a developer,
I want to register a webhook URL and receive callbacks for transfer events,
So that my application is notified when uploads complete and files are downloaded.

**Acceptance Criteria:**

**Given** a developer registers a webhook URL via POST /api/v1/webhooks
**When** transfer.complete, transfer.downloaded, or transfer.expired events occur
**Then** a POST request is sent to the registered URL with event type, transfer ID, and metadata (FR51)
**And** webhook delivery retries 3 times with exponential backoff on failure (5s, 30s, 5m)
**And** webhook payloads include a signature header for verification
**And** developers can list and delete registered webhooks

### Story 8.4: Build Embeddable Upload Widget

As a developer,
I want to embed the NigeriaTransfer upload widget in my web application,
So that my users can upload files with resumable uploads without leaving my app.

**Acceptance Criteria:**

**Given** a developer includes the embeddable widget script
**When** the widget is initialized with an API key and container element
**Then** a self-contained upload widget renders with drag-and-drop, progress, pause/resume (FR50)
**And** the widget communicates upload completion via JavaScript callbacks and registered webhooks
**And** the widget respects CORS from any origin for API v1 endpoints
**And** the widget is customizable: colors, text, and upload limits via configuration

### Story 8.5: Build API Documentation Page

As a developer,
I want comprehensive API documentation at /docs/api,
So that I can understand endpoints, authentication, rate limits, and integrate quickly.

**Acceptance Criteria:**

**Given** a developer navigates to /docs/api
**When** the page loads
**Then** it documents all public API v1 endpoints with method, URL, description, request/response examples, and error codes (FR55)
**And** authentication is explained: API key generation, Bearer token format, rate limits per tier
**And** webhook integration is documented: registration, events, payload format, signature verification
**And** embeddable widget integration is documented with code examples
**And** the page is server-side rendered for SEO

---

## Epic 9: Frontend & Design System

The application presents a polished, culturally resonant interface with Nigerian art backgrounds, lightweight mode for data savings, dark mode, and a consistent design language built on the specified design tokens and components.

### Story 9.1: Implement Design Token System and Tailwind Configuration

As a developer,
I want design tokens (colors, typography, spacing, shadows, border radius) configured in Tailwind CSS 4,
So that all components use consistent, themeable values.

**Acceptance Criteria:**

**Given** the Tailwind configuration is set up
**When** any component uses design tokens
**Then** the Nigerian green palette (#008751 with 50-900 scale), charcoal, gold, and error-red are available as Tailwind utilities (UX-DR1)
**And** semantic color tokens (bg-primary, text-primary, border, surface-overlay) map correctly for light and dark modes
**And** the system font stack (no web fonts) is configured as the default (UX-DR2)
**And** the type scale (display through caption) is available as Tailwind utilities
**And** the 8px spacing system (space-1 through space-16) is configured (UX-DR3)
**And** border radius tokens (sm, md, lg, xl, full) and shadow tokens (sm, md, lg, xl) are available (UX-DR4)
**And** button variants (Primary, Secondary, Ghost, Danger, Gold) are implemented as reusable components with proper hover/active/focus states and 44px min height on mobile

### Story 9.2: Implement Background Wallpaper System with Artist Credits

As a user,
I want to see beautiful full-bleed Nigerian artwork as the page background with artist credit,
So that the platform feels culturally resonant and supports Nigerian artists.

**Acceptance Criteria:**

**Given** the homepage or download page loads with Lightweight Mode off
**When** the BackgroundWallpaper component renders
**Then** a full-bleed Nigerian art photograph fills the viewport, lazy-loaded (FR56)
**And** the wallpaper rotates from the wallpapers table (10-15 images at launch)
**And** a fixed-bottom artist credit bar (32px height, semi-transparent overlay) shows "Background by [Artist Name] -- View their work" with link (FR61)
**And** wallpaper images are cached at the CDN with 24-hour TTL
**And** the upload widget/download card uses frosted glass overlay (surface-overlay token)

### Story 9.3: Implement Lightweight Mode

As a mobile user on metered data,
I want lightweight mode to disable backgrounds, animations, and previews by default,
So that I save expensive data while still using all functionality.

**Acceptance Criteria:**

**Given** a user is on a mobile device (<768px)
**When** the page loads for the first time
**Then** Lightweight Mode is ON by default (FR58)
**And** backgrounds are replaced with solid color (bg-primary), file previews show SVG icons only, all animations are disabled, and image-heavy sections are text-only (FR57)
**And** a LightweightToggle in the header shows leaf/image icon with tooltip and green dot when active (UX-DR14)
**And** toggling is instant (no page reload) via CSS classes on body and React state
**And** preference persists in localStorage
**And** the toggle respects prefers-reduced-data media query and Save-Data HTTP client hint where supported
**And** QR codes, progress bars, text content, and all functionality remain fully operational

### Story 9.4: Implement Dark Mode

As a user,
I want dark mode that auto-detects my system preference with a manual toggle,
So that I can use the app comfortably in low-light environments and save AMOLED battery.

**Acceptance Criteria:**

**Given** a user visits the site
**When** their system preference is prefers-color-scheme: dark
**Then** dark mode activates automatically (FR59)
**And** the DarkModeToggle in the header allows cycling: Light / Dark / System
**And** dark mode maps all semantic tokens: bg-primary (#1A1A2E), text-primary (#FFFFFF), borders, inputs, overlays per the UX spec (UX-DR15)
**And** preference persists in localStorage and overrides system preference
**And** dark mode with Lightweight Mode ON uses solid #1A1A2E background (highest contrast for AMOLED screens)
**And** dark mode with Lightweight Mode OFF uses dark frosted glass overlay on wallpaper

### Story 9.5: Implement Bandwidth Estimator

As a user about to upload files,
I want to see an estimated upload time before I start,
So that I can decide whether to proceed on my current connection or wait for WiFi.

**Acceptance Criteria:**

**Given** files are selected in the upload widget
**When** the user has not yet clicked "Transfer"
**Then** a small test upload (~100KB) probes the server at /api/upload/probe (FR60)
**And** the estimated time is displayed: "Estimated time: ~8 minutes on your connection"
**And** the estimate is shown below the Transfer button
**And** if measured speed during upload differs significantly from estimate, the ETA updates
**And** the BandwidthEstimator component (UX-DR16) handles the probe request and computation

### Story 9.6: Build Responsive Layout Adaptations

As a user on any device,
I want the interface to adapt correctly to mobile (360px), tablet (768px), and desktop (1024px+),
So that the experience is optimized for my screen size.

**Acceptance Criteria:**

**Given** the app is viewed on different screen sizes
**When** breakpoints are crossed
**Then** the upload widget is full-width (minus 32px padding) on mobile, 480px centered on tablet, and 480px left-offset on desktop (UX-DR19)
**And** the dashboard uses bottom tab bar on mobile, collapsed sidebar on tablet, expanded sidebar on desktop
**And** download page preview thumbnails use 2/3/4 column grids across breakpoints
**And** pricing cards stack vertically on mobile, 3-column grid on tablet/desktop
**And** ad banners use responsive IAB sizes (320x50 mobile, 468x60 tablet, 728x90 desktop)
**And** all interactive elements maintain 44x44px minimum touch targets on mobile (NFR21)

---

## Epic 10: Offline & Resilience

Users on unreliable connections can queue uploads offline, recover from browser crashes, and see meaningful connection status feedback, ensuring no upload progress is ever lost silently.

### Story 10.1: Implement Upload Session Persistence in localStorage

As a user whose browser crashes or page refreshes mid-upload,
I want my upload session to be preserved and resumable,
So that I never lose upload progress due to browser issues.

**Acceptance Criteria:**

**Given** an upload is in progress
**When** the browser crashes or page is refreshed
**Then** tus upload URLs, file offsets, transfer ID, and file list are stored in localStorage (FR67)
**And** on reopening the page, the upload widget detects the saved session and shows "Resume upload?" with file list and progress
**And** clicking resume sends HEAD requests to tus server to get current offsets and continues from the last completed chunk
**And** completed transfers are cleaned from localStorage

### Story 10.2: Implement Service Worker and App Shell Caching

As a returning user,
I want the app shell to load instantly from cache even offline,
So that I can access the upload page immediately on repeat visits.

**Acceptance Criteria:**

**Given** a user has visited the site before
**When** they return (even with no connection)
**Then** the service worker serves the cached app shell (HTML, CSS, JS, icons) instantly (FR68)
**And** the web app manifest enables "Add to Home Screen" on mobile
**And** the service worker uses a cache-first strategy for static assets and network-first for API calls
**And** the cached upload page is functional for file selection (upload queued until online)

### Story 10.3: Implement Offline Upload Queue with Background Sync

As a user who selects files while offline or on an unstable connection,
I want my files queued and automatically uploaded when connectivity is restored,
So that I can prepare my transfer and let it complete in the background.

**Acceptance Criteria:**

**Given** a user selects files while offline or connection drops before upload starts
**When** connectivity is restored
**Then** queued files automatically begin uploading via the tus protocol (FR69)
**And** the UI shows connection quality indicator: green (good), yellow (unstable), red (offline) with "Reconnecting..." and "Resuming..." states (FR70)
**And** background sync via service worker continues uploads even if the browser tab is minimized
**And** users receive a notification (via service worker) when the queued upload completes

---

## Epic 11: Custom Branding (Business Tier)

Business tier users can customize their transfer download pages with company branding, creating a professional, white-label-like experience for their recipients.

### Story 11.1: Implement Custom Branding Settings

As a Business tier user,
I want to upload my company logo, set brand colors, and upload a custom background image,
So that my download pages look professional and on-brand.

**Acceptance Criteria:**

**Given** a Business tier user navigates to Dashboard > Settings > Branding
**When** they upload a logo, select brand colors, and upload a background image
**Then** the logo (max 500KB, PNG/SVG) is stored on R2 and displayed in the download card header for their transfers (FR71)
**And** brand colors (primary accent hex code) are applied to CTA buttons and accent elements on their download pages (FR72)
**And** a custom background image (max 5MB, JPEG/PNG) replaces the default Nigerian art wallpaper on their download pages (FR73)
**And** settings are stored on the User record and applied to all future transfers
**And** existing active transfers retroactively use the updated branding

### Story 11.2: Implement Branding Removal and Download Page Rendering

As a Business tier user,
I want "Powered by NigeriaTransfer" branding removed from my download pages,
So that the experience is fully white-labeled for my recipients.

**Acceptance Criteria:**

**Given** a Business tier user has branding configured
**When** a recipient views the download page for one of their transfers
**Then** the footer "Powered by NigeriaTransfer" text is not rendered (FR74)
**And** the custom logo appears in the card header instead of the NigeriaTransfer logo
**And** custom brand colors apply to the primary CTA button and accent elements
**And** custom background replaces the default wallpaper
**And** the NigeriaTransfer CTA ("Send your own files") still appears at the bottom of the page

---

## Epic 12: SEO & Marketing Pages

The platform serves optimized static pages, SEO landing pages, pricing comparison, and an artist gallery to drive organic traffic, build trust, and convert visitors.

### Story 12.1: Build Static Pages (About, Privacy, Terms, Contact)

As a visitor,
I want to read about NigeriaTransfer, its privacy policy, terms of service, and contact information,
So that I can trust the platform with my files.

**Acceptance Criteria:**

**Given** a user navigates to /about, /privacy, /terms, or /contact
**When** the page loads
**Then** /about displays: "Built in Nigeria, for Nigeria" hero, mission statement, and "Start sending files" CTA (FR79)
**And** /privacy is NDPA-compliant with sections on data collection, processing, storage, third parties, user rights, retention, and breach notification
**And** /terms covers acceptable use, prohibited content (illegal, malware, copyright infringement), liability, account termination, and payment terms (FR91)
**And** /contact has a form (name, email, subject, message), support email, and WhatsApp Business link
**And** all pages are server-side rendered with proper SEO meta tags

### Story 12.2: Build Pricing Page

As a potential customer,
I want to compare Free, Pro, and Business tiers with clear Naira pricing,
So that I can choose the right plan for my needs.

**Acceptance Criteria:**

**Given** a user navigates to /pricing
**When** the page loads
**Then** three tier cards display: Free (NGN 0), Pro (NGN 2,000/month with "Popular" badge and green border), Business (NGN 10,000/month) (FR81)
**And** each card shows: max file size, expiry, download limit, password, ads, dashboard, file requests, custom branding, API access, support level
**And** a full-width responsive feature comparison table (horizontal scroll on mobile with sticky first column) lists every feature grouped by category
**And** CTAs: "Start Free" / "Upgrade to Pro" / "Contact Sales"
**And** payment methods note: "Pay with card, bank transfer, or USSD via Paystack"
**And** FAQ section with expandable accordion items (is it really free?, how do I pay?, can I cancel?, annual pricing?)
**And** the page includes schema markup for SoftwareApplication

### Story 12.3: Build Artists Gallery Page

As a visitor,
I want to see the featured Nigerian artists whose work appears as backgrounds,
So that I can discover and support Nigerian artists.

**Acceptance Criteria:**

**Given** a user navigates to /artists
**When** the page loads
**Then** a grid of featured artworks displays with: image thumbnail, artist name, artwork title, and "View Portfolio" link for each (FR80)
**And** a CTA appears: "Want your art featured? Contact us"
**And** artwork data is sourced from the wallpapers table

### Story 12.4: Build SEO Landing Pages and Implement Sitemap

As a potential user searching for file transfer solutions in Nigeria,
I want to find NigeriaTransfer through search engines via targeted landing pages,
So that the platform appears in relevant Nigerian search queries.

**Acceptance Criteria:**

**Given** search engine crawlers or users access the SEO pages
**When** /send-large-files-nigeria and /wetransfer-alternative-nigeria load
**Then** each page has: H1 with target keyword, value proposition, hero CTA, problem/solution narrative, feature highlights, comparison table, "How it works" section, FAQ with schema markup, and bottom CTA (FR84)
**And** sitemap.xml is generated and served listing all public pages (FR82)
**And** robots.txt allows search engine crawling of public pages
**And** Open Graph meta tags are present on all public pages for social sharing (FR82)
**And** all SEO pages are server-side rendered with FCP <3s on mobile 3G (NFR3)

---

## Epic 13: Content Moderation & Admin

The platform provides basic content moderation capabilities with abuse reporting and an admin interface for managing reported content.

### Story 13.1: Implement Abuse Reporting

As a download page visitor,
I want to report a transfer that contains inappropriate or illegal content,
So that the platform can take action to protect users.

**Acceptance Criteria:**

**Given** a user is viewing a download page
**When** they click "Report Abuse"
**Then** a form appears asking for reason (dropdown: illegal content, malware, copyright, other) and optional details (FR89)
**And** the report is submitted and stored with the transfer ID, reporter details, and timestamp
**And** the reporter sees confirmation: "Report submitted. We typically review within 24 hours."
**And** abuse reports are processed within 24 hours (NFR41)

### Story 13.2: Build Admin Interface for Transfer Management

As an administrator,
I want to view abuse reports and disable/delete reported transfers,
So that I can enforce the terms of service and protect users.

**Acceptance Criteria:**

**Given** an admin user accesses the admin interface
**When** they review the abuse reports queue
**Then** they see a list of pending reports with: transfer details, report reason, reporter info, and timestamp
**And** they can disable a transfer (status -> DELETED, R2 objects retained temporarily) within 5 minutes (NFR42) (FR90)
**And** they can permanently delete a transfer (cascade delete DB records + R2 objects)
**And** the admin interface is protected by authentication and admin role check
**And** admin actions are logged for audit trail

---

## Epic 14: Daily Limits & Tier Enforcement

The system enforces daily transfer creation caps per tier and displays clear messaging when limits are reached, preventing abuse while encouraging upgrades.

### Story 14.1: Implement Daily Transfer Limits

As the system,
I want to enforce daily transfer creation caps (10 free, 100 Pro, 500 Business),
So that resources are protected from abuse and heavy users are encouraged to upgrade.

**Acceptance Criteria:**

**Given** a user attempts to create a transfer
**When** the daily count for their tier is checked
**Then** free users are limited to 10 transfers per day (FR85)
**And** Pro users are limited to 100 transfers per day (FR86)
**And** Business users are limited to 500 transfers per day (FR87)
**And** the day resets at midnight WAT (West Africa Time)
**And** count includes both completed and in-progress transfers created that day

### Story 14.2: Implement Daily Limit Messaging and Upgrade Prompts

As a user who has reached their daily transfer limit,
I want a clear message explaining the limit and how to get more transfers,
So that I understand why I cannot create another transfer and know my options.

**Acceptance Criteria:**

**Given** a user has reached their daily transfer limit
**When** they attempt to create another transfer
**Then** the API returns HTTP 429 with error code RATE_LIMITED and message: "You've reached your daily limit of {N} transfers. Upgrade for more." (FR88)
**And** the upload widget displays the limit message with the time until reset and an upgrade CTA
**And** free users see: "Upgrade to Pro for 100 transfers/day (NGN 2,000/month)"
**And** Pro users see: "Upgrade to Business for 500 transfers/day (NGN 10,000/month)"
**And** Business users see: "Contact us for higher limits"

---

## Validation Summary

### FR Coverage Verification

All 91 functional requirements (FR1-FR91) are covered by at least one story:

- **FR1-FR8:** Stories 2.1, 2.2, 2.3, 2.5
- **FR9-FR11:** Stories 3.4, 3.5
- **FR12-FR17:** Stories 3.1, 3.2, 3.3, 3.6
- **FR18-FR19:** Stories 1.5, 1.8
- **FR20-FR26:** Stories 4.1, 4.2, 4.3, 4.4
- **FR27-FR34:** Stories 5.1, 5.2, 5.3, 5.4
- **FR35-FR39:** Stories 7.1, 7.2, 7.3
- **FR40-FR47:** Stories 6.1, 6.2, 6.3, 6.4, 6.5
- **FR48-FR55:** Stories 8.1, 8.2, 8.3, 8.4, 8.5
- **FR56-FR61:** Stories 9.2, 9.3, 9.4, 9.5
- **FR62-FR66:** Stories 1.5, 1.6, 1.7, 1.8, 3.2
- **FR67-FR70:** Stories 10.1, 10.2, 10.3
- **FR71-FR74:** Stories 11.1, 11.2
- **FR75-FR78:** Story 3.7
- **FR79-FR84:** Stories 12.1, 12.2, 12.3, 12.4
- **FR85-FR88:** Stories 14.1, 14.2
- **FR89-FR91:** Stories 13.1, 13.2, 12.1

### NFR Coverage Verification

All 42 non-functional requirements are addressed through acceptance criteria across stories:

- **Performance (NFR1-6, 34-37):** Stories 2.1, 3.1, 3.3, 2.2, 9.6, 12.4
- **Security (NFR7-16):** Stories 1.2, 3.4, 2.1, 3.2
- **Scalability (NFR17-20):** Stories 1.2, 1.3, 2.4
- **Accessibility (NFR21-25):** Stories 9.1, 9.6, 3.1 (throughout all UI stories)
- **Reliability (NFR26-29):** Stories 1.7, 1.5, 1.6, 6.2
- **Integration (NFR30-33):** Stories 6.2, 4.2, 1.3, 8.2
- **Data Governance (NFR38-40):** Stories 1.5, 5.4, 1.6
- **Content Moderation (NFR41-42):** Stories 13.1, 13.2

### UX-DR Coverage Verification

All 25 UX design requirements are covered:

- **UX-DR1-4:** Story 9.1
- **UX-DR5-8:** Stories 2.3, 3.5, 4.1
- **UX-DR9-12:** Stories 3.1, 3.6, 3.4, 6.4
- **UX-DR13-16:** Stories 9.2, 9.3, 9.4, 9.5
- **UX-DR17-19:** Stories 5.4, 12.2, 9.6
- **UX-DR20-23:** Accessibility requirements throughout UI stories
- **UX-DR24:** Stories 3.1, 12.1
- **UX-DR25:** Story 6.5

### Dependency Flow

```
Epic 1 (Infrastructure) ─────────────────────────────────────────────────
    │
    ├── Epic 2 (Core Transfer) ──────────────────────────────────────────
    │       │
    │       ├── Epic 3 (File Mgmt & Download) ───────────────────────────
    │       │       │
    │       │       ├── Epic 4 (Sharing & Distribution) ─────────────────
    │       │       │
    │       │       └── Epic 11 (Custom Branding) ← also depends on Epic 6
    │       │
    │       ├── Epic 10 (Offline & Resilience) ──────────────────────────
    │       │
    │       ├── Epic 13 (Content Moderation) ────────────────────────────
    │       │
    │       └── Epic 14 (Daily Limits) ← also depends on Epic 6 ────────
    │
    ├── Epic 5 (Auth & User System) ─────────────────────────────────────
    │       │
    │       ├── Epic 6 (Subscriptions & Payments) ───────────────────────
    │       │
    │       ├── Epic 7 (File Request Portals) ← also depends on Epic 2 ─
    │       │
    │       └── Epic 8 (Public API) ← also depends on Epic 2 ───────────
    │
    └── Epic 9 (Design System) ← parallel with Epics 2-5 ───────────────
            │
            └── Epic 12 (SEO & Marketing) ───────────────────────────────
```

### Story Size Summary

| Epic | Stories | Complexity |
|------|---------|------------|
| 1. Infrastructure & DevOps | 8 | L |
| 2. Core Transfer Engine | 5 | XL |
| 3. File Management & Download | 7 | XL |
| 4. Sharing & Distribution | 4 | M |
| 5. Authentication & User System | 4 | L |
| 6. Subscriptions & Payments | 5 | L |
| 7. File Request Portals | 3 | M |
| 8. Public API | 5 | L |
| 9. Frontend & Design System | 6 | L |
| 10. Offline & Resilience | 3 | M |
| 11. Custom Branding | 2 | S |
| 12. SEO & Marketing Pages | 4 | M |
| 13. Content Moderation & Admin | 2 | S |
| 14. Daily Limits & Tier Enforcement | 2 | S |
| **Total** | **60 stories** | |

Note: While 60 stories are defined, each story has substantial scope with multiple acceptance criteria. Individual stories can be further decomposed into sub-tasks (1-3 day work items) during sprint planning, yielding 120-180 implementation tasks suitable for developer agents. The stories as written represent cohesive, user-value-delivering units that are testable and deployable.
