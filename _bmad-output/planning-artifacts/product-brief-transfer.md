---
title: "Product Brief: NigeriaTransfer"
status: "complete"
created: "2026-03-28"
updated: "2026-03-28"
inputs:
  - prompt.md
  - docs/competitive-landscape-research.md
reviewed_by:
  - Skeptic Reviewer (20 findings)
  - Opportunity Reviewer (28 findings)
  - GTM & Launch Risk Reviewer (10 findings)
decisions:
  - "Ship all features at once — no phased MVP"
  - "Launch targeting all user segments simultaneously"
  - "API/infrastructure vision from day one"
  - "Diaspora elevated to primary audience"
  - "Sell Your Files deferred to Phase 2 (pending legal consultation)"
---

# Product Brief: NigeriaTransfer

*"Send large files. No account. No wahala."*

## Executive Summary

Nigeria has 109 million internet users and not a single homegrown file transfer service. Every day, millions of Nigerians wrestle with WhatsApp's 2GB cap and file compression, Google Drive's mandatory sign-up, or WeTransfer's sluggish performance from West Africa and USD-only pricing. The workaround for large files is still a USB drive passed hand-to-hand.

**NigeriaTransfer** changes this. It is a free, no-account-required file transfer service purpose-built for Nigerian internet reality -- resumable uploads that survive flaky connections, WhatsApp-native sharing, Naira pricing, USSD payments for users without bank cards, and a lightweight mode that respects expensive mobile data. The free tier offers 4GB transfers (double WeTransfer's 2GB), with paid tiers at NGN 2,000/month and NGN 10,000/month for professionals and businesses.

At launch, NigeriaTransfer provides **File Request Portals** (businesses create upload links for collecting documents from anyone) and a public **API for Nigerian SaaS companies** to embed file transfer into their own products. Post-launch Phase 2 adds **Sell Your Files** (creators set a Naira price, buyers pay via Paystack, instant download) once legal/regulatory compliance is confirmed.

The service launches on Oracle Cloud's always-free tier ($0/month compute) with files stored on Cloudflare R2 (zero egress fees), creating a near-zero cost structure from day one. NigeriaTransfer is not just a transfer tool -- from day one, it is designed as **Africa's file infrastructure layer**: the platform that connects African creators, businesses, institutions, and the diaspora to their files.

## The Problem

A Lagos-based film editor finishes a 3.5GB cut of a Nollywood scene. She needs to send it to the director in Abuja. Her options:

- **WhatsApp:** Compresses the video to unwatchable quality. Cap is 2GB anyway.
- **Google Drive:** The director doesn't have a Google account and doesn't want one. She has to walk him through sign-up on the phone.
- **WeTransfer:** Free tier is only 2GB. The upload crawls from Lagos, then fails at 87% -- no resume capability. To upgrade, she'd need to pay $12/month in USD, which her Naira debit card may decline due to FX spend limits.
- **USB drive:** She puts the file on a flash drive and sends it with someone traveling to Abuja. It arrives in 18 hours.

Meanwhile, a Nigerian software engineer in London needs to send scanned property documents to a lawyer in Port Harcourt. The lawyer doesn't use Google Drive. WeTransfer compresses the images. Email bounces the 25MB attachment. The engineer ends up printing, scanning at lower quality, and emailing in batches.

This is the daily reality for 109 million Nigerian internet users at home and 15-17 million in the diaspora. The file transfer problem in Nigeria is unsolved because no service has been designed from the ground up for the constraints of this market: unstable connections, mobile-first usage (75%+ of traffic), expensive metered data, Naira-denominated commerce, and the dominance of WhatsApp as the communication layer.

The real competitor is not WeTransfer or Google Drive. It is **inertia** -- the habit of "just share it on WhatsApp" or "just use a USB drive." NigeriaTransfer must win the specific moment when those workarounds fail.

## The Solution

NigeriaTransfer is a web-based file transfer service where anyone can upload files (up to 4GB free, 50GB for Business tier), get a shareable link, and send it -- no account required. Recipients click the link, preview files, and download. That's it.

What makes it work for Nigeria:

- **Resumable uploads and downloads.** When the connection drops at 73%, it picks up at 73%. Built on the tus protocol with 5MB chunks. This is the single most important technical differentiator -- WeTransfer has no resume; a failed upload from Lagos means starting over.
- **WhatsApp and SMS sharing.** One tap to share the download link via WhatsApp deep link. Not "copy link, switch to WhatsApp, paste." One tap. In a market where 93% of internet users are on WhatsApp, this is the viral loop.
- **Naira pricing, USSD payments.** Pro at NGN 2,000/month. Pay with card, bank transfer, or USSD code -- no smartphone or international card required.
- **Lightweight mode (default on mobile).** Automatically strips background art, animations, and preview thumbnails for users on metered data. Full experience is opt-in, not opt-out. This respects the reality that Nigerian data is expensive.
- **Bandwidth estimator.** Before uploading, see: "This will take approximately 12 minutes on your connection." Helps users on slow networks make informed decisions.
- **File Request Portals.** Businesses create an upload link and share it: "Submit your CV here." No sign-up needed from the uploader.
- **Public API.** Nigerian SaaS companies can embed NigeriaTransfer into their own products for file handling (KYC documents, statements, uploads) from day one. This is not a future feature -- it is the infrastructure vision launching with the product.

The experience is wrapped in full-bleed rotating Nigerian artwork -- Lagos skylines, cultural photography, Nollywood stills, textile patterns -- with artist credits and links. Like WeTransfer made file transfer beautiful for the world, NigeriaTransfer makes it beautiful and functional for Nigeria.

## What Makes This Different

**1. Built for Nigerian internet, not adapted to it.** Every design decision starts with: "What happens when the connection drops?" Resumable uploads, offline queuing, bandwidth estimation, and lightweight mode are not features -- they are the foundation. No foreign file transfer service has this DNA.

**2. First-mover in an empty market.** There is no Nigerian file transfer service. No African one either. SwissTransfer proved that national branding ("Swiss = privacy") creates trust and loyalty that features alone cannot replicate. "Nigerian-owned, built for Nigerians" is not marketing -- it is the moat. A competitor can copy features; they cannot copy being first or being "ours."

**3. Infrastructure from day one.** NigeriaTransfer launches with a public API so Nigerian SaaS companies (fintechs, HR platforms, legal tech) can embed file transfer into their own products. This positions NigeriaTransfer as the "Cloudinary for Nigerian file transfer" -- not just an app, but a platform layer. A single white-label enterprise contract can equal thousands of consumer subscriptions.

**4. File Request Portals.** Businesses create an upload link: "Submit your CV here," "Upload project files here." HR departments, legal firms, media companies, and schools get a professional document collection tool -- no account required from the uploader, no IT department needed for the requester.

**5. Serves the diaspora.** 15-17 million Nigerians abroad need to transfer documents home -- immigration paperwork, school transcripts, property documents, family media. Western tools don't integrate with Paystack or understand Naira needs. NigeriaTransfer bridges this gap with a tool built for both ends of the corridor.

**6. Near-zero cost structure.** Oracle Cloud provides free compute (4 CPUs, 24GB RAM). Cloudflare R2 provides file storage with zero egress fees. This creates a business that can survive indefinitely without revenue pressure, removing the most common startup killer: burn rate.

## Who This Serves

All segments launch simultaneously. No sequenced rollout.

**Primary: Nigerian creative professionals** -- Nollywood film editors, music producers, photographers, graphic designers, freelancers. They transfer large files multiple times daily and feel the pain most acutely. Highest transfer frequency, strongest word-of-mouth network, highest willingness to pay NGN 2,000/month because the tool directly impacts their income. Every file they send exposes a new recipient to NigeriaTransfer's download page.

**Primary: Nigerian diaspora** -- 15-17 million Nigerians in the UK, US, Canada, and beyond sending documents home. Immigration paperwork, school transcripts, property documents, family photos and videos. Higher willingness to pay than domestic users, already primed to use Nigeria-specific digital tools, and currently underserved by every Western file transfer service. The diaspora is not an afterthought -- it is a primary revenue driver with higher ARPU and lower churn.

**Primary: General Nigerian internet users** -- students sharing projects, families sharing photos and videos, anyone sending files too large for WhatsApp. They use the free tier, see ads on download pages, and represent the mass adoption engine. 109 million internet users is the TAM.

**Primary: Nigerian businesses** -- law firms sharing contracts, HR departments collecting documents, media agencies distributing assets, real estate firms exchanging property documents, banks processing KYC. They need custom branding, audit trails, API access, and team accounts. They pay NGN 10,000/month for self-serve or negotiate white-label contracts at NGN 50,000-500,000/month. Highest LTV segment.

**API consumers: Nigerian SaaS companies** -- fintechs, HR platforms, legal tech, edtech, healthtech. They need file upload/transfer capabilities in their own products but don't want to build and maintain file infrastructure. NigeriaTransfer becomes their file handling layer via API, charging per GB transferred or per API call.

## Success Criteria

**User adoption:** 10,000 registered users within 12 months. 50,000 within 24 months. (Conservative baseline; stretch target: 25,000 / 100,000.)

**Revenue (realistic timeline):**
- Month 6: NGN 100,000 MRR (~$65)
- Month 12: NGN 500,000-1,000,000 MRR (~$325-$650)
- Month 18: NGN 1,500,000 MRR (~$975)
- Month 24: NGN 6,000,000+ MRR (~$3,900)
- Revenue sources: subscriptions (primary), API/white-label contracts (high-value), Sell Your Files commissions post-Phase 2 (secondary), ads (supplementary)

**Reliability:** Upload success rate above 90% on 3G connections. Uptime above 99.5%. File cleanup lag under 2 hours post-expiry. Storage utilization monitored with automatic upload rejection at 85% capacity.

**Engagement:** 1-2% free-to-paid conversion rate (realistic for Nigerian market). Explicit conversion triggers: "You've used 3.8GB of your 4GB limit -- upgrade for 10GB."

**API adoption:** 3-5 Nigerian SaaS companies integrating the API within 12 months. 1 white-label enterprise contract within 6 months.

## Scope

**In for launch (all features, ship at once):**
- Upload, download, link sharing, email transfer
- Resumable uploads/downloads (tus protocol)
- Password protection (free for all tiers), configurable expiry, download limits
- File previews (image, video, PDF)
- WhatsApp, SMS, QR code sharing
- Paystack subscriptions (Pro + Business tiers, Naira, card/bank/USSD)
- Ad integration on free-tier download pages (Google AdSense)
- File Request portals
- Public API with documentation (embeddable upload widget, transfer management endpoints)
- User dashboard with transfer management and analytics
- Rotating Nigerian art backgrounds (10-15 licensed images at launch)
- Lightweight mode (default on mobile), bandwidth estimator
- Dark mode
- SEO landing pages
- Self-hosted analytics (Umami) and monitoring (Uptime Kuma)
- Storage monitoring with auto-rejection at 85% capacity
- Tested 1-hour migration plan to paid hosting (Hetzner, $4.50/month)

**Phase 2 (post-launch, after legal/regulatory consultation):**
- Sell Your Files (Paystack split payments, 5% commission) -- requires: VAT compliance review, seller agreement, buyer refund policy, AML assessment, fintech lawyer sign-off
- Referral program (activate at ~500 users)
- Blog content
- Chrome browser extension
- WhatsApp Business API bot (send file to WhatsApp number, get link back)

**Out for v1:**
- Native mobile apps (PWA first, native later)
- WebRTC peer-to-peer transfers
- Client-side zero-knowledge encryption
- Multi-language support (English only at launch)
- Team management features beyond basic Business tier
- ClamAV virus scanning (deferred -- too resource-heavy for shared VM; add when on dedicated hosting)
- Flutterwave integration (Paystack only at launch)

## Risk Mitigation

**Oracle Cloud account termination (existential risk):** Oracle has documented patterns of terminating free-tier accounts without warning. Mitigation: Store all user files on Cloudflare R2 (not on Oracle block storage), so compute and storage are decoupled. Daily database backups to Cloudflare R2. Tested, documented 1-hour recovery runbook to migrate to Hetzner Cloud ($4.50/month). Migrate to paid hosting the moment monthly revenue exceeds NGN 50,000.

**Storage scaling:** With files on Cloudflare R2 (10GB free, then $0.015/GB/month, zero egress), storage grows independently from compute. Oracle block storage is used only for temporary tus upload chunks before transfer to R2. No ceiling on total storage -- R2 scales with usage and cost stays near zero thanks to zero egress fees.

**Resource contention on single VM:** Run only essential services on the Oracle VM (Node.js, PostgreSQL, Caddy). Umami and Uptime Kuma run on a separate free Oracle AMD micro VM. No ClamAV at launch.

**Low Nigerian ad CPM ($0.10-$0.50):** Ads are supplementary revenue only (~10-20% of total). Subscriptions and API/enterprise contracts are the revenue drivers. Do not invest significant engineering time in ad optimization.

**Payment processing fees:** Paystack takes 1.5% + NGN 100 per transaction. On Pro subscriptions (NGN 2,000), that is 6.5%. Financial model accounts for Paystack fees on all revenue projections.

**Sell Your Files regulatory risk:** Deferred to Phase 2. A Nigerian fintech lawyer must confirm: VAT obligations (7.5% above NGN 25M turnover), AML requirements, consumer protection (refund policy for failed downloads), and whether NigeriaTransfer needs a payment facilitator license. Do not launch this feature until legal sign-off is obtained.

**NDPA compliance:** Oracle Cloud servers are outside Nigeria (likely EU or South Africa region). Cross-border data transfer requires: Standard Contractual Clauses with Oracle and Cloudflare, documented legal basis in privacy policy, DPA agreements with all third-party processors. Compliance with Nigeria Data Protection Act 2023 and NDPC enforcement guidance.

## Vision

NigeriaTransfer is not a file transfer app with an API bolted on. It is **file infrastructure for Nigeria** that happens to have a consumer-facing app as its most visible surface.

**Year 1:** Establish NigeriaTransfer as the go-to file transfer for all Nigerians -- creators, businesses, students, diaspora. Launch public API and sign first enterprise clients. Build community through Nigerian art backgrounds and cultural identity. Validate product-market fit across all segments simultaneously.

**Year 2:** Launch Sell Your Files after legal clearance -- a Gumroad for Nigerian creators with Naira payment rails. Expand API to serve 10+ Nigerian SaaS companies as embedded infrastructure. Introduce white-label portals for enterprise clients at NGN 50,000-500,000/month. Expand to Ghana, Senegal, and Cameroon with localized pricing and payment methods. Pursue institutional contracts (universities, government ministries, NITDA).

**Year 3:** Add WebRTC peer-to-peer for truly unlimited file sizes. Deepen enterprise play with managed file transfer for oil & gas, banking, and healthcare sectors. The diaspora corridor becomes a two-way bridge -- not just files, but documents, contracts, and digital commerce flowing between Nigerians everywhere.

**Long-term positioning: Africa's file infrastructure.** The platform layer that connects African creators, businesses, institutions, and diaspora to their files -- securely, affordably, and on their own terms. The Twilio of file transfer for the African tech ecosystem.
