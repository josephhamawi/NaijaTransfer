---
title: "Product Brief Distillate: NigeriaTransfer"
type: llm-distillate
source: "product-brief-transfer.md"
created: "2026-03-28"
purpose: "Token-efficient context for downstream PRD creation"
---

## Decided Scope & Strategy

- Ship all features at once -- no phased MVP, no sequenced rollout
- Target all user segments simultaneously at launch (creators, businesses, students, diaspora, general public)
- API/infrastructure vision is core from day one, not a future pivot
- Diaspora is a primary audience (elevated from secondary)
- **Sell Your Files is deferred to Phase 2** -- requires Nigerian fintech lawyer consultation on: VAT (7.5% above ₦25M), AML, payment facilitator licensing, buyer refund policy, seller agreements
- Paystack only at launch (no Flutterwave)
- No ClamAV at launch (resource contention on 24GB VM)
- Lightweight mode is DEFAULT on mobile (not opt-in)
- Referral program deferred to ~500 users

## Rejected Ideas (Do Not Re-Propose)

- **Phased/MVP launch** -- user explicitly wants full feature set shipped at once
- **Sequential user segment targeting** -- user rejected Nollywood-first strategy; all segments at launch
- **Sell Your Files at launch** -- deferred for legal/regulatory reasons, not product reasons
- **Flutterwave integration** -- unnecessary complexity; Paystack only unless reliability issues
- **ClamAV virus scanning** -- too resource-heavy for shared VM; defer to dedicated hosting
- **Native mobile apps** -- PWA first
- **Lower pricing tier (₦500-₦1,000)** -- not adopted; sticking with ₦2,000 Pro / ₦10,000 Business
- **PDF receipt generation server-side** -- use browser print-to-PDF instead (avoids puppeteer/Chromium dependency)

## Requirements Hints (Not Yet Formalized)

- **Public API from day one:** Embeddable upload widget + transfer management endpoints + documentation. Target: Nigerian SaaS companies (fintechs, HR platforms, legal tech) embedding file transfer in their products
- **White-label capability for Business tier:** Custom logo, brand colors, custom background on download page. Enterprise white-label at ₦50K-₦500K/month
- **Paystack split payments architecture:** When Sell Your Files launches in Phase 2, use Paystack's split payment (automatic settlement to seller bank accounts). No manual payouts, no holding funds. Minimum platform fee: ₦50 or 5%, whichever is greater
- **Email sending will hit limits fast:** 57 transfers/day × ~5 emails each = 285 emails/day. Brevo free tier (300/day) barely covers it. Budget for paid email tier early. Must set up SPF/DKIM/DMARC and warm domain 2-4 weeks before launch
- **Opera Mini Extreme mode incompatibility:** Accept that full upload flow won't work in Opera Mini Extreme (it renders server-side, no JS). Ensure download page degrades gracefully -- download link must work without JS. Target Opera Mini normal mode, Chrome, Samsung Internet as primary browsers
- **Storage IOPS bottleneck:** Oracle free-tier block storage has ~3,000 baseline IOPS for 200GB. With 20 concurrent uploads + downloads + DB writes, IOPS becomes bottleneck before RAM/CPU. Implement upload queue/throttling when concurrent uploads exceed 5-10 simultaneous
- **Egress monitoring needed:** Oracle free tier = 10TB/month. A viral 3.5GB file with 1,000 downloads = 3.5TB in one event. Implement real-time egress monitoring and automatic throttling near the 10TB limit. Files on R2 mitigate this (downloads served from R2, not Oracle)
- **Conversion triggers must be explicit:** Don't just feature-gate -- actively show: "You've used 3.8GB of your 4GB limit -- upgrade for 10GB." Design upsell flows at moment of friction
- **Background art sourcing:** Budget ₦5,000-₦10,000 per image for 10-15 licensed photos from Nigerian photographers. Don't rely on "exposure" for professional artists at zero traffic. Use royalty-free Nigerian photography from Unsplash/Pexels as fallback

## Technical Constraints

- **Oracle Cloud ARM VM:** 4 OCPU, 24 GB RAM, Ubuntu 22.04 aarch64. Compute only -- no file storage
- **Cloudflare R2:** File storage. 10GB free, then $0.015/GB/month. Zero egress. Files served directly from R2 (not through Oracle)
- **Oracle block storage (200GB):** Used ONLY for temporary tus upload chunks before transfer to R2. Not for permanent file storage
- **Separate micro VM:** Umami + Uptime Kuma on free Oracle AMD micro instance (not on main VM)
- **Stack:** Next.js 14+ (App Router), PostgreSQL 16, Prisma ORM, tus (@tus/server), Tailwind CSS 4, shadcn/ui, Auth.js v5 (magic link + Google OAuth + phone OTP), Caddy reverse proxy, PM2 process manager
- **JS bundle target:** < 200KB initial. Realistic concern: Next.js + React + all client deps will likely be 400-800KB. Aggressive code splitting required. Consider if Astro or server-rendered approach (htmx/Alpine) would hit targets more easily -- this is a PRD-stage architectural decision
- **Test on real devices:** Tecno Spark, Infinix Hot -- low-end Android (2-3GB RAM, MediaTek CPU). React hydration alone takes 3-5s on these devices

## Competitive Intelligence

- **WeTransfer free:** 2GB, 7 days, no resume, USD pricing for Pro ($12/month), iconic wallpaper design, file previews, sell-your-transfer feature
- **SwissTransfer free:** 50GB, 30 days, password protection free, no account needed, QR sharing, mobile apps, no ads -- funded by parent company Infomaniak
- **Google Drive:** 15GB free but requires sign-up, "request access" flow is hostile, works for most professional use cases
- **Telegram:** 2GB file transfers, no compression -- growing indirect competitor
- **Selar (Nigeria):** Digital file sales platform with established creator base -- direct competitor to Sell Your Files when it launches
- **WhatsApp:** 2GB cap, compresses media, no control. 93% of Nigerian internet users. "Good enough" for most -- NigeriaTransfer must position as "what you use when WhatsApp can't handle it"

## Open Questions for PRD

1. **Framework decision:** Next.js 14+ (App Router) vs Astro vs server-rendered approach -- which actually hits < 200KB JS bundle on low-end Android? Benchmark needed
2. **R2 upload flow:** Does tus server write chunks to local disk then transfer to R2, or can we stream directly to R2? Latency and complexity implications
3. **API pricing model:** Per-GB transferred? Per-API call? Monthly flat rate? Tiered?
4. **NDPA cross-border compliance:** Which Oracle Cloud region hosts the VM? Do Oracle's standard DPA terms satisfy NDPA adequacy requirements?
5. **Email provider decision:** Resend (100/day free) vs Brevo (300/day free) vs budget for paid tier from day one?
6. **Business tier pricing:** ₦10,000/month may be underpriced for the value (custom branding, API, file requests). Test ₦15,000-₦25,000 in quarter 2?
7. **Diaspora pricing:** Same Naira pricing or add USD/GBP/EUR tiers for diaspora users?
8. **Background art:** License from Nigerian photographers (₦5K-10K/image) or use royalty-free? How to scale the artist program post-launch?

## Opportunity Backlog (Post-Launch)

HIGH impact opportunities identified by the review panel, prioritized:
1. **WhatsApp Business API bot** -- send file to WhatsApp number, get transfer link back (MEDIUM difficulty)
2. **University partnerships** -- institutional licenses with .edu.ng SSO, starting with UNILAG/OAU (MEDIUM difficulty)
3. **MTN/Airtel zero-rating partnership** -- NigeriaTransfer traffic doesn't count against data bundle (HIGH difficulty, transformative impact)
4. **Campus ambassador program** -- free premium accounts for student ambassadors at top 20 universities (LOW difficulty)
5. **"State of File Sharing in Nigeria" annual report** -- data report for earned media in TechCabal/Techpoint (LOW difficulty)
6. **USSD shortcode for file retrieval** -- recipients get SMS with download link via *384*123# (MEDIUM difficulty)
7. **WordPress/WooCommerce plugin** -- digital product delivery via NigeriaTransfer (LOW difficulty)
8. **Oil & gas managed file transfer** -- enterprise tier for Shell/TotalEnergies/NNPC seismic data (HIGH difficulty, very high ARPU)
9. **"Japa Document Vault"** -- persistent encrypted storage for emigration paperwork (LOW difficulty, great content marketing hook)
10. **NITDA/government procurement** -- secure file sharing for ministries (HIGH difficulty, transformative if landed)
