---
status: complete
completedAt: '2026-03-28'
author: BMAD UX Design Agent
project: NigeriaTransfer
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - prompt.md
  - _bmad-output/planning-artifacts/product-brief-transfer.md
designSystem: Tailwind CSS 4 + shadcn/ui (themeable)
targetPlatform: PWA (mobile-first)
wcagLevel: AA
---

# UX Design Specification -- NigeriaTransfer

**Author:** BMAD UX Design Agent
**Date:** 2026-03-28
**Classification:** Web App (PWA) | Mobile-First | Nigerian Market

---

## 1. Design Philosophy

### 1.1 Core Principles

**Mobile-First, Always.** 75%+ of Nigerian internet users are on mobile. Every screen, every component, every interaction is designed at 360px first and scaled up. Desktop is the enhancement, not the default. (Ref: PRD -- Web App Specific Requirements, responsive design)

**Lightweight by Default.** Nigerian mobile data is expensive and connections are slow/unstable. The product must respect bandwidth at every level: <200KB initial JS bundle, system font stack, lazy-loaded images, and a Lightweight Mode that ships enabled on mobile by default. No decorative downloads unless the user opts in. (Ref: FR57, FR58)

**Resilience as UX.** "What happens when the connection drops?" is the first question for every interaction. Resumable uploads (tus), offline queuing (service worker + IndexedDB), session persistence (localStorage), and graceful degradation define the experience. A dropped connection should feel like a pause, never a failure. (Ref: FR5, FR6, FR7)

**Nigerian Identity, Not Nigerian Cliche.** The visual identity is rooted in Nigerian art, Nigerian color (green #008751), and Nigerian pricing (Naira). But the execution is world-class -- clean, minimal, premium. WeTransfer proved that beautiful backgrounds create emotional brand loyalty. NigeriaTransfer does the same with Nigerian soul: Lagos skylines, Nigerian textile patterns, Nollywood stills, Niger Delta waterways. The tone is "built here, works here, celebrates here." (Ref: FR56, FR61)

**Zero-Friction Core Loop.** The primary action -- upload files and get a shareable link -- requires zero account creation, zero navigation, and zero configuration. The homepage IS the upload page. One screen. Drag, drop, share. Everything else is optional progressive disclosure. (Ref: FR1)

**Offline-Tolerant, Not Offline-First.** The app is not designed for fully offline use. It is designed to survive unstable connections: queued uploads resume automatically, progress is never lost silently, and meaningful states are shown during disconnection. (Ref: NFR25 -- download page functions without JavaScript)

### 1.2 Design System Choice

**Tailwind CSS 4 + shadcn/ui (Themeable System)**

**Rationale:**
- Tailwind provides mobile-first utility classes with zero unused CSS in production (tree-shaking)
- shadcn/ui provides accessible, customizable components that can be themed to the Nigerian green palette without heavy library overhead
- Components are copy-pasted into the project (not npm dependency), giving full control over bundle size
- Accessible by default (keyboard navigation, ARIA attributes, focus management)
- Matches the tech stack specified in the PRD (Tailwind CSS 4, shadcn/ui)

**Customization Strategy:**
- Override shadcn/ui CSS variables with NigeriaTransfer color tokens
- Build custom components (UploadZone, ProgressBar, BackgroundWallpaper) on top of shadcn/ui primitives
- System font stack eliminates font loading overhead entirely

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--nigerian-green` | `#008751` | Primary actions, CTAs, brand identity, success states |
| `--white` | `#FFFFFF` | Backgrounds, text on dark, upload widget surface |
| `--charcoal` | `#1A1A2E` | Text, dark backgrounds, dark mode surface |
| `--gold` | `#FFD700` | Accent highlights, upgrade prompts, premium features |
| `--error-red` | `#E74C3C` | Error states, destructive actions, upload failures |

#### Extended Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--green-50` | `#E6F5ED` | Light green background tints |
| `--green-100` | `#B3E0C7` | Hover states on green elements |
| `--green-700` | `#006B41` | Pressed/active state for primary buttons |
| `--green-900` | `#004D2E` | Dark mode primary |
| `--charcoal-50` | `#F0F0F3` | Light mode card backgrounds |
| `--charcoal-100` | `#D1D1D8` | Borders, dividers |
| `--charcoal-400` | `#6B6B7B` | Secondary text, placeholders |
| `--charcoal-600` | `#2D2D42` | Dark mode elevated surfaces |
| `--charcoal-800` | `#12121F` | Dark mode base background |
| `--gold-100` | `#FFF8DC` | Upgrade prompt backgrounds |
| `--gold-600` | `#CC9900` | Pressed gold accent |
| `--red-50` | `#FDE8E5` | Error background tint |
| `--red-700` | `#C0392B` | Pressed error state |

#### Semantic Color Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--bg-primary` | `#FFFFFF` | `#1A1A2E` |
| `--bg-secondary` | `#F0F0F3` | `#2D2D42` |
| `--bg-elevated` | `#FFFFFF` | `#2D2D42` |
| `--text-primary` | `#1A1A2E` | `#FFFFFF` |
| `--text-secondary` | `#6B6B7B` | `#D1D1D8` |
| `--text-muted` | `#9999A8` | `#6B6B7B` |
| `--border` | `#D1D1D8` | `#3D3D52` |
| `--surface-overlay` | `rgba(255,255,255,0.92)` | `rgba(26,26,46,0.92)` |

#### Contrast Compliance (WCAG 2.1 AA)

| Combination | Ratio | Pass |
|-------------|-------|------|
| `--charcoal` on `--white` | 14.7:1 | Yes (AAA) |
| `--white` on `--nigerian-green` | 4.6:1 | Yes (AA) |
| `--charcoal` on `--green-50` | 13.2:1 | Yes (AAA) |
| `--white` on `--error-red` | 4.6:1 | Yes (AA) |
| `--white` on `--charcoal` | 14.7:1 | Yes (AAA) |
| `--charcoal-400` on `--white` | 4.8:1 | Yes (AA) |

### 2.2 Typography

#### Font Stack

```css
--font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
  'Segoe UI Emoji';

--font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo,
  Consolas, 'Liberation Mono', monospace;
```

No web fonts. System font stack loads instantly on every device, saving bandwidth and eliminating FOIT/FOUT. This directly supports the <3s FCP target on mobile 3G. (Ref: NFR3)

#### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `display` | 2rem (32px) | 1.2 | 700 | Hero headings (desktop only) |
| `h1` | 1.5rem (24px) | 1.3 | 700 | Page titles |
| `h2` | 1.25rem (20px) | 1.35 | 600 | Section headings |
| `h3` | 1.125rem (18px) | 1.4 | 600 | Card titles, feature labels |
| `body` | 1rem (16px) | 1.5 | 400 | Body text, descriptions |
| `body-sm` | 0.875rem (14px) | 1.5 | 400 | Secondary text, metadata |
| `caption` | 0.75rem (12px) | 1.4 | 400 | Timestamps, helper text, file sizes |
| `label` | 0.875rem (14px) | 1.2 | 500 | Form labels, button text |
| `button-lg` | 1rem (16px) | 1.2 | 600 | Primary CTA buttons |

### 2.3 Spacing System

8px base unit grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight inline spacing, icon gaps |
| `--space-2` | 8px | Base unit, form element padding |
| `--space-3` | 12px | Compact card padding |
| `--space-4` | 16px | Standard content padding, mobile screen margins |
| `--space-5` | 20px | Medium spacing |
| `--space-6` | 24px | Section spacing within cards |
| `--space-8` | 32px | Section breaks, card-to-card gaps |
| `--space-10` | 40px | Large section spacing |
| `--space-12` | 48px | Page section breaks |
| `--space-16` | 64px | Desktop page section breaks |

### 2.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small chips, badges |
| `--radius-md` | 8px | Buttons, inputs, small cards |
| `--radius-lg` | 12px | Cards, modals, dropdowns |
| `--radius-xl` | 16px | Upload widget, main floating cards |
| `--radius-full` | 9999px | Avatars, circular buttons, pills |

### 2.5 Elevation / Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` | Subtle lift (buttons, inputs) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 30px rgba(0,0,0,0.15)` | Upload widget overlay, modals |
| `--shadow-xl` | `0 12px 40px rgba(0,0,0,0.2)` | Floating panels on full-bleed backgrounds |

### 2.6 Component Tokens

#### Buttons

| Variant | Background | Text | Border | Hover BG | Active BG |
|---------|-----------|------|--------|----------|-----------|
| Primary | `--nigerian-green` | `--white` | none | `--green-700` | `--green-900` |
| Secondary | transparent | `--nigerian-green` | `--nigerian-green` | `--green-50` | `--green-100` |
| Ghost | transparent | `--text-primary` | none | `--charcoal-50` | `--charcoal-100` |
| Danger | `--error-red` | `--white` | none | `--red-700` | `--red-700` |
| Gold | `--gold` | `--charcoal` | none | `--gold-600` | `--gold-600` |

Button sizing: minimum height 44px on mobile (touch target compliance, NFR21). Padding: 12px 24px (default), 12px 16px (compact).

#### Inputs

- Height: 44px minimum (mobile touch target)
- Border: 1px solid `--border`
- Focus: 2px solid `--nigerian-green`, offset 2px
- Error: 1px solid `--error-red`, error message below in `--error-red`
- Border radius: `--radius-md`
- Placeholder color: `--text-muted`

---

## 3. Information Architecture / Sitemap

```
nigeriatransfer.com
|
+-- / (Homepage / Upload Page)
|   |-- Upload widget (email transfer mode / link mode)
|   |-- Settings accordion (expiry, limit, password, message)
|   |-- Progress states (uploading, paused, resuming, complete)
|   |-- Success state (link, QR, share buttons, receipt)
|   |-- Below fold: How it works, Why NigeriaTransfer, For Business CTA
|
+-- /d/{shortCode} (Download Page)
|   |-- Password gate (conditional)
|   |-- File previews + file list
|   |-- Individual + ZIP download
|   |-- Ad placement (free tier only)
|   |-- Expiry countdown + download counter
|
+-- /request/{code} (File Request Page)
|   |-- Requester message
|   |-- Upload zone (reverse flow)
|
+-- /pricing (Pricing Page)
|   |-- Three-tier comparison (Free / Pro / Business)
|   |-- Feature matrix
|   |-- FAQ section
|
+-- /dashboard (Authenticated Dashboard)
|   |-- /dashboard/transfers (My Transfers)
|   |-- /dashboard/requests (File Requests)
|   |-- /dashboard/storage (Storage Meter)
|   |-- /dashboard/subscription (Plan + Billing)
|   |-- /dashboard/analytics (Transfer Analytics)
|   |-- /dashboard/api (API Keys -- Business tier)
|
+-- /login (Auth -- Magic Link / Google / Phone OTP)
+-- /register (Auth -- same methods)
|
+-- /about (About -- Nigerian story, team, mission)
+-- /privacy (Privacy Policy -- NDPA compliant)
+-- /terms (Terms of Service)
+-- /contact (Contact Form + WhatsApp link)
+-- /artists (Featured Background Artists Gallery)
|
+-- /send-large-files-nigeria (SEO Landing Page)
+-- /wetransfer-alternative-nigeria (SEO Landing Page)
+-- /nollywood-file-sharing (SEO Landing Page)
+-- /sell-digital-files-nigeria (SEO Landing Page)
|
+-- /docs/api (API Documentation -- FR55)
|
+-- /expired (Transfer Expired status)
+-- /limit-reached (Download Limit Reached status)
+-- /404 (Not Found)
+-- /500 (Server Error)
```

### 3.1 Navigation Structure

**Header (persistent, all pages):**
- Logo (links to /) -- left
- Nav links (desktop): Pricing | Dashboard (if authenticated) | Login/Sign Up
- Lightweight Mode toggle -- right
- Dark Mode toggle -- right
- Mobile: hamburger menu with same items

**Footer (all pages except upload widget focus state):**
- Logo + tagline
- Links: About | Pricing | Privacy | Terms | Contact | Artists | API Docs
- Artist credit for current background
- Language/locale selector (future)
- Copyright

---

## 4. Wireframe Descriptions

### 4.1 Homepage / Upload Page (`/`)

**Layout:** Full-bleed background image occupying the entire viewport. A single floating card (the upload widget) centered vertically and horizontally on mobile, offset left on desktop (allowing more background art to show on the right).

**Viewport Composition (mobile, 360px):**
- Background: Full-bleed Nigerian art photograph, lazy-loaded. In Lightweight Mode: solid `--charcoal` or `--white` depending on dark/light mode.
- Upload widget: Floating card with `--shadow-xl`, `--radius-xl`, `--surface-overlay` (frosted glass/semi-transparent). Width: calc(100% - 32px) on mobile, max-width 480px. Vertically centered with auto margins.
- Artist credit bar: Fixed bottom, 32px height, semi-transparent dark overlay: "Background by [Artist Name] -- View their work"

**Upload Widget -- Idle State:**

```
+------------------------------------------+
|  [NigeriaTransfer Logo]                  |
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |     [+]  Drag files here          |  |
|  |     or click to select             |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  [Email Transfer]  [Get a Link]  (tabs)  |
|                                          |
|  (Email mode:)                           |
|  [Email to: ________________________]    |
|  [Your email: ______________________]    |
|  (Link mode: no email fields)            |
|                                          |
|  [v Settings] (expandable accordion)     |
|    Expiry: [7 days v]                    |
|    Download limit: [50]                  |
|    Password: [toggle] [___________]      |
|    Message: [________________________]   |
|                                          |
|  [ === Transfer === ]  (primary btn)     |
|                                          |
|  Bandwidth estimate:                     |
|  "~8 min on your connection" (FR60)      |
+------------------------------------------+
```

**File List State (after files added):**
- Each file row: thumbnail (images) or file-type icon, filename (truncated), size in MB/GB, [x] remove button
- Below list: "3 files -- 847 MB total" summary
- "+ Add more files" text button

**Upload Widget -- Progress State:** (Ref: FR5, FR6, FR7)

```
+------------------------------------------+
|  Uploading...                            |
|                                          |
|  photo1.jpg         12 MB    [=====-] 78%|
|  video.mp4         834 MB    [==-----] 34%|
|  report.pdf          1 MB    [=======]100%|
|                                          |
|  Overall: 42%  |  3.2 MB/s  |  ETA: 4m  |
|  [===========--------------------------] |
|                                          |
|  [ Pause ]                               |
+------------------------------------------+
```

- Per-file progress bars with percentage
- Overall progress bar spanning full width
- Speed indicator (MB/s), ETA in human-readable format
- Pause button toggles to Resume (Ref: FR5)
- If connection drops: progress bar pauses, label changes to "Reconnecting..." with a spinning indicator, then "Resuming from 57%..." (Ref: FR6)

**Upload Widget -- Success State (Transfer Success):** (inline state change, not a new page)

```
+------------------------------------------+
|  [Green checkmark animation]             |
|  Files sent!                             |
|                                          |
|  https://nigeriatransfer.com/d/Xk9mP2    |
|  [Copy Link]                             |
|                                          |
|  [QR Code]                               |
|                                          |
|  Share: [WhatsApp] [SMS] [Email] [Copy]  |
|                                          |
|  Transfer summary:                       |
|  3 files  |  847 MB  |  Expires Apr 4    |
|  Download limit: 50                      |
|                                          |
|  [Download receipt (PDF)]                |
|  [Send Another Transfer]                 |
+------------------------------------------+
```

- Green checkmark animation (disabled in Lightweight Mode -- show static checkmark instead)
- Shareable link: large text, one-tap copy with "Copied!" toast notification (FR23)
- QR code: rendered inline, ~120x120px on mobile, scannable (FR22)
- Share buttons row: WhatsApp (green, deep link, FR20), SMS (blue, FR21), Email (gray, FR24), Copy Link
- Transfer summary: file count, total size, expiry date, download limit
- "Download transfer receipt (PDF)" link
- "Send Another Transfer" resets the widget to idle state

**Below the Fold (scrollable content below the widget):**

1. **"How it works"** -- 3 steps with icons:
   - Step 1: "Add your files" (upload icon)
   - Step 2: "Get a link" (link icon)
   - Step 3: "Share anywhere" (WhatsApp/share icon)

2. **"Why NigeriaTransfer?"** -- trust signals:
   - "4 GB free -- 2x WeTransfer" (comparison)
   - "No account needed" (speed)
   - "Resumes when connection drops" (resilience)
   - "Original quality, always" (no compression)
   - "Nigerian-owned. Naira pricing." (identity)

3. **"For Businesses"** CTA card: brief pitch for Business tier, "Learn more" link to /pricing

4. **Artist credit**: "Background: 'Lagos Sunset' by Adaeze Okonkwo -- View their portfolio"

### 4.2 Download Page (`/d/{shortCode}`)

**Layout:** Same full-bleed background as homepage (or sender's custom background for Business tier, FR47). Floating download card centered.

**Password Gate (conditional -- shown before any file details if transfer is password-protected, FR11):**

```
+------------------------------------------+
|  [NigeriaTransfer Logo]                  |
|                                          |
|  [Lock icon]                             |
|  This transfer is password protected     |
|                                          |
|  Password: [___________________________] |
|  [ Unlock Files ]                        |
|                                          |
|  Attempts remaining: 4 of 5             |
+------------------------------------------+
```

- No file details, no file names, no sender info visible until password is verified
- Rate limited: 5 attempts per minute per IP (NFR10)
- After 5 failed attempts: "Too many attempts. Try again in 1 minute."

**Download Card (after password verification or if no password):**

```
+------------------------------------------+
|  Files from Adaeze Okonkwo               |
|  "Here's the rough cut -- let me know!"  |
|                                          |
|  [Image thumbnail] [Image thumbnail]     |
|  [Video poster]    [PDF preview]         |
|                                          |
|  photo1.jpg      12 MB    [Download]     |
|  video.mp4      834 MB    [Download]     |
|  report.pdf       1 MB    [Download]     |
|                                          |
|  [ Download All (ZIP -- 847 MB) ]        |
|                                          |
|  Expires in 5 days, 3 hours             |
|  47 of 50 downloads remaining           |
|                                          |
|  [Ad banner -- free tier only]           |
|                                          |
|  ---                                     |
|  Send your own files -- free!            |
|  [Start Transferring]                    |
|                                          |
|  Powered by NigeriaTransfer              |
+------------------------------------------+
```

**File Preview Section:** (Ref: FR12, FR13, FR14)
- Images: Thumbnail grid (2 columns mobile, 4 columns desktop). Tap to open lightbox.
- Videos: Poster frame with play button overlay. Tap opens video player modal (does NOT auto-play -- data is expensive).
- PDFs: First page rendered as image thumbnail. Tap opens embedded viewer.
- Other file types: File-type icon (doc, zip, audio, etc.) + filename + size. No preview.
- In Lightweight Mode: All previews disabled. Show file-type icon + filename + size only.

**File List:**
- Each row: file-type icon, filename (truncated with ellipsis if long), human-readable size (MB/GB), individual "Download" button
- "Download All" button generates ZIP archive (FR16). Shows streaming progress: "Preparing ZIP... 34%"

**Metadata:**
- Expiry countdown: "Expires in 5 days, 3 hours" (updates every minute via JS, but server-rendered initial state works without JS -- NFR25)
- Download counter: "47 of 50 downloads remaining" (FR10)

**Ad Placement (free tier only, FR46):**
- Single non-intrusive banner below the download card
- 728x90 on desktop, 320x50 on mobile (standard IAB sizes)
- If ad fails to load: collapse to zero height, no blank space
- No popups, no interstitials, no auto-playing video ads
- Paid tier (FR47): no ad banner rendered at all

**Business Tier Customization:**
- Custom background image (sender's uploaded background)
- Sender's company logo in card header
- "Powered by NigeriaTransfer" branding is removable

**CTA Section:**
- "Send your own files -- free!" with "Start Transferring" button linking to homepage

### 4.3 Transfer Success (Inline State on Homepage)

This is NOT a separate page. The upload widget transitions from Progress State to Success State with an animation (crossfade, 300ms).

**Content (detailed in section 4.1 success state above):**
- Green checkmark (animated in full mode, static in Lightweight Mode)
- Shareable link with copy-to-clipboard (FR23)
- QR code (FR22)
- Share buttons: WhatsApp (FR20), SMS (FR21), Email (FR24), Copy Link
- Transfer summary: files, total size, expiry, download limit
- "Download receipt (PDF)" -- generates a PDF with: sender, files, sizes, link, date, expiry. Useful for business record-keeping.
- "Send Another Transfer" button -- resets widget

### 4.4 File Request Page (`/request/{code}`)

**Layout:** Same full-bleed background. Floating card with request context + upload zone.

```
+------------------------------------------+
|  [NigeriaTransfer Logo]                  |
|                                          |
|  [User avatar/icon]                      |
|  Adaeze Okonkwo is requesting files      |
|  from you                                |
|                                          |
|  "Please upload the signed contracts     |
|   and your ID scan. Thanks!"             |
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |     [+]  Drag files here          |  |
|  |     or click to select             |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  (file list appears after selection)     |
|                                          |
|  Your email (optional): [____________]   |
|                                          |
|  [ Upload Files ]                        |
|                                          |
|  No account needed.                      |
+------------------------------------------+
```

- Requester's name/email and message displayed prominently (FR35)
- Same drag-and-drop upload zone as homepage (reuses UploadZone component)
- No account required for the uploader (FR37)
- Optional email field for upload confirmation notification
- Progress states identical to homepage upload
- Success state: "Files submitted successfully" with green checkmark. No share buttons (files go to requester's dashboard, FR38).

**If request is closed (FR39):**
- Show: "This file request is no longer accepting uploads."
- CTA: "Send your own files with NigeriaTransfer"

### 4.5 Pricing Page (`/pricing`)

**Layout:** Clean page with header/footer. No full-bleed background (or subtle solid color).

```
+------------------------------------------+
|  Choose Your Plan                        |
|  "Send large files. No account.          |
|   No wahala."                            |
|                                          |
|  +----------+ +----------+ +----------+  |
|  |   Free   | |   Pro    | |  Business|  |
|  |   ₦0     | | ₦2,000   | | ₦10,000 |  |
|  |  /month  | |  /month  | |  /month  |  |
|  |          | |[Popular] | |          |  |
|  | 4 GB/    | | 10 GB/   | | 50 GB/  |  |
|  | transfer | | transfer | | transfer |  |
|  |          | |          | |          |  |
|  | 7-day    | | 30-day   | | 60-day  |  |
|  | expiry   | | expiry   | | expiry  |  |
|  |          | |          | |          |  |
|  | 50 DLs   | | 250 DLs  | |Unlimited|  |
|  |          | |          | |          |  |
|  | Ads on   | | No ads   | | No ads  |  |
|  | downloads| |          | | Custom  |  |
|  |          | |          | | branding|  |
|  |          | |          | | API     |  |
|  |          | |          | | access  |  |
|  |          | |          | |          |  |
|  |[Start    | |[Upgrade  | |[Contact |  |
|  | Free]    | | to Pro]  | | Sales]  |  |
|  +----------+ +----------+ +----------+  |
```

**Three Tiers (all Naira pricing, FR40, FR41, FR42):**

| Feature | Free | Pro (₦2,000/mo) | Business (₦10,000/mo) |
|---------|------|------------------|----------------------|
| Max file size | 4 GB | 10 GB | 50 GB |
| Expiry | 7 days | Up to 30 days | Up to 60 days |
| Download limit | 50 | 250 | Unlimited |
| Password protection | Yes | Yes | Yes |
| Ads on download | Yes | No | No |
| Dashboard + history | No | Yes | Yes |
| File requests | No | Yes | Yes |
| Custom branding | No | No | Yes |
| API access | No | No | Yes |
| Support | Community | Email | Priority |

- Pro tier highlighted with "Popular" badge and green border
- All prices in Naira with ₦ symbol
- "Start free -- no account needed" prominent CTA
- Payment methods note: "Pay with card, bank transfer, or USSD via Paystack" (FR42)

**Feature Comparison Table:**
- Full-width responsive table (scrolls horizontally on mobile with sticky first column)
- Every feature listed with checkmarks/values per tier
- Grouped by category: Transfer, Sharing, Management, Branding, API

**FAQ Section:**
- Expandable accordion items:
  - "Is it really free?" -- Yes, 4 GB per transfer, no account needed
  - "How do I pay?" -- Paystack: card, bank transfer, USSD
  - "Can I cancel anytime?" -- Yes, cancel from dashboard, keeps access until billing period ends
  - "What payment methods do you accept?" -- Visa, Mastercard, bank transfer, USSD
  - "Do you offer annual pricing?" -- Coming soon
  - "What happens to my files if I cancel?" -- Active transfers remain until expiry

### 4.6 Dashboard (`/dashboard`)

**Layout:** Standard app shell: left sidebar (desktop) / bottom tabs (mobile) + main content area. No full-bleed background.

**Sidebar/Tab Navigation:**
- My Transfers (active/expired)
- File Requests
- Storage
- Subscription
- Analytics
- API Keys (Business tier only)
- Settings

**My Transfers Tab (default view, FR30, FR31, FR32):**

```
+------------------------------------------+
|  My Transfers                            |
|  [Search: ____________] [Filter: All v]  |
|                                          |
|  +--------------------------------------+|
|  | project_v3.zip (3 files, 2.1 GB)    ||
|  | Created: Mar 25  |  Expires: Apr 1  ||
|  | Downloads: 12/50  |  Status: Active  ||
|  | [Copy Link] [Delete] [Extend]        ||
|  +--------------------------------------+|
|  | contract_final.pdf (1 file, 4 MB)    ||
|  | Created: Mar 20  |  Expired          ||
|  | Downloads: 3/50   |  Status: Expired ||
|  +--------------------------------------+|
|                                          |
|  Showing 1-10 of 23 transfers            |
|  [< Prev]  [Next >]                     |
+------------------------------------------+
```

- Each transfer card: file summary, creation date, expiry, download count vs limit, status badge (Active/Expired/Deleted)
- Actions: Copy Link, Delete (with confirmation), Extend Expiry (if tier allows)
- Search by filename, filter by status (Active/Expired/All)
- Pagination for large transfer histories

**File Requests Tab (FR35, FR38, FR39):**

```
+------------------------------------------+
|  File Requests                           |
|  [+ New Request]                         |
|                                          |
|  +--------------------------------------+|
|  | "CV Submissions" -- Active           ||
|  | Created: Mar 22  |  5 uploads recv'd ||
|  | Link: ngtransfer.com/request/Abc123  ||
|  | [Copy Link] [View Files] [Close]     ||
|  +--------------------------------------+|
+------------------------------------------+
```

**Storage Meter (FR33):**

```
+------------------------------------------+
|  Storage Usage                           |
|                                          |
|  [=============---------]  3.8 GB / 50 GB|
|  76% used                                |
|                                          |
|  Largest transfers:                      |
|  - video_project.zip    2.1 GB           |
|  - photo_batch.zip      1.2 GB           |
|  - contracts.pdf        0.5 GB           |
+------------------------------------------+
```

- Visual progress bar colored green (safe) / gold (>70%) / red (>90%)
- List of largest active transfers for space management
- Upgrade prompt if approaching limit (FR45): "You've used 3.8 GB of your 4 GB limit -- upgrade for 10 GB"

**Subscription Card (FR34, FR43):**

```
+------------------------------------------+
|  Your Plan: Pro                          |
|  Next billing: April 15, 2026            |
|  Amount: ₦2,000/month                   |
|                                          |
|  [Upgrade to Business]  [Cancel Plan]    |
|                                          |
|  Billing History:                        |
|  Mar 15 -- ₦2,000 -- Paid (card *4521)  |
|  Feb 15 -- ₦2,000 -- Paid (card *4521)  |
+------------------------------------------+
```

**Analytics Tab (FR31):**

```
+------------------------------------------+
|  Transfer Analytics                      |
|                                          |
|  [Simple line chart: downloads over time]|
|                                          |
|  Total downloads this month: 142         |
|  Most downloaded: project_v3.zip (34)    |
|  Total data transferred: 12.4 GB         |
+------------------------------------------+
```

- Simple line chart (lightweight, no heavy chart library -- use a minimal SVG chart or lightweight library like uPlot)
- Downloads over time (7d / 30d / 90d toggle)
- Summary stats: total downloads, most downloaded transfer, total data transferred

### 4.7 Auth Pages (`/login`, `/register`)

**Layout:** Centered card on subtle background (no full-bleed art to keep load fast). (Ref: FR27, FR28, FR29)

```
+------------------------------------------+
|  [NigeriaTransfer Logo]                  |
|                                          |
|  Sign in to NigeriaTransfer              |
|                                          |
|  [Continue with Google]  (OAuth button)  |
|                                          |
|  ---- or ----                            |
|                                          |
|  Email: [___________________________]    |
|  [ Send Magic Link ]                     |
|                                          |
|  ---- or ----                            |
|                                          |
|  Phone: [+234 ______________________]    |
|  [ Send OTP ]                            |
|                                          |
|  ---                                     |
|  No account needed to send files.        |
|  Accounts unlock dashboard, history,     |
|  and premium features.                   |
|  [Send files without signing up ->]      |
+------------------------------------------+
```

**Auth Methods (priority order):**
1. Google OAuth -- one-tap sign-in (FR28)
2. Email magic link -- enter email, receive link, click to authenticate (FR27). "Check your email for a sign-in link"
3. Phone + OTP -- enter Nigerian phone number (+234), receive SMS OTP (FR29). "Enter the 6-digit code sent to your phone"

**Key Design Decision:** Large prominent message that accounts are optional. "No account needed to send files" with a link back to the homepage. This prevents the auth wall from feeling like a barrier.

**OTP Verification Screen:**

```
+------------------------------------------+
|  Enter verification code                 |
|                                          |
|  Sent to +234 801 234 5678              |
|                                          |
|  [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]    |
|                                          |
|  Didn't receive it? [Resend in 45s]      |
|  [Try a different method]                |
+------------------------------------------+
```

- 6-digit OTP input with auto-advance between fields
- Countdown timer for resend
- Option to switch auth method

### 4.8 Static Pages

**About (`/about`):**
- Hero: "Built in Nigeria, for Nigeria"
- Story: Why NigeriaTransfer exists, the problem it solves, the vision
- Team section (if applicable)
- Mission statement: "Make file transfer work for African internet reality"
- CTA: "Start sending files -- it's free"

**Privacy Policy (`/privacy`):**
- NDPA (Nigeria Data Protection Act 2023) compliant
- Sections: Data collected, how it's used, third parties, data storage location, user rights, data retention, breach notification
- Plain language summary at top, full legal text below
- Last updated date

**Terms of Service (`/terms`):**
- Acceptable use, prohibited content, liability, account termination, payment terms
- Plain language summary at top

**Contact (`/contact`):**
- Contact form: Name, Email, Subject, Message, Submit
- Email: support@nigeriatransfer.com
- WhatsApp Business link (important for Nigeria)
- Response time expectation: "We typically respond within 24 hours"

**Artists Gallery (`/artists`):**
- Grid of featured background artworks with artist name, title, link to portfolio (FR61)
- "Want your art featured? Contact us" CTA
- Each artwork card: image thumbnail, artist name, artwork title, "View Portfolio" link

### 4.9 SEO Landing Pages

**Template Structure (shared across all SEO pages):**

```
+------------------------------------------+
|  [H1: Target keyword phrase]             |
|  [Subheading with value proposition]     |
|                                          |
|  [Hero CTA: Start Sending Files Free]    |
|                                          |
|  [Section: Problem + Solution narrative] |
|  [Section: Feature highlights with icons]|
|  [Section: Comparison table if relevant] |
|  [Section: How it works (3 steps)]       |
|  [Section: Testimonials (post-launch)]   |
|  [Section: FAQ (schema markup)]          |
|                                          |
|  [Bottom CTA: Start Transferring]        |
+------------------------------------------+
```

**Pages:**
- `/send-large-files-nigeria` -- "Send Large Files in Nigeria -- Free, Fast, Secure"
- `/wetransfer-alternative-nigeria` -- "The Best WeTransfer Alternative for Nigerians"
- `/nollywood-file-sharing` -- "File Sharing Built for Nollywood Productions"
- `/sell-digital-files-nigeria` -- (Phase 2) "Sell Your Digital Files in Nigeria"

All pages: SSR for SEO (NFR3), Open Graph tags for WhatsApp/social preview, schema markup for SoftwareApplication.

### 4.10 Error / Status Pages

**Transfer Expired:**

```
+------------------------------------------+
|  [Clock icon]                            |
|  This transfer has expired               |
|                                          |
|  The files are no longer available.      |
|  Transfers expire after the sender's     |
|  chosen period to keep your data safe.   |
|                                          |
|  Need to send your own files?            |
|  [ Start Transferring -- Free ]          |
|                                          |
|  Need longer expiry?                     |
|  Pro gives you 30 days. [Learn more]     |
+------------------------------------------+
```

**Download Limit Reached:**

```
+------------------------------------------+
|  [Shield icon]                           |
|  Download limit reached                  |
|                                          |
|  This transfer has reached its maximum   |
|  number of downloads (50).               |
|                                          |
|  Ask the sender to create a new          |
|  transfer or increase the limit.         |
|                                          |
|  [ Send Your Own Files -- Free ]         |
+------------------------------------------+
```

**404 -- Not Found:**

```
+------------------------------------------+
|  [Search icon]                           |
|  Page not found                          |
|                                          |
|  The page you're looking for doesn't     |
|  exist or has been moved.                |
|                                          |
|  [ Go to Homepage ]                      |
|  [ Send Files ]                          |
+------------------------------------------+
```

**Upload Failed:**

```
+------------------------------------------+
|  [Warning icon]                          |
|  Upload failed                           |
|                                          |
|  Something went wrong. Don't worry --    |
|  your files are safe.                    |
|                                          |
|  Tips:                                   |
|  - Check your internet connection        |
|  - Try a smaller file first              |
|  - Switch to WiFi if on mobile data      |
|                                          |
|  [ Retry Upload ]                        |
+------------------------------------------+
```

**500 -- Server Error:**

```
+------------------------------------------+
|  [Alert icon]                            |
|  Something went wrong                    |
|                                          |
|  We're aware of the issue and working    |
|  to fix it. Please try again shortly.    |
|                                          |
|  [ Try Again ]                           |
|  [ Contact Support ]                     |
+------------------------------------------+
```

**Payment Failed:**

```
+------------------------------------------+
|  [Card icon]                             |
|  Payment unsuccessful                    |
|                                          |
|  Your payment could not be processed.    |
|                                          |
|  Try:                                    |
|  - A different card                      |
|  - Bank transfer                         |
|  - USSD payment (*737# or *901#)         |
|                                          |
|  [ Retry Payment ]                       |
|  [ Try Different Method ]                |
+------------------------------------------+
```

All error pages: branded with NigeriaTransfer logo, consistent visual language, clear actionable next steps, conversion-focused CTAs where appropriate.

---

## 5. Interaction Patterns

### 5.1 Drag-and-Drop Upload

**Trigger:** User drags files over the UploadZone component, or clicks/taps the zone.

**States:**
1. **Idle:** Dashed border zone with "+" icon and "Drag files here or click to select" text. On mobile: just the tap target ("Tap to select files").
2. **Drag hover:** Zone border changes to solid `--nigerian-green`, background tints to `--green-50`, "+" icon pulses. Entire widget boundary expands slightly to create a larger drop target.
3. **Files selected:** Zone collapses to compact file list. Each file shows: thumbnail/icon, name, size, remove [x] button. Summary line: "3 files -- 847 MB total". "+ Add more files" button appears.
4. **Invalid file (too large):** File appears in list with red warning icon and message: "This file exceeds the 4 GB limit" (or relevant tier limit). File is not added to the upload queue.

**Mobile-specific:**
- No drag-and-drop on mobile (not supported). Zone is a large tap target that opens the native file picker.
- On Android: allows selecting from Files, Camera, Google Drive, etc.
- On iOS: allows selecting from Files, Photos, iCloud, etc.

### 5.2 Progress Bar with Speed/ETA/Pause

**Visual:** (Ref: FR5, FR6, FR7)
- Per-file: thin progress bar (4px height) within each file row, colored `--nigerian-green`
- Overall: full-width bar (8px height) below file list, colored `--nigerian-green` with `--green-100` track
- Speed: "3.2 MB/s" updated every 2 seconds (rolling average to avoid jitter)
- ETA: "~4 min remaining" updated every 5 seconds (smoothed prediction)
- Pause button: toggles between "Pause" (||) and "Resume" (>) icons

**Connection States:**
- **Uploading:** Green bar progressing, speed/ETA visible
- **Paused (manual):** Bar frozen, "Paused" label, Resume button highlighted
- **Connection lost:** Bar frozen, "Reconnecting..." label with animated dots, speed shows "--"
- **Resuming:** Bar continues from where it paused, "Resuming from 57%..." label, then transitions back to normal uploading state
- **Completing:** Bar at 100%, "Finalizing..." label (while file transfers from local to R2)

**Bandwidth Estimator (FR60):**
- Before upload starts, after files are selected: "Estimated time: ~8 minutes on your connection"
- Measured by a small test request to the server (probe ~100KB)
- Displayed below the "Transfer" button before user clicks it
- Updated once during upload if measured speed differs significantly from estimate

### 5.3 File Preview Lightbox

**Trigger:** User taps a file thumbnail on the download page. (Ref: FR12, FR13, FR14)

**Behavior:**
- Full-screen overlay with dark backdrop (rgba(0,0,0,0.85))
- Image: Full-resolution image (lazy-loaded), pinch-to-zoom on mobile, left/right swipe for multi-image transfers
- Video: Video player with play/pause, seek bar, volume. Does NOT auto-play. User taps play.
- PDF: Embedded PDF viewer showing first page, with "Download to see full document" CTA
- Close: X button (top-right, 44x44px), tap outside, swipe down on mobile, Escape key on desktop

**Lightweight Mode:** Lightbox is disabled. Tapping a file icon triggers direct download instead.

### 5.4 Share Sheet

**Trigger:** Transfer completes successfully. Share buttons appear in the success state. (Ref: FR20, FR21, FR22, FR23, FR24)

**Buttons (horizontal row, scrollable on narrow screens):**
1. **WhatsApp:** Green button with WhatsApp icon. Opens `https://wa.me/?text=...` deep link with pre-formatted message: "I sent you files via NigeriaTransfer: [link]". On mobile, opens WhatsApp app directly.
2. **SMS:** Blue button with SMS icon. Opens `sms:?body=...` with pre-formatted message and short link.
3. **Email:** Gray button with email icon. Opens `mailto:?subject=...&body=...` with transfer link.
4. **Copy Link:** Outlined button. On tap: copies link to clipboard, button text changes to "Copied!" for 2 seconds with a green checkmark.
5. **QR Code:** Rendered inline above the share buttons (not a separate button). Always visible.

**Email Transfer Mode (FR24):**
- If user chose "Email Transfer" mode, recipients are automatically emailed by the system
- Share sheet still appears for additional sharing

### 5.5 Conversion Triggers

**Contextual upgrade prompts throughout the app (FR45):**

1. **File size limit:** User selects a file > 4 GB (free tier). Inline warning: "This file is too large for the free tier (4 GB max). Upgrade to Pro for 10 GB per transfer." [Upgrade to Pro] button.

2. **Storage approaching limit:** Dashboard storage meter shows > 80% usage. Gold banner: "You've used 3.8 GB of your 4 GB limit. Upgrade for more space." [Upgrade]

3. **Expiry limitation:** User tries to set expiry > 7 days on free tier. Dropdown disabled past 7 days with tooltip: "Longer expiry available with Pro."

4. **Download limit:** Transfer has 5 or fewer downloads remaining. Email notification to sender: "Your transfer is almost out of downloads. Upgrade for more."

5. **Ad-free experience:** On free-tier download page, subtle text below ad: "Remove ads with NigeriaTransfer Pro -- ₦2,000/month."

6. **Post-transfer:** After successful transfer (free tier), small card appears below success state: "Want up to 10 GB transfers, 30-day expiry, and no ads? Try Pro."

All conversion triggers are non-blocking and dismissible. They never prevent the user from completing their current action.

---

## 6. Lightweight Mode Specification

### 6.1 Purpose

Nigerian mobile data is expensive (estimated NGN 1,000-2,000/GB on some networks). Lightweight Mode minimizes data consumption by disabling non-essential visual elements. (Ref: FR57, FR58)

### 6.2 Default State

- **Mobile (<768px):** Lightweight Mode is ON by default (FR58)
- **Desktop (>=768px):** Lightweight Mode is OFF by default
- User can toggle at any time via the LightweightToggle component
- Preference is saved in localStorage and persists across sessions
- Respects `prefers-reduced-data` media query (where supported)
- Also respects `Save-Data` HTTP client hint header

### 6.3 What Gets Disabled in Lightweight Mode

| Element | Full Mode | Lightweight Mode |
|---------|-----------|-----------------|
| Background wallpaper images | Full-bleed Nigerian art | Solid color background (`--bg-primary`) |
| File preview thumbnails | Image thumbnails, video posters, PDF previews | File-type icons only (SVG, <1KB each) |
| Animations | Upload checkmark, progress transitions, hover effects | No animations, instant state changes |
| Wallpaper crossfade transition | Smooth crossfade between backgrounds | N/A (no backgrounds) |
| Image-heavy sections | "How it works" illustrations, artist gallery images | Text-only with simple icons |
| QR code | Rendered inline (small canvas) | Still rendered (minimal data, high utility) |
| Ad images | Full ad banners with images | Text-only ads or no ads (depending on AdSense rendering) |
| Open Graph preview images | Loaded for link previews | Not loaded client-side (still served via meta tags for WhatsApp) |

### 6.4 What Stays Enabled in Lightweight Mode

- All functional interactions (upload, download, share, auth)
- Text content, form fields, buttons
- File-type SVG icons (inline, <1KB each)
- QR codes (small canvas element, high utility)
- Progress bars and speed/ETA text
- Navigation and all page functionality
- Dark mode toggle

### 6.5 LightweightToggle Component

**Placement:** Fixed position, top-right of header bar (next to dark mode toggle).

**Visual:**
- Icon: feather/leaf icon when Lightweight Mode is OFF ("go light")
- Icon: image icon when Lightweight Mode is ON ("go rich")
- Tooltip: "Lightweight mode: saves data" / "Full experience: shows artwork"
- Badge: small green dot when ON to indicate data-saving is active

**Toggle behavior:**
- Instant: no page reload. CSS classes toggle on `<body>` element.
- Backgrounds: removed/added via CSS `display: none` or conditional rendering
- Previews: toggled via React state, conditionally renders icons vs thumbnails
- Animations: toggled via CSS `prefers-reduced-motion` override class

### 6.6 Data Savings Estimate

| Page | Full Mode | Lightweight Mode | Savings |
|------|-----------|-----------------|---------|
| Homepage (initial load) | ~800KB (with background) | ~150KB | ~80% |
| Download page (5 images) | ~1.2MB (with previews) | ~180KB | ~85% |
| Dashboard | ~300KB | ~200KB | ~33% |

---

## 7. Dark Mode Specification

### 7.1 Activation

- **Auto-detect:** Reads `prefers-color-scheme: dark` media query on first visit (FR59)
- **Manual toggle:** Dark mode toggle button in header (next to Lightweight toggle)
- **Persistence:** Saved in localStorage, overrides system preference
- Three states: Light / Dark / System (auto)

### 7.2 Dark Mode Color Mapping

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `#FFFFFF` | `#1A1A2E` |
| Card/widget surface | `#FFFFFF` | `#2D2D42` |
| Elevated surface | `#FFFFFF` with shadow | `#3D3D52` with subtle shadow |
| Primary text | `#1A1A2E` | `#FFFFFF` |
| Secondary text | `#6B6B7B` | `#D1D1D8` |
| Borders | `#D1D1D8` | `#3D3D52` |
| Upload zone dashed border | `#D1D1D8` | `#4D4D62` |
| Input backgrounds | `#FFFFFF` | `#2D2D42` |
| Input text | `#1A1A2E` | `#FFFFFF` |
| Overlay / frosted glass | `rgba(255,255,255,0.92)` | `rgba(26,26,46,0.92)` |
| Progress bar track | `#E6F5ED` | `#004D2E` |
| Progress bar fill | `#008751` | `#008751` (unchanged) |
| Error background | `#FDE8E5` | `#3D1A1A` |
| Gold accent background | `#FFF8DC` | `#3D3520` |

### 7.3 Dark Mode with Backgrounds

Dark mode actually enhances the full-bleed background experience. In Dark mode with Lightweight Mode OFF:
- Frosted glass overlay on the upload widget uses dark tint
- Background images appear more vivid against dark UI elements
- Artist credit bar uses darker overlay

In Dark mode with Lightweight Mode ON:
- Solid `#1A1A2E` background replaces art
- All UI elements use dark palette
- Highest contrast mode for readability on AMOLED screens (common on Nigerian Android devices)

---

## 8. Responsive Breakpoints

### 8.1 Breakpoint Definitions

| Breakpoint | Width | Target Devices |
|-----------|-------|---------------|
| `mobile` | 360px -- 767px | Tecno Spark, Infinix Hot, Samsung A-series, iPhones |
| `tablet` | 768px -- 1023px | iPad, Samsung Tab, landscape phones |
| `desktop` | 1024px+ | Laptops, desktops, large tablets in landscape |

Design approach: mobile-first. All base styles target 360px. Media queries scale UP.

### 8.2 Layout Adaptations by Breakpoint

#### Homepage / Upload Page

| Element | Mobile (360px) | Tablet (768px) | Desktop (1024px+) |
|---------|---------------|----------------|-------------------|
| Upload widget width | 100% - 32px | 480px centered | 480px left-offset (40% from left) |
| Background image | 1x resolution, lazy | 2x resolution | Full resolution |
| Below-fold content | Single column | Two columns | Three columns |
| File list | Full width, scroll | Full width | Full width within widget |
| Share buttons | Horizontal scroll | Full row | Full row |
| Artist credit | Bottom bar, truncated | Bottom bar, full name | Bottom bar, full name + title |

#### Download Page

| Element | Mobile (360px) | Tablet (768px) | Desktop (1024px+) |
|---------|---------------|----------------|-------------------|
| Download card width | 100% - 32px | 540px centered | 600px centered |
| Preview thumbnails | 2-column grid | 3-column grid | 4-column grid |
| File list | Full width, stacked | Full width, stacked | Full width, table-like rows |
| Ad banner | 320x50 (mobile banner) | 468x60 (full banner) | 728x90 (leaderboard) |

#### Dashboard

| Element | Mobile (360px) | Tablet (768px) | Desktop (1024px+) |
|---------|---------------|----------------|-------------------|
| Navigation | Bottom tab bar (5 icons) | Left sidebar (collapsed, icons only) | Left sidebar (expanded, icons + labels) |
| Content area | Full width | Full width minus sidebar | Full width minus sidebar |
| Transfer cards | Stacked, full width | 2-column grid | 2-column grid with more detail per card |
| Analytics chart | Full width, compact | Full width | 60% width with stats sidebar |
| Storage meter | Horizontal bar | Horizontal bar | Horizontal bar with detail sidebar |

#### Pricing Page

| Element | Mobile (360px) | Tablet (768px) | Desktop (1024px+) |
|---------|---------------|----------------|-------------------|
| Tier cards | Stacked vertically, swipeable carousel | 3-column grid | 3-column grid |
| Feature comparison | Scrollable table, sticky first column | Full table | Full table |
| FAQ | Full-width accordion | Full-width accordion | 2-column layout |

#### Auth Pages

| Element | Mobile (360px) | Tablet (768px) | Desktop (1024px+) |
|---------|---------------|----------------|-------------------|
| Auth card | Full width - 32px | 400px centered | 400px centered with side illustration |
| Social buttons | Full width, stacked | Full width | Full width |
| OTP input | 6 boxes, 44px each | 6 boxes, 48px each | 6 boxes, 48px each |

### 8.3 Touch vs. Pointer Adaptation

- `@media (pointer: coarse)`: All interactive elements minimum 44x44px (NFR21)
- `@media (pointer: fine)`: Interactive elements can be 32px minimum (denser desktop layout)
- `@media (hover: hover)`: Enable hover states (desktop)
- `@media (hover: none)`: Disable hover states, use active/pressed states instead (mobile)

---

## 9. Accessibility Requirements

### 9.1 Compliance Target

**WCAG 2.1 Level AA** (Ref: NFR21-NFR25)

### 9.2 Touch Targets

All interactive elements have a minimum touch target of 44x44px on mobile (NFR21):
- Buttons: minimum height 44px, minimum width 44px
- Links in body text: adequate padding/line-height to ensure 44px hit area
- File list action buttons: 44x44px tap targets with adequate spacing
- Close buttons on modals/lightboxes: 44x44px
- Toggle switches: 44px height
- Tab selectors: minimum 44px height

### 9.3 ARIA and Screen Reader Support

**ARIA Live Regions (NFR22):**
- Upload progress updates: `aria-live="polite"` with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Upload success/failure: `aria-live="assertive"` announcement
- Connection status changes: `aria-live="polite"` -- "Connection lost. Upload paused." / "Connection restored. Resuming upload."
- File added/removed from list: `aria-live="polite"` -- "photo1.jpg added. 3 files, 847 MB total."
- Copy to clipboard: `aria-live="polite"` -- "Link copied to clipboard"
- Toast notifications: `role="alert"`, `aria-live="assertive"`

**ARIA Labels:**
- Upload zone: `aria-label="File upload area. Drag and drop files or click to select."`
- Progress bar: `role="progressbar"`, `aria-label="Upload progress"`, `aria-valuenow="42"`, `aria-valuetext="42 percent complete, 4 minutes remaining"`
- Share buttons: `aria-label="Share via WhatsApp"`, `aria-label="Share via SMS"`, etc.
- File remove button: `aria-label="Remove photo1.jpg from transfer"`
- Lightweight toggle: `aria-label="Toggle lightweight mode"`, `aria-pressed="true/false"`
- Dark mode toggle: `aria-label="Toggle dark mode"`, `aria-pressed="true/false"`
- Password visibility toggle: `aria-label="Show password"` / `aria-label="Hide password"`

### 9.4 Keyboard Navigation (NFR24)

**Tab Order:**
1. Skip to main content link (visually hidden, appears on focus)
2. Logo (links to home)
3. Navigation items
4. Lightweight toggle
5. Dark mode toggle
6. Main content (upload zone, form fields, buttons)
7. Footer links

**Key Bindings:**
- `Tab` / `Shift+Tab`: Navigate between focusable elements
- `Enter` / `Space`: Activate buttons, links, toggles
- `Escape`: Close modals, lightboxes, dropdown menus
- Arrow keys: Navigate within tab groups, file list, pricing tier cards
- `Enter` on upload zone: Opens file picker

**Focus Indicators:**
- Visible focus ring: 2px solid `--nigerian-green`, 2px offset
- Focus ring visible in both light and dark mode
- Never remove `outline` without a visible alternative
- Focus trap within modals and lightboxes

### 9.5 Color and Contrast (NFR23)

- All text meets WCAG 2.1 AA minimum contrast ratios (4.5:1 normal text, 3:1 large text)
- Information is never conveyed by color alone -- always accompanied by icon, text, or pattern
- Error states: red color + error icon + error text message
- Success states: green color + checkmark icon + success text message
- Progress: percentage text alongside colored progress bar
- Status badges: text label in addition to color (Active = green + "Active" text)

### 9.6 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- All animations respect `prefers-reduced-motion`
- Lightweight Mode also disables animations
- Upload success checkmark: static icon instead of animation
- Background crossfade: instant switch instead of transition
- Progress bar: instant fill instead of animated transition

### 9.7 No-JavaScript Degradation (NFR25)

- Download page renders download links server-side. User can download files without any JavaScript.
- `<noscript>` message on upload page: "JavaScript is required to upload files. Enable JavaScript to use NigeriaTransfer."
- SEO pages, static pages, pricing page: fully readable without JavaScript
- Opera Mini extreme mode: download link functions, no upload capability (expected and acceptable)

---

## 10. User Flow Diagrams

### 10.1 Upload Flow (Anonymous User)

```
[User visits nigeriatransfer.com]
    |
    v
[Homepage loads with upload widget]
    |
    v
[User drags/selects files]
    |
    +-- File too large? --> [Show tier limit error, suggest upgrade]
    |
    v
[File list populates: names, sizes, thumbnails]
    |
    v
[User chooses mode: Email Transfer / Get a Link]
    |
    +-- Email mode: [Enter recipient email(s) + sender email]
    +-- Link mode: [No email fields needed]
    |
    v
[Optional: Expand settings accordion]
    |-- Set expiry (default 7 days)
    |-- Set download limit (default 50)
    |-- Toggle password + enter password
    |-- Write personal message
    |
    v
[Bandwidth estimator shows: "~8 min on your connection"]
    |
    v
[User taps "Transfer"]
    |
    v
[Upload begins -- tus chunked upload]
    |
    +-- Progress bar: per-file + overall, speed, ETA
    |   |
    |   +-- Connection drops? --> [Show "Reconnecting...", auto-resume from last chunk]
    |   +-- User taps Pause? --> [Pause upload, show Resume button]
    |   +-- Browser crash? --> [Session in localStorage, resume on reopen]
    |
    v
[Upload completes]
    |
    v
[Widget transitions to Success State]
    |-- Shareable link (copy to clipboard)
    |-- QR code
    |-- Share buttons: WhatsApp, SMS, Email, Copy Link
    |-- Transfer summary
    |-- Download receipt (PDF)
    |-- Send Another Transfer
    |
    +-- Email mode: [System sends notification to recipients automatically]
```

### 10.2 Download Flow

```
[Recipient opens transfer link (/d/{shortCode})]
    |
    v
[Server checks: transfer exists? expired? limit reached?]
    |
    +-- Transfer expired? --> [Show Expired page with CTA]
    +-- Limit reached? --> [Show Limit Reached page]
    +-- Not found? --> [Show 404]
    |
    v
[Password protected?]
    |
    +-- Yes --> [Show password gate]
    |            |
    |            +-- Correct password --> [Continue]
    |            +-- Wrong password --> [Show error, decrement attempts]
    |            +-- Too many attempts --> [Rate limit: "Try again in 1 minute"]
    |
    +-- No --> [Continue]
    |
    v
[Download page loads: file list, previews, metadata]
    |
    +-- Free tier? --> [Show ad banner below card]
    |
    v
[User can:]
    |-- Tap file thumbnail --> [Open preview lightbox]
    |-- Tap individual Download --> [Download single file (Range-request resumable)]
    |-- Tap Download All --> [Generate + stream ZIP archive]
    |
    v
[Download starts]
    |
    +-- Connection drops? --> [User can resume with download manager / browser retry]
    |
    v
[Download completes]
    |
    v
[Download counter increments]
    |
    +-- Sender receives email notification (FR25)
```

### 10.3 Subscribe Flow

```
[User encounters conversion trigger]
    |-- File too large for free tier
    |-- Storage limit approaching
    |-- Sees upgrade CTA on pricing page
    |-- Post-transfer upgrade prompt
    |
    v
[User taps "Upgrade to Pro" or "Upgrade to Business"]
    |
    v
[If not authenticated --> Auth flow (see 10.5)]
    |
    v
[Pricing confirmation page]
    |-- Plan: Pro -- NGN 2,000/month
    |-- Payment method: Card / Bank Transfer / USSD
    |-- [Proceed to Payment]
    |
    v
[Redirect to Paystack checkout (FR40, FR41, FR42)]
    |
    +-- Card: Enter card details on Paystack
    +-- Bank transfer: Get account details, complete transfer
    +-- USSD: Dial code, complete on phone
    |
    v
[Paystack processes payment]
    |
    +-- Success --> [Paystack webhook fires]
    |                |
    |                v
    |              [Server activates subscription]
    |                |
    |                v
    |              [Redirect to dashboard with "Pro" badge and confirmation]
    |
    +-- Failure --> [Payment Failed page with retry + alternative methods]
```

### 10.4 File Request Flow

```
[Authenticated user creates file request (FR35)]
    |
    v
[Dashboard > File Requests > New Request]
    |-- Title: "CV Submissions"
    |-- Message: "Please upload your CV and cover letter"
    |-- [Create Request]
    |
    v
[System generates request link: /request/{code}]
    |
    v
[User shares link via WhatsApp/email/etc.]
    |
    v
[Recipient opens request link]
    |
    v
[File Request page loads (section 4.4)]
    |-- Sees requester's message
    |-- Drags/selects files
    |-- Optionally enters email
    |-- Taps "Upload Files"
    |
    v
[Upload proceeds (same tus flow as main upload)]
    |
    v
[Success: "Files submitted successfully"]
    |
    v
[Requester's dashboard shows received files (FR38)]
    |
    v
[Requester can download/manage received files]
```

### 10.5 Auth Flow

```
[User needs authentication]
    |-- Triggered by: Dashboard access, subscription, file request creation
    |
    v
[Auth page loads (/login or /register)]
    |
    +-- Option 1: Google OAuth (FR28)
    |   |-- Tap "Continue with Google"
    |   |-- Google consent screen
    |   |-- Redirect back with token
    |   |-- Account created/matched
    |   v
    |
    +-- Option 2: Email Magic Link (FR27)
    |   |-- Enter email
    |   |-- Tap "Send Magic Link"
    |   |-- Check email, tap link
    |   |-- Redirect to app, authenticated
    |   v
    |
    +-- Option 3: Phone OTP (FR29)
    |   |-- Enter phone number (+234...)
    |   |-- Tap "Send OTP"
    |   |-- Enter 6-digit code
    |   |-- Verified, authenticated
    |   v
    |
    v
[Redirect to originally requested page or dashboard]
```

### 10.6 API Onboarding Flow

```
[Developer visits /docs/api (FR55)]
    |
    v
[API documentation page loads]
    |-- Overview, authentication, endpoints, examples
    |-- [Get API Key] CTA
    |
    v
[Developer authenticates (if not already)]
    |
    v
[Dashboard > API Keys (Business tier required)]
    |
    +-- Not on Business tier? --> [Upgrade prompt: "API access requires Business tier"]
    |
    v
[Generate API Key]
    |-- Key displayed once (copy to clipboard)
    |-- Key name, creation date, usage limits shown
    |
    v
[Developer integrates:]
    |-- Upload widget embed code (FR50)
    |-- REST API endpoints (FR49, FR52, FR53)
    |-- Webhook configuration (FR51)
    |
    v
[API calls authenticated via API key header (FR48)]
    |-- Rate limited per key (FR54)
    |-- Usage tracked in dashboard
```

---

## 11. Component Inventory

### 11.1 UploadZone

**Purpose:** Primary file selection and drag-and-drop target.
**States:** idle, drag-hover, files-selected, uploading, paused, error, disabled (request closed)
**Props:** `maxFileSize`, `maxFiles`, `allowedTypes`, `onFilesSelected`, `onFilesRemoved`, `disabled`, `mode` (transfer | request)
**Accessibility:** `role="button"`, `aria-label`, keyboard-activatable, file list as `role="list"`
**Lightweight Mode:** No change (functional component, always enabled)

### 11.2 ProgressBar

**Purpose:** Displays upload/download progress with speed and ETA.
**States:** uploading, paused, reconnecting, resuming, completing, complete, error
**Props:** `progress` (0-100), `speed` (bytes/s), `eta` (seconds), `status`, `onPause`, `onResume`, `perFileProgress[]`
**Accessibility:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` with human-readable status
**Lightweight Mode:** Animations disabled, instant progress bar fills

### 11.3 TransferSettings

**Purpose:** Expandable accordion for transfer configuration.
**Sub-components:** ExpirySelect, DownloadLimitInput, PasswordToggle, MessageTextarea, RecipientEmailInput
**States:** collapsed (default), expanded
**Props:** `tier` (free/pro/business), `defaults`, `onChange`
**Behavior:** Options disabled beyond tier limits with upgrade tooltip. Accordion toggle with smooth expand/collapse (disabled in Lightweight Mode).
**Accessibility:** `aria-expanded`, `aria-controls`, keyboard toggle with Enter/Space

### 11.4 ShareCard

**Purpose:** Post-upload sharing interface with link, QR, and share buttons.
**Sub-components:** CopyLinkButton, QRCodeDisplay, WhatsAppShareButton, SMSShareButton, EmailShareButton, ReceiptDownloadLink
**Props:** `transferLink`, `transferSummary`, `qrCodeData`
**Accessibility:** All buttons labeled, copy confirmation announced via `aria-live`

### 11.5 DownloadCard

**Purpose:** File list and download interface for transfer recipients.
**Sub-components:** FileRow, DownloadAllButton, ExpiryCountdown, DownloadCounter
**Props:** `files[]`, `transferMeta`, `isPasswordVerified`, `tier`
**States:** loading, password-gate, ready, downloading, expired, limit-reached
**Accessibility:** File list as `role="list"`, each file row with download button labeled by filename

### 11.6 FilePreview

**Purpose:** Modal/lightbox for previewing files before download.
**Sub-components:** ImageViewer, VideoPlayer, PDFViewer
**Props:** `file`, `onClose`, `onDownload`
**Behavior:** Full-screen overlay. Image: pinch-zoom, swipe navigation. Video: play/pause (no autoplay). PDF: first page with download CTA.
**Accessibility:** Focus trap, `role="dialog"`, `aria-modal="true"`, Escape to close
**Lightweight Mode:** Disabled. Tapping a file triggers download directly.

### 11.7 BackgroundWallpaper

**Purpose:** Full-bleed rotating Nigerian art background.
**Props:** `imageUrl`, `artistName`, `artistUrl`, `artworkTitle`
**Behavior:** Crossfade transition (1s) between images on page load/navigation. New image each visit (random from rotation set). Lazy-loaded with blur-up placeholder.
**Lightweight Mode:** Completely hidden. `display: none` and image not fetched.
**Dark Mode:** Overlay tint adjusted for dark mode (darker frosted glass on widget).

### 11.8 LightweightToggle

**Purpose:** Toggle button to enable/disable Lightweight Mode.
**Placement:** Header bar, fixed position.
**Props:** `isEnabled`, `onToggle`
**Behavior:** Instant toggle, no page reload. Saves preference to localStorage. On mobile: defaults to ON.
**Accessibility:** `role="switch"`, `aria-checked`, `aria-label="Toggle lightweight mode"`, keyboard-activatable

### 11.9 BandwidthEstimator

**Purpose:** Display estimated upload/download time before transfer begins. (FR60)
**Placement:** Below the Transfer button, inline text.
**Props:** `totalSize`, `measuredSpeed`
**Behavior:** Runs a small probe request (~100KB) to measure connection speed on page load. Displays: "Estimated time: ~8 minutes on your connection". Updates if more files are added.
**Lightweight Mode:** Always enabled (text-only, minimal data).

### 11.10 PricingTable

**Purpose:** Responsive tier comparison table.
**Props:** `tiers[]`, `currentTier`, `onSelectTier`
**Behavior:** Three columns on desktop/tablet, stacked cards on mobile (with swipeable carousel). Recommended tier highlighted with green border and "Popular" badge.
**Accessibility:** Table uses proper `<th>` headers, `scope` attributes. On mobile card view: each card is a labeled group.

### 11.11 AdBanner

**Purpose:** Non-intrusive ad placement on free-tier download pages. (FR46)
**Placement:** Below the download card.
**Props:** `adSlot`, `adSize`, `tier`
**Behavior:** Only renders for free-tier transfers. Loads AdSense script lazily. If ad fails to load, collapses to zero height (no blank space). Supports responsive ad sizes (320x50 mobile, 728x90 desktop).
**Accessibility:** `aria-label="Advertisement"`, `role="complementary"`
**Lightweight Mode:** Text-only ad format if available, or collapsed.

### 11.12 Additional Components

**StorageMeter:** Dashboard storage visualization. Progress bar with color coding (green/gold/red). Props: `used`, `total`, `tier`.

**TransferCard:** Dashboard transfer list item. Shows file summary, dates, download stats, actions. Props: `transfer`, `onCopyLink`, `onDelete`, `onExtend`.

**AuthForm:** Multi-method auth form (Google OAuth, magic link, phone OTP). Props: `mode` (login/register), `onSuccess`.

**OTPInput:** Six-digit OTP input with auto-advance. Props: `length`, `onComplete`. Accessibility: `aria-label` per digit, auto-focus management.

**ExpiryCountdown:** Live countdown display. Props: `expiresAt`. Behavior: Updates every minute. Shows "Expires in 5 days, 3 hours" then switches to "Expires in 2 hours, 15 minutes" in last 24 hours.

**ConversionPrompt:** Contextual upgrade prompt. Props: `trigger`, `currentTier`, `targetTier`, `message`. Variants: inline banner, card, modal. All dismissible.

**ArtistCredit:** Bottom bar showing current background artist. Props: `artistName`, `artistUrl`, `artworkTitle`. Lightweight Mode: hidden.

**NavHeader:** Persistent header with logo, nav links, toggles. Responsive: hamburger menu on mobile.

**TabBar:** Bottom tab navigation for mobile dashboard. 5 tabs with icons and labels.

---

## 12. Animation and Micro-Interaction Specs

### 12.1 Guiding Principle

Animations serve function, not decoration. Every animation must communicate state change or provide feedback. All animations respect:
- Lightweight Mode: disabled entirely (instant state changes)
- `prefers-reduced-motion: reduce`: disabled entirely
- `Save-Data` client hint: disabled

### 12.2 Animation Inventory

| Animation | Duration | Easing | Purpose | Lightweight Behavior |
|-----------|----------|--------|---------|---------------------|
| Background crossfade | 1000ms | ease-in-out | Transition between wallpaper images | Instant switch (no image) |
| Upload widget state transition | 300ms | ease-out | Transition from idle to progress to success | Instant swap |
| Progress bar fill | continuous | linear | Visual progress feedback | Instant fill to current value |
| Success checkmark | 600ms | spring | Celebrate successful upload | Static checkmark icon |
| Drag-hover zone expand | 200ms | ease-out | Indicate valid drop target | Instant border color change |
| File row enter | 150ms | ease-out | File added to list (slide in) | Instant appear |
| File row exit | 150ms | ease-in | File removed from list (slide out) | Instant disappear |
| Toast notification enter | 200ms | ease-out | Slide in from top-right | Instant appear |
| Toast notification exit | 300ms | ease-in | Fade out after 3s | Instant disappear |
| Modal/lightbox open | 200ms | ease-out | Fade in + scale up from 95% | Instant appear |
| Modal/lightbox close | 150ms | ease-in | Fade out + scale down to 95% | Instant disappear |
| Button press | 100ms | ease-in | Scale to 97% on active/press | No transform |
| Tab switch | 200ms | ease-in-out | Content crossfade between tabs | Instant swap |
| Accordion expand | 250ms | ease-out | Smooth height transition | Instant expand |
| Copy to clipboard feedback | 200ms | ease-out | Button text change + checkmark | Instant text change |
| Connection status pulse | 1000ms | ease-in-out | Pulsing dot during reconnection | Static indicator |
| Skeleton loading | 1500ms | ease-in-out | Shimmer effect on loading cards | Static gray placeholder |

### 12.3 Haptic Feedback (Mobile)

Where supported (`navigator.vibrate`):
- Upload complete: short vibration (50ms)
- Error state: double short vibration (50ms, 50ms gap, 50ms)
- Copy to clipboard: very short vibration (25ms)
- Disabled in Lightweight Mode

### 12.4 Loading States

**Skeleton Screens (preferred over spinners):**
- Download page: card skeleton with gray bars for file rows, image placeholder rectangles
- Dashboard: transfer card skeletons in list layout
- Pricing page: tier card skeletons

**Spinner (used sparingly):**
- ZIP generation: "Preparing ZIP..." with small inline spinner
- Password verification: brief spinner on button
- Payment processing: full-screen overlay with spinner and "Processing payment..."

---

## 13. Error States and Empty States

### 13.1 Error States by Page

#### Homepage / Upload Page

| Error | Display | Action |
|-------|---------|--------|
| File exceeds tier limit | Inline warning on file row: "Exceeds 4 GB limit" in red. File not added. | "Upgrade to Pro for 10 GB" link |
| Too many files | Toast: "Maximum 100 files per transfer" | Remove some files |
| Invalid file type (if restricted) | Inline warning on file row | Show accepted types |
| Upload network error | Progress bar pauses, "Reconnecting..." message | Auto-retry. Manual "Retry" after 30s |
| Upload server error (500) | "Upload failed" inline error | "Retry" button + connection tips |
| Storage capacity exceeded (FR19) | "NigeriaTransfer is temporarily at capacity. Please try again later." | "Notify me when space is available" (email capture) |
| Rate limit hit (NFR11) | "You've reached the upload limit. Try again in [time]." | Countdown timer |
| Session expired during upload | "Your session expired but your upload progress is saved." | "Resume upload" button (tus resume) |

#### Download Page

| Error | Display | Action |
|-------|---------|--------|
| Transfer expired | Full page: Expired status page (section 4.10) | CTA to send own files, upgrade link |
| Download limit reached | Full page: Limit Reached status page (section 4.10) | Inform sender, CTA to send own files |
| Wrong password | Inline error below input: "Incorrect password" | Show attempts remaining |
| Password rate limited | "Too many attempts. Try again in 1 minute." | Countdown timer |
| Download network error | "Download interrupted. Your browser can resume it." | "Retry Download" button |
| ZIP generation failure | "Could not create ZIP. Try downloading files individually." | Individual download buttons |
| File not found (deleted early) | "This file is no longer available." | Other files still downloadable |

#### Dashboard

| Error | Display | Action |
|-------|---------|--------|
| Failed to load transfers | "Could not load your transfers." | "Retry" button |
| Failed to delete transfer | Toast: "Could not delete transfer. Try again." | Retry |
| Failed to copy link | Toast: "Could not copy. Long-press the link to copy manually." | Show link as selectable text |
| Subscription API error | "Could not load subscription details." | "Retry" or "Contact support" |
| Payment processing error | Redirect to Payment Failed page (section 4.10) | Retry with same/different method |

#### Auth Pages

| Error | Display | Action |
|-------|---------|--------|
| Google OAuth failure | "Could not sign in with Google. Try another method." | Show magic link and phone options |
| Magic link expired | "This sign-in link has expired." | "Send a new link" button |
| Invalid OTP | Inline error: "Invalid code. Try again." | Resend option with countdown |
| OTP expired | "Code expired." | "Resend code" button |
| Phone number invalid | Inline validation: "Enter a valid Nigerian phone number" | Auto-format +234 prefix |
| Too many auth attempts | "Too many sign-in attempts. Try again in 15 minutes." | Countdown, alternative methods |

#### File Request Page

| Error | Display | Action |
|-------|---------|--------|
| Request closed | "This file request is no longer accepting uploads." | CTA to send own files |
| Request not found | 404 page | CTA to homepage |
| Upload to request failed | Same upload error handling as homepage | Retry |

### 13.2 Empty States by Page/Section

#### Dashboard -- My Transfers (no transfers yet)

```
+------------------------------------------+
|  [Upload cloud icon illustration]        |
|                                          |
|  No transfers yet                        |
|                                          |
|  Send your first files to see them       |
|  here. Your transfer history, download   |
|  stats, and management tools will        |
|  appear in this space.                   |
|                                          |
|  [ Send Your First Transfer ]            |
+------------------------------------------+
```

#### Dashboard -- File Requests (no requests created)

```
+------------------------------------------+
|  [Inbox icon illustration]               |
|                                          |
|  No file requests yet                    |
|                                          |
|  Create a file request to let others     |
|  upload files directly to your account.  |
|  Perfect for collecting CVs, documents,  |
|  or project submissions.                 |
|                                          |
|  [ Create Your First Request ]           |
+------------------------------------------+
```

#### Dashboard -- Analytics (no data)

```
+------------------------------------------+
|  [Chart icon illustration]               |
|                                          |
|  No analytics data yet                   |
|                                          |
|  Once your transfers start getting       |
|  downloads, you'll see charts and        |
|  statistics here.                        |
|                                          |
|  [ Send a Transfer to Get Started ]      |
+------------------------------------------+
```

#### Dashboard -- API Keys (no keys generated)

```
+------------------------------------------+
|  [Key icon illustration]                 |
|                                          |
|  No API keys yet                         |
|                                          |
|  Generate an API key to integrate        |
|  NigeriaTransfer into your application.  |
|  View the API documentation to get       |
|  started.                                |
|                                          |
|  [ Generate API Key ] [ View API Docs ]  |
+------------------------------------------+
```

#### Dashboard -- Storage (no files)

```
+------------------------------------------+
|  Storage Usage                           |
|                                          |
|  [------------------------------] 0 / X GB|
|  0% used                                 |
|                                          |
|  No active files. Send a transfer        |
|  to start using your storage.            |
+------------------------------------------+
```

#### File Requests -- Received Files (no uploads to request)

```
+------------------------------------------+
|  No files received yet                   |
|                                          |
|  Share your request link to start        |
|  receiving files.                        |
|                                          |
|  [Copy Request Link]                     |
+------------------------------------------+
```

#### Search Results -- No matches

```
+------------------------------------------+
|  No transfers matching "[search term]"   |
|                                          |
|  Try a different search term or clear    |
|  your filters.                           |
|                                          |
|  [Clear Search]                          |
+------------------------------------------+
```

### 13.3 Empty State Design Principles

- Every empty state has: an icon/illustration (simple SVG, not heavy image), explanatory text, and a primary action CTA
- Empty states are opportunities for onboarding -- they explain what the section does
- In Lightweight Mode: illustrations are simple inline SVG icons (no external images)
- Tone is encouraging, not apologetic ("No transfers yet" not "Nothing to show")
- Primary action button always leads to the logical next step

---

## 14. Performance and Technical UX Considerations

### 14.1 Critical Rendering Path

1. Server-side render the HTML shell with critical CSS inline (<14KB)
2. Load system fonts (instant -- no font file download)
3. First Contentful Paint: page structure visible (<3s on 3G, NFR3)
4. Hydrate interactive components (upload widget, toggles)
5. Time to Interactive: user can interact with upload zone (<5s on Tecno Spark)
6. Lazy-load below-fold content, background image, analytics, ads

### 14.2 Bundle Strategy

- Initial JS bundle: <200KB target (aggressive code splitting)
- Upload page: core upload widget + tus client only
- Download page: minimal -- file list is SSR, preview components lazy-loaded on interaction
- Dashboard: loaded as separate chunk, only when user navigates there
- Analytics chart library: loaded only on analytics tab
- PDF viewer: loaded only when user opens a PDF preview

### 14.3 Image Strategy

- Background wallpapers: multiple resolutions (480w, 768w, 1024w, 1920w). `srcset` for responsive loading.
- In Lightweight Mode: no image request at all (`display: none` + conditional rendering)
- File preview thumbnails: server-generated, optimized (WebP, ~30KB each)
- Icons: inline SVG from icon set (no icon font, no image requests)
- Lazy loading: `loading="lazy"` on all images below the fold

### 14.4 Service Worker Strategy

- Cache app shell (HTML template, CSS, JS) for instant repeat visits
- Cache static assets (icons, fonts if any) with stale-while-revalidate
- Offline upload queue: files selected while offline are stored in IndexedDB, uploaded when connection returns
- Push notifications: download notifications (opt-in)
- Background sync: queued uploads complete even if user navigates away

### 14.5 Connection-Aware UX

- Use `navigator.connection` API (where available) to:
  - Auto-enable Lightweight Mode on `slow-2g`, `2g`, `3g` effective types
  - Adjust chunk size: 1MB on slow connections, 5MB on fast connections
  - Show connection quality indicator: green (good), yellow (moderate), red (poor)
- Handle `navigator.onLine` / `offline` events:
  - Offline: pause uploads, show "You're offline. Uploads will resume when connected." banner
  - Online: auto-resume, dismiss banner

---

## 15. Appendix: FR Cross-Reference

| UX Element | Referenced FRs |
|-----------|---------------|
| Upload zone / drag-and-drop | FR1, FR2, FR3, FR4 |
| Pause/resume upload | FR5, FR6 |
| Progress bar with speed/ETA | FR7 |
| Shareable link generation | FR8 |
| Expiry configuration | FR9 |
| Download limit configuration | FR10 |
| Password protection | FR11 |
| Image preview thumbnails | FR12 |
| Video poster frame preview | FR13 |
| PDF first-page preview | FR14 |
| Individual file download | FR15 |
| ZIP download | FR16 |
| Resumable download | FR17 |
| Expired file cleanup | FR18 |
| Storage capacity rejection | FR19 |
| WhatsApp share button | FR20 |
| SMS share button | FR21 |
| QR code generation | FR22 |
| Copy link to clipboard | FR23 |
| Email notification to recipients | FR24 |
| Download notification to sender | FR25 |
| Expiry warning email | FR26 |
| Email magic link auth | FR27 |
| Google OAuth | FR28 |
| Phone OTP auth | FR29 |
| Dashboard -- active transfers | FR30 |
| Download statistics | FR31 |
| Delete own transfers | FR32 |
| Storage utilization view | FR33 |
| Subscription status view | FR34 |
| File request creation | FR35 |
| File request link | FR36 |
| Request upload (no account) | FR37 |
| View received files | FR38 |
| Close file request | FR39 |
| Pro subscription (Paystack) | FR40 |
| Business subscription | FR41 |
| Payment methods (card, bank, USSD) | FR42 |
| Cancel subscription | FR43 |
| Tier limit enforcement | FR44 |
| Upgrade prompts | FR45 |
| Free-tier ad banners | FR46 |
| Paid-tier no ads | FR47 |
| API key registration | FR48 |
| API transfer creation | FR49 |
| Embeddable upload widget | FR50 |
| Webhook callbacks | FR51 |
| API transfer status query | FR52 |
| API transfer deletion | FR53 |
| API rate limiting | FR54 |
| API documentation page | FR55 |
| Full-bleed rotating backgrounds | FR56 |
| Lightweight mode toggle | FR57 |
| Lightweight mode default on mobile | FR58 |
| Dark mode toggle | FR59 |
| Bandwidth estimator | FR60 |
| Artist credit display | FR61 |
| Download audit logging | FR62 |
| Storage monitoring | FR63 |
| Database backups | FR64 |
| Storage/transfer reports | FR65 |
| Egress bandwidth tracking | FR66 |

---

*End of UX Design Specification*
