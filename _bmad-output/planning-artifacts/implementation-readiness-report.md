---
verdict: READY_WITH_CONCERNS
confidenceScore: 72
assessedDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/product-brief-transfer.md
  - _bmad-output/planning-artifacts/product-brief-transfer-distillate.md
  - prompt.md
assessedAt: "2026-03-28"
frCount: 66
nfrCount: 33
journeyCount: 5
criticalGaps: 14
majorGaps: 11
minorGaps: 9
---

# Implementation Readiness Report -- NigeriaTransfer

**Verdict:** READY_WITH_CONCERNS
**Confidence Score:** 72 / 100
**Date:** 2026-03-28

---

## 1. PRD Completeness Assessment

### Sections Present

| Section | Status | Notes |
|---------|--------|-------|
| Executive Summary | PASS | Clear, concise, covers all key positioning |
| Project Classification | PASS | Correct: Web App, Fintech, High Complexity, Greenfield |
| Success Criteria | PASS | Well-structured: User, Business, Technical, Measurable |
| Product Scope (MVP + Phases) | PASS | Ship-all-at-once decision reflected correctly |
| User Journeys (5) | PASS | All 5 segments covered |
| Domain-Specific Requirements | PASS | NDPA, Paystack, R2, compliance addressed |
| Innovation & Novel Patterns | PASS | Resilience-first, national identity, consumer+API |
| Web App Specific Requirements | PASS | PWA, browser support, performance targets |
| Functional Requirements (66) | PASS | Organized by domain |
| Non-Functional Requirements (33) | PASS | Performance, Security, Scalability, Accessibility, Reliability, Integration |

### Sections Missing or Incomplete

| Missing Section | Impact | Recommendation |
|----------------|--------|----------------|
| Static / Marketing Pages | MAJOR | prompt.md specifies /about, /privacy, /terms, /contact, /artists pages. PRD has SEO landing pages in scope but no FR for static content pages. Add FRs. |
| Error / Status Pages | MINOR | prompt.md specifies 6 error page types (expired, limit reached, 404, upload failed, payment failed, 500). No FR captures these graceful degradation requirements. |
| CI/CD & Deployment | MINOR | prompt.md describes GitHub Actions deploy flow. PRD is silent on deployment pipeline. This is arguably an architecture concern, but a deployment FR or NFR would anchor it. |
| Data Model / Schema | INFO | prompt.md includes a detailed database schema. PRD correctly defers this to architecture, but should reference it exists as input. |

**Section Completeness: 85%** -- The PRD covers all major structural sections expected for a greenfield web application. The gaps are primarily in static page requirements and error handling, which are important but not structural.

---

## 2. Functional Requirements Coverage Analysis

### FRs Traced to Source Documents -- Gap Analysis

The following capabilities are described in the product brief and/or prompt.md but have **NO corresponding FR** in the PRD:

#### CRITICAL GAPS (capabilities explicitly in launch scope)

| # | Missing Capability | Source | Impact |
|---|-------------------|--------|--------|
| G1 | **Preview-only mode with watermark** | prompt.md (WeTransfer features table) | prompt.md explicitly lists this as a feature to implement for paid tiers. No FR exists. Decision needed: is this in launch scope or deferred? |
| G2 | **Transfer receipt (downloadable PDF)** | prompt.md (Transfer Success Page, NigeriaTransfer Exclusive Features) | Explicitly called out as a post-upload feature. Distillate notes "use browser print-to-PDF" but no FR captures this. |
| G3 | **Custom branding on download pages (Business tier)** | prompt.md (WeTransfer features, Paystack plan config), product brief | Business tier explicitly includes custom logo, brand colors, custom background on download page. The PRD success criteria mention white-label enterprise contracts but no FR covers the self-serve Business tier branding. |
| G4 | **"Powered by NigeriaTransfer" branding removal (Business tier)** | prompt.md (Download Page spec) | Tied to G3 -- Business tier removes platform branding. |
| G5 | **Offline upload queue with service worker** | prompt.md, product brief, PRD Executive Summary, PRD Innovation section, PRD PWA Requirements, Journey 3 (Funke) | Mentioned 6+ times in the PRD itself (Executive Summary, Innovation, PWA Requirements, Journey 3) but has zero FRs. This is described as an architectural foundation ("not a feature -- the architecture") yet is never formalized as a testable requirement. |
| G6 | **Upload session persistence across browser crash** | Journey 3 (Funke -- phone browser crashes, reopens, resumes from 97%) | Journey describes this exact scenario but no FR captures the "session persistence in localStorage" requirement that makes it possible. |
| G7 | **"Upload when on WiFi" queuing** | Journey 3 (Funke enables WiFi-only upload) | Journey describes Funke queuing uploads for WiFi. No FR exists for network-type-aware upload scheduling. |
| G8 | **Registered-free tier differentiation (5GB, 14-day expiry)** | prompt.md (File Size & Storage Strategy table) | prompt.md defines 4 tiers: Free anonymous (4GB/7d), Free registered (5GB/14d), Pro (10GB/30d), Business (50GB/60d). The PRD only has 3 tiers in its FRs (FR1/FR2/FR3): anonymous 4GB, Pro 10GB, Business 50GB. The registered-free 5GB/14-day tier is missing. Decision needed: was this intentionally collapsed, or is it an oversight? |
| G9 | **Daily transfer limits per tier** | prompt.md (Phase Rollout: Free 10/day, Pro 100/day, Business 500/day) | prompt.md specifies daily transfer count limits. No FR covers this. The PRD has rate limits (NFR11) but those are per-hour per-IP rate limits, not daily tier-based usage caps. |
| G10 | **Static pages: /about, /privacy, /terms, /contact, /artists** | prompt.md (Pages Required section) | Five static pages are specified. No FRs exist for them. The /privacy page is legally required (NDPA). The /artists page is integral to the Nigerian identity narrative. |
| G11 | **Pricing page with feature comparison** | prompt.md (Page 6: Pricing Page) | prompt.md specifies a detailed pricing page with tier comparison, FAQ section, Naira pricing. No FR. |
| G12 | **SEO technical requirements as FRs** | PRD scope, prompt.md | PRD scope lists "SEO landing pages" and mentions SSR, Open Graph, sitemap, robots.txt, schema markup in the narrative. But FRs only cover visual design (FR56-FR61) and operations (FR62-FR66). No FR for: Open Graph meta tags on download pages, sitemap.xml generation, schema markup, SEO landing page content. |
| G13 | **Expiry extension for authenticated users** | prompt.md (Dashboard: "extend expiry" action, PATCH endpoint for transfer settings) | prompt.md specifies users can extend expiry from dashboard. No FR. |
| G14 | **Transfer settings update (download limit, password) post-creation** | prompt.md (PATCH /api/user/transfers/{id}) | prompt.md defines a PATCH endpoint for updating transfer settings after creation. No FR covers modifying a live transfer. |

#### MAJOR GAPS (capabilities strongly implied or partially covered)

| # | Missing Capability | Source | Impact |
|---|-------------------|--------|--------|
| G15 | **Ad fallback behavior** | prompt.md (Download Page: "with fallback if ad doesn't load -- no blank space") | prompt.md specifies graceful ad degradation. FR46 says "display non-intrusive ad banners" but nothing about fallback when ads fail to load. |
| G16 | **File size display to recipients** | prompt.md (Download Page: file list with sizes) | Recipients need to see file sizes before downloading (critical for metered data users). FR15/FR16 cover downloading but not the file metadata display requirement. |
| G17 | **Expiry countdown display on download page** | prompt.md (Download Page: "Expires in 5 days, 3 hours") | No FR for displaying remaining time to recipients. |
| G18 | **Downloads remaining display** | prompt.md (Download Page: "47 of 50 downloads left") | No FR for displaying download count to recipients. |
| G19 | **Push notifications via PWA** | PRD PWA Requirements section | PRD lists "Push notification capability" in PWA requirements but no FR captures it. |
| G20 | **Web app manifest / Add to Home Screen** | PRD PWA Requirements section | PRD lists this in technical requirements but no FR. |
| G21 | **CORS policy configuration** | prompt.md Security Requirements | prompt.md specifies restrictive CORS (own domain only). No NFR. Relevant for security and API embeddable widget behavior. |
| G22 | **Input validation beyond file paths** | prompt.md Security Requirements | prompt.md specifies server-side input validation for all inputs, message length limits, email validation. NFR13 covers file path sanitization only. |
| G23 | **AdHang integration (Nigerian ad network)** | prompt.md Tech Stack | prompt.md specifies dual ad providers: Google AdSense + AdHang for better fill rates. PRD FR46 only mentions ads generically. The distillate decision to use AdSense only may be intentional, but this should be documented. |
| G24 | **Mobile money payment method** | prompt.md Paystack Integration | prompt.md lists mobile money as a Paystack payment method. PRD FR42 lists "card, bank transfer, or USSD" -- no mobile money. |
| G25 | **TTFB performance target** | prompt.md NFR table | prompt.md specifies TTFB < 500ms. PRD has no equivalent NFR. |

#### MINOR GAPS

| # | Missing Capability | Source | Impact |
|---|-------------------|--------|--------|
| G26 | **Blog with initial articles at launch** | prompt.md (SEO & Growth Strategy, Phase Rollout) | prompt.md includes blog at launch with 3-5 articles. PRD Phase 2 section lists blog as post-launch. Deliberate deferral? If so, fine -- but contradicts prompt.md. |
| G27 | **Referral program at launch** | prompt.md (Phase Rollout: "Monetization live from launch" includes referral) | prompt.md lists referral in the "build everything at once" section. PRD and distillate correctly defer to ~500 users. The conflict exists in prompt.md itself. PRD is correct. |
| G28 | **ClamAV virus scanning** | prompt.md (Phase Rollout includes it; Security Requirements recommend it) | prompt.md includes ClamAV in the "build everything at once" section. PRD and distillate correctly exclude it for resource reasons. The conflict exists in prompt.md itself. PRD is correct. |
| G29 | **Sell Your Files pages and endpoints** | prompt.md (Page 5, API endpoints for buy/sell) | prompt.md includes full Sell Your Files UI/API specs. PRD correctly defers to Phase 2. But architecture should reserve the data model for it. |
| G30 | **Connection quality indicator in upload UI** | prompt.md (ProgressBar component spec) | prompt.md specifies a "connection quality indicator" as part of the upload progress UI. No FR. |
| G31 | **"Resuming..." state indicator** | prompt.md (ProgressBar component spec) | Specific UI state for when upload is reconnecting. Partially implied by FR6 but not explicit. |
| G32 | **File type icons for non-previewable files** | prompt.md (Download Page, UploadZone component) | Display appropriate icons based on file type. Implied but not in any FR. |
| G33 | **"How it works" and trust signals below fold** | prompt.md (Homepage below the fold) | Marketing content on the homepage. Not strictly an FR but affects conversion. |
| G34 | **Open-source consideration** | prompt.md (SwissTransfer features: "Consider open-sourcing the frontend") | Noted as a consideration, not a requirement. No action needed. |

### FR Coverage Summary

- **66 FRs formalized** covering file transfer, sharing, auth, file requests, payments, API, design, operations
- **14 critical gaps** -- capabilities that are explicitly in launch scope but lack FRs
- **11 major gaps** -- capabilities implied or partially covered but missing formal requirements
- **9 minor gaps** -- mostly cosmetic or correctly deferred items

---

## 3. Non-Functional Requirements Coverage Analysis

### NFRs Present (33 total)

| Category | Count | Assessment |
|----------|-------|------------|
| Performance (NFR1-6) | 6 | Good. Covers upload, download, page load, concurrency, ZIP, R2 transfer. |
| Security (NFR7-16) | 10 | Strong. TLS, encryption, bcrypt, rate limiting, CSP, path sanitization, nanoid. |
| Scalability (NFR17-20) | 4 | Adequate. Migration, R2 independence, read replicas, upload throttling. |
| Accessibility (NFR21-25) | 5 | Solid. Touch targets, ARIA, contrast, keyboard, no-JS download. |
| Reliability (NFR26-29) | 4 | Good. Uptime, cron reliability, backup, webhook processing. |
| Integration (NFR30-33) | 4 | Good. Paystack, email, R2, API response time. |

### Missing NFR Categories

| Missing NFR | Impact | Source |
|-------------|--------|--------|
| **TTFB < 500ms** | MAJOR | prompt.md specifies this. No NFR covers server response time for page requests (distinct from NFR33 which covers API endpoints only). |
| **Time to Interactive < 5s on low-end Android** | Covered in narrative (section "Performance Targets") but NOT formalized as NFR. | PRD Web App section lists TTI < 5s on Techno Spark. Should be NFR. |
| **Largest Contentful Paint < 4s on mobile 3G** | Same -- in narrative, not formalized. | PRD Web App section. Should be NFR. |
| **Initial JS bundle size < 200KB** | Same -- in narrative and success criteria, not formalized as NFR. | PRD Web App section + Measurable Outcomes. Critical constraint. Should be NFR. |
| **CORS policy** | MINOR | No NFR for CORS configuration. |
| **Security headers (Helmet.js equivalent)** | MINOR | prompt.md specifies Helmet.js. PRD has CSP (NFR16) but no general security headers NFR. |
| **Maximum concurrent uploads target** | prompt.md says 50 simultaneous. NFR4 says 10 concurrent uploads. Significant discrepancy. | Needs reconciliation. PRD's 10 is likely more realistic for Oracle free tier. |
| **Maximum concurrent downloads target** | prompt.md says 200 simultaneous. NFR4 says 50 concurrent downloads. | Same -- needs reconciliation. |
| **Data retention / deletion compliance** | PRD narrative section covers this (90-day logs, deletion on request) but no NFR formalizes it. | Required for NDPA compliance. |
| **Backup RTO/RPO** | PRD mentions daily backups but no NFR specifies Recovery Time Objective or Recovery Point Objective. | Important for the Oracle termination risk scenario. |
| **Email deliverability SLA** | PRD risk section mentions SPF/DKIM/DMARC but no NFR for inbox delivery rate. | Affects core notification flow. |

### NFR Coverage Summary

The 33 NFRs are generally well-written and testable. However, 4 performance targets mentioned in the PRD's own narrative section are not formalized as NFRs (TTI, LCP, JS bundle, TTFB). This means they could be overlooked during implementation if developers only check the NFR list. Additionally, concurrency targets conflict with prompt.md values.

---

## 4. User Journey Coverage Analysis

### Journey Coverage Matrix

| Segment | Journey | Key Capabilities Tested | Assessment |
|---------|---------|------------------------|------------|
| Creator (domestic) | Adaeze -- Nollywood Film Editor | Upload, resume, WhatsApp share, preview, subscription upgrade | GOOD |
| Diaspora | Emeka -- Engineer in London | Password protection, cross-country, lightweight download, File Request discovery | GOOD |
| Student / General | Funke -- University Student | File Request upload, offline queue, crash recovery, WiFi optimization | GOOD -- but capabilities shown have no FRs |
| Operations | Tunde -- System Administrator | Storage monitoring, cleanup, backup, Paystack webhooks, egress tracking | GOOD |
| API Developer | Chidi -- Fintech Developer | Embeddable widget, resumable API, webhooks, documentation | GOOD |

### Journey Gaps

| Gap | Impact |
|-----|--------|
| **No business user journey** | MAJOR. Product brief lists "Nigerian businesses (law firms, HR, media)" as a primary segment with Business tier and white-label needs. No journey shows a business user managing team accounts, using custom branding, or evaluating the Business tier. |
| **No anonymous-to-registered conversion journey** | MODERATE. The core monetization path (anonymous user hits limit, upgrades) is described in success criteria but never shown as a journey. FR45 captures the trigger but the full conversion flow lacks journey validation. |
| **No payment failure / recovery journey** | MINOR. Funke's journey tests upload resilience; no journey tests payment resilience (card declined, USSD timeout, retry). |
| **No diaspora-specific payment journey** | MINOR. Emeka's journey focuses on file transfer, not on how a London-based user pays in Naira for a Pro subscription (potential FX issues with Nigerian Naira pricing from UK). |
| **Journey 3 (Funke) references capabilities with no FRs** | CRITICAL. Funke's journey is the most technically ambitious (offline queue, WiFi-only upload, crash recovery, session persistence) but none of these capabilities are formalized as FRs. The journey validates intent but cannot be traced to implementable requirements. |

---

## 5. Scope Alignment Assessment

### Product Brief Decisions vs. PRD Implementation

| Decision | Product Brief | PRD | Aligned? |
|----------|--------------|-----|----------|
| Ship all at once | "No phased MVP" | Scope section confirms "Per product owner decision: all features ship simultaneously" | YES |
| All segments | "All segments simultaneously" | 5 journeys cover creators, diaspora, students, ops, API devs | PARTIAL -- no business segment journey |
| API from day one | "Public API at launch" | FR48-FR55 cover API, Journey 5 validates | YES |
| Diaspora primary | "Elevated to primary audience" | Journey 2 (Emeka) is diaspora, narrative mentions diaspora throughout | YES |
| Sell Your Files Phase 2 | "Deferred pending legal" | Phase 2 section correctly lists it | YES |
| Paystack only | "No Flutterwave" | FR40-FR42 reference Paystack only | YES |
| No ClamAV | "Too resource-heavy" | Phase 3 (Vision) lists it for dedicated hosting | YES |
| Lightweight mode default mobile | "Not opt-in" | FR58: "enabled by default on mobile devices" | YES |
| Referral deferred | "Activate at ~500 users" | Phase 2 section | YES |

### Scope Conflicts

| Conflict | Source A | Source B | Resolution Needed |
|----------|---------|---------|-------------------|
| **Registered-free tier** | prompt.md defines 4 tiers including "Free (registered) 5GB/14d" | PRD has 3 tiers: anonymous 4GB, Pro, Business | Decide: is registered-free a separate tier or was it intentionally collapsed? |
| **Blog at launch** | prompt.md "build everything at once" includes blog with 3-5 articles | PRD Phase 2 lists blog | PRD decision appears intentional. Document explicitly. |
| **Daily transfer limits** | prompt.md: Free 10/day, Pro 100/day, Business 500/day | PRD: no daily limits, only rate limits (per-hour per-IP) | Decide: are daily tier-based transfer caps in scope? |
| **Concurrent upload/download limits** | prompt.md: 50 uploads, 200 downloads simultaneous | PRD NFR4: 10 uploads, 50 downloads | PRD values are realistic for Oracle free tier. Document the trade-off. |
| **Sell Your Files pages in architecture** | prompt.md includes full /buy/{shortCode} page spec + API endpoints | PRD defers all Sell Your Files | Architecture should still reserve the data model and URL patterns for Phase 2. |
| **White-label / custom branding** | Product brief + prompt.md: Business tier self-serve branding at launch | PRD: mentions white-label in success criteria (enterprise contracts) but no FR for self-serve Business tier branding | Critical gap -- this is a paid-tier feature that drives revenue. |

---

## 6. Traceability Analysis

### FR-to-Journey/Success Criterion Traceability

| FR Group | Traceable To | Issues |
|----------|-------------|--------|
| FR1-FR19 (File Transfer) | Journey 1 (Adaeze), Journey 3 (Funke), Success: upload completion >90% | GOOD |
| FR20-FR26 (Sharing) | Journey 1 (WhatsApp), Journey 2 (WhatsApp + password), Success: >50% WhatsApp share | GOOD |
| FR27-FR34 (Auth & Dashboard) | Journey 2 (account discovery), Success: 10K registered users | GOOD |
| FR35-FR39 (File Requests) | Journey 2 (lawyer discovers), Journey 3 (department portal) | GOOD |
| FR40-FR47 (Payments) | Journey 1 (upgrade flow), Success: MRR targets | GOOD |
| FR48-FR55 (API) | Journey 5 (Chidi), Success: 3-5 SaaS integrations | GOOD |
| FR56-FR61 (Design) | Journey 1 (art backgrounds), Success: national identity positioning | MODERATE -- FR61 (artist credit) is traceable but no journey validates it |
| FR62-FR66 (Operations) | Journey 4 (Tunde) | GOOD |

### Orphan Requirements (FRs not traceable to any journey or success criterion)

- **FR22 (QR code generation):** No journey uses QR codes. Mentioned in prompt.md as important for in-person sharing. Low risk -- it is straightforward.
- **FR61 (Artist credit display):** No journey validates this interaction. Minor.

### Success Criteria Without FR Coverage

| Success Criterion | FR Coverage | Gap |
|-------------------|-------------|-----|
| Upload completion >90% on 3G | FR5, FR6 cover resume | Covered by NFR4 concurrency + FR5/FR6 resume |
| Time-to-share <60s for <100MB | No FR -- this is a performance characteristic | Covered by NFR1 + general UX |
| Recipient experience <3 clicks | No FR | Not formalized -- should be a usability NFR or acceptance criterion |
| >50% WhatsApp sharing | FR20 covers WhatsApp share | FR present but no analytics FR for measuring share method |
| 1-2% free-to-paid conversion | FR45 (upgrade prompts) | Partially covered. No FR for tracking conversion funnel. |
| White-label enterprise contract in 6 months | NO FR for white-label or custom branding | CRITICAL -- success criterion has no supporting requirement |

---

## 7. Testability Assessment

### Well-Specified (Testable) Requirements

The majority of FRs and NFRs are testable as written. Notable strengths:

- NFRs include specific measurement methods (e.g., "as measured by Lighthouse," "as measured by server-side timing," "as measured by cron logs")
- FRs use concrete values (4GB, 10GB, 50GB, 5MB chunks, 7/30/60 days, bcrypt)
- Rate limits specify exact thresholds (5/minute, 10/hour, 50/hour, 100/hour)

### Vague or Untestable Requirements

| Requirement | Issue | Recommendation |
|-------------|-------|----------------|
| FR45: "System displays targeted upgrade prompts when users approach tier limits" | What constitutes "approach"? 80%? 90%? 95%? | Specify threshold: e.g., "at 80% and 95% of file size, storage, or download count limits" |
| FR46: "non-intrusive ad banners" | "Non-intrusive" is subjective | Specify: "single banner ad below the download card; no popups, interstitials, or auto-playing video/audio" |
| FR56: "full-bleed rotating Nigerian artwork" | How many images? Rotation frequency? | Specify: "minimum 10 images at launch; new image on each page load (random selection)" |
| FR60: "System displays bandwidth estimate before upload begins" | How is bandwidth estimated? What is the accuracy target? | Specify measurement method (small probe download, navigator.connection API) |
| NFR20: "safe IOPS threshold (configurable, default 10)" | How is IOPS consumption measured in real-time? | Specify proxy metric: concurrent active tus upload sessions |
| FR35: "file request portal with a title and message" | Maximum title length? Message length? File size limits on request uploads? | Specify character limits and whether request uploads follow the same tier limits as regular uploads |

---

## 8. Risk Coverage Assessment

### Distillate Risks vs. PRD Coverage

| Risk (from distillate) | PRD Coverage | Assessment |
|------------------------|-------------|------------|
| Oracle Cloud account termination | Risk Mitigations section + NFR17 + NFR28 | GOOD -- R2 decoupling, daily backups, migration runbook |
| Storage IOPS bottleneck | Risk Mitigations section + NFR20 | GOOD -- upload throttling specified |
| Egress overage (10TB/month) | FR66 + Risk Mitigations | GOOD -- R2 mitigates download egress, monitoring specified |
| Email deliverability | Risk Mitigations section | PARTIAL -- mentions SPF/DKIM/DMARC but no pre-launch domain warming timeline or deliverability NFR |
| Low Nigerian ad CPM | Product Brief risk section | PARTIAL -- PRD mentions ads supplementary but no explicit fallback strategy |
| Paystack fees eating margin | Product Brief risk section | PARTIAL -- PRD doesn't address fee impact on NGN 2,000 Pro tier (6.5% fee) |
| NDPA cross-border compliance | Domain-Specific Requirements section | GOOD -- SCCs, legal basis, privacy policy requirements |
| Sell Your Files regulatory | Phase 2 deferral | GOOD -- correctly deferred |
| Resource contention on single VM | Risk Mitigations + separate micro VM | GOOD |
| Opera Mini Extreme incompatibility | NFR25 (download page works without JS) | GOOD |
| JS bundle size exceeding target | Mentioned in narrative but NOT formalized as NFR | MAJOR GAP -- the 200KB target is aspirational and not enforceable without an NFR |

### Unaddressed Risks

| Risk | Source | Impact |
|------|--------|--------|
| **Abuse / malicious file hosting** | Not in any document | HIGH. Without ClamAV, NigeriaTransfer could be used to distribute malware, copyrighted content, or illegal material. No FR covers abuse reporting, content takedown, or DMCA/NCC compliance. At minimum, need: (1) Abuse report mechanism, (2) Content takedown process, (3) Terms of Service enforcement capability. |
| **Account fraud / subscription abuse** | Not addressed | MODERATE. Users could create multiple free accounts to circumvent tier limits. No FR addresses account deduplication or abuse detection. |
| **R2 cost escalation** | Partially in distillate | MODERATE. R2 is $0.015/GB/month after 10GB free. A viral product could accumulate significant storage costs. No budget threshold or cost monitoring FR exists. |
| **Paystack downtime** | Not addressed | MODERATE. If Paystack is unavailable, subscription creation and payment verification fail. No FR for graceful payment degradation or retry. |
| **Domain/brand squatting** | Not addressed | LOW. "NigeriaTransfer" as a brand name -- has the domain been secured? Related domains? Trademark filing? |

---

## 9. Open Questions Requiring Resolution Before Development

### MUST RESOLVE (Blocks Architecture)

| # | Question | Context | Recommendation |
|---|----------|---------|----------------|
| OQ1 | **Is there a registered-free tier (5GB/14d) or not?** | prompt.md defines 4 tiers; PRD has 3. This affects the entire tier enforcement system, database schema, and UI. | Decide now. If yes, add FRs. If no, document the deliberate simplification. |
| OQ2 | **Are daily transfer limits per tier in scope?** | prompt.md specifies 10/100/500 per day. PRD has only per-IP rate limits. These are fundamentally different mechanisms. | Decide now. Daily limits require tier-aware counting infrastructure. |
| OQ3 | **Is custom branding (Business tier) in launch scope?** | Product brief and prompt.md include it. PRD success criteria depend on it (white-label contract in 6 months). No FR exists. | Decide now. If yes, add FRs for logo upload, color customization, background image, branding removal. If no, adjust success criteria. |
| OQ4 | **Is preview-only mode with watermark in launch scope?** | prompt.md includes it as a WeTransfer-inspired feature. PRD is silent. | Decide now. This is a significant feature (requires watermark generation pipeline). |
| OQ5 | **What is the API pricing model?** | Distillate flags this as an open question. PRD mentions rate limiting per tier but no API-specific pricing. | Decide before architecture. Per-GB? Per-call? Monthly flat? This shapes the API metering infrastructure. |
| OQ6 | **Framework choice: Next.js vs. Astro vs. other?** | PRD narrative mentions this as an open architectural decision. The 200KB JS bundle target is extremely aggressive for Next.js + React. | Decide during architecture phase. But the PRD should formalize the 200KB target as an NFR so the architect has a hard constraint. |
| OQ7 | **Email provider selection** | Distillate lists this as open. PRD mentions Brevo but hedges. At 57 transfers/day with ~5 emails each, free tiers are insufficient. | Decide now. Budget for paid tier from day one. Affects infrastructure cost model. |

### SHOULD RESOLVE (Blocks Detailed Design)

| # | Question | Context |
|---|----------|---------|
| OQ8 | **Diaspora pricing currency** | Distillate asks: same Naira pricing or add USD/GBP/EUR tiers? Paystack supports multi-currency but implementation differs. |
| OQ9 | **File request upload limits** | Do file request uploads follow the requester's tier limits or the uploader's (who may be anonymous)? FR37 says anonymous upload but doesn't specify size limits. |
| OQ10 | **Background art sourcing budget and licensing** | Distillate suggests NGN 5K-10K per image for 10-15 images. This is a launch blocker if art is not secured. |
| OQ11 | **Abuse reporting and content moderation** | No mechanism exists for reporting malicious content. Legal exposure risk. |
| OQ12 | **Offline queue implementation scope** | The PRD mentions offline queuing 6+ times but has zero FRs. How sophisticated should this be? Full service worker with IndexedDB? Or just tus resume capability? |

---

## 10. Summary of Findings

### By Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 14 | Missing FRs for: offline queue, session persistence, WiFi upload, custom branding, preview-only mode, registered-free tier, daily limits, static pages, pricing page, SEO FRs, expiry extension, transfer update, transfer receipt, plus Journey 3 untraceable |
| MAJOR | 11 | Missing NFRs for: TTFB, TTI, LCP, JS bundle size. Missing: business user journey, abuse/moderation, ad fallback, file metadata display, push notifications, CORS, concurrency discrepancy |
| MINOR | 9 | Blog scope conflict, connection indicator, file type icons, marketing content, error pages, CI/CD, open-source consideration, mobile money payment |

### What the PRD Does Well

1. **Resilience narrative is strong.** The PRD tells a compelling and consistent story about building for Nigerian internet reality. The innovation section, executive summary, and journeys all reinforce this.
2. **Security NFRs are thorough.** 10 security-focused NFRs with specific values (bcrypt rounds, rate limit thresholds, nanoid length).
3. **Risk mitigations are practical.** Oracle termination risk is well-addressed with R2 decoupling, daily backups, and a 1-hour migration runbook.
4. **Journeys are vivid and actionable.** Each journey tells a real story that an engineer can use to validate their implementation.
5. **Domain compliance is addressed.** NDPA, cross-border data transfer, Paystack PCI handling -- all covered.
6. **Phase boundaries are clear.** Sell Your Files, referral program, and ClamAV are cleanly deferred with stated rationale.

### What Needs Work Before Architecture

1. **Formalize the 14 critical missing FRs.** Most importantly: offline queue, custom branding, static/marketing pages, and the registered-free tier decision.
2. **Promote 4 performance targets from narrative to NFRs.** TTI, LCP, JS bundle size, and TTFB must be formal NFRs or they will be treated as aspirational.
3. **Add a business user journey.** The Business tier is the highest-revenue segment. Its user experience needs journey validation.
4. **Resolve the 7 must-resolve open questions.** Especially OQ1 (tier structure), OQ3 (custom branding), and OQ5 (API pricing).
5. **Add abuse/moderation requirements.** Even minimal: abuse report link on download pages, admin ability to disable transfers, ToS violation workflow.
6. **Reconcile concurrency targets.** Document that NFR4 (10/50) is the realistic Oracle free-tier target, explicitly superseding prompt.md (50/200).

---

## 11. Verdict

**READY_WITH_CONCERNS -- Confidence 72/100**

The PRD is structurally complete and demonstrates strong product thinking. The scope decisions are well-reasoned, the journeys are compelling, and the risk mitigations are practical. However, there are 14 critical gaps where capabilities described in the source documents (and in some cases in the PRD's own narrative) lack formal functional requirements. The most concerning pattern is that the PRD's strongest narrative theme -- resilience and offline capability -- has zero FRs to anchor it.

The PRD can proceed to architecture with the understanding that the critical gaps identified above must be resolved during or immediately after architecture and before epic/story decomposition. The 7 must-resolve open questions should be decided by the product owner before the architect begins, as they affect fundamental system design (tier structure, API pricing, branding infrastructure, framework choice).

If the 14 critical FRs are added and the 7 must-resolve questions are answered, the confidence score would rise to approximately 88/100.
