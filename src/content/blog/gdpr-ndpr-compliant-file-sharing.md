---
title: "GDPR, NDPR, and compliant file sharing for Nigerian agencies"
description: "The minimum a Nigerian agency sending client data to Europe has to care about, and where most consumer tools fall short."
date: "2026-04-19"
cluster: "compare"
tags: ["compliance", "gdpr", "ndpr"]
---

Two regulations apply to most Nigerian agencies sending data abroad. The Nigeria Data Protection Regulation (NDPR) and, if any of your clients or their customers are in the EU, the General Data Protection Regulation (GDPR). Ignoring either has meaningful consequences, and "I didn't know" stopped being a defense in 2020.

Most creative agencies in Lagos operate in a gray zone here. They sign NDAs, they use consumer-grade transfer tools, they hope it works out. For 95 percent of transfers, it does. For the other 5 percent, the regulatory exposure is real and the fines are material: up to 2 percent of annual gross revenue under NDPR, up to 4 percent under GDPR.

## What triggers these rules

Both regulations care about personal data: information that can identify a living person. Photos with faces, voice recordings, customer email lists, HR documents, health records. If you're sending any of that across borders, you're in scope.

What's not personal data: anonymized aggregate reports, stock footage with no identifiable subjects, your own company's branding assets. Most creative deliverables fall somewhere in between. The moment you're handing off raw footage from a wedding shoot, that's personal data of dozens of people, and moving it to a European colorist triggers GDPR.

## The compliance floor for file transfer

At minimum, a transfer tool used for regulated data needs four things:

1. **Encryption in transit.** TLS 1.2 or higher between uploader and server. Every modern tool does this. Check the certificate.
2. **Encryption at rest.** Files stored on the server should be encrypted. Most big providers do this. Read the terms.
3. **Data Processing Agreement (DPA).** If you're a data controller (you or your client) and the transfer tool is a data processor, there must be a written DPA. This is table stakes under GDPR Article 28.
4. **Data residency clarity.** You need to know where the file sits while it's on the service. EU residency is usually required for GDPR cases. African residency is preferred for NDPR cases.

Most consumer-grade transfer tools cover 1 and 2, sort of cover 3 (buried in their terms), and are vague about 4. That's the gap.

## Where consumer tools fall short

WeTransfer's residency is typically Amsterdam or Dublin for European customers. Fine for GDPR, unhelpful for pure NDPR workflows where Nigerian residency is preferred. Google Drive and Dropbox: US-based by default, EU option for enterprise tiers only. That means a GDPR-sensitive transfer through a free Google account technically involves a transfer of personal data to the US, which requires Standard Contractual Clauses or equivalent safeguards. Most agencies don't have those in place.

I audited six Lagos agencies last year as part of a compliance exercise. Zero had a signed DPA with their transfer tool of choice. Four had no idea what a DPA was. One genuinely believed their free WeTransfer account came with enterprise-grade compliance. It does not.

## The agency checklist

If you run client work in Nigeria and handle any personal data, walk through this:

- Identify the top three types of files you send that contain personal data. Usually: client media, employee records, customer lists.
- For each, know where the receiving party is located. EU, US, rest of world.
- Pick a transfer tool that signs a DPA at your price point. The business tiers of most serious tools include this; the free tiers usually don't.
- Keep a log of who you sent what and when. Download receipts help here. We've written about [tracking downloads and delivery receipts](/blog/tracking-downloads-delivery-receipts) from an ops angle, but compliance also benefits.
- If you're a real business on this, consider [the business plan](/business), which is where audit trails live.

## NDPR-specific points

The [Nigeria Data Protection Commission](https://ndpc.gov.ng/) published the 2023 General Application and Implementation Directive, which is the document you actually want to read. The key one for file transfer: cross-border transfer of personal data from Nigeria requires either explicit consent, a legal basis, or a determination that the destination country has adequate protection. The EU has been recognized. The US has not, as of this writing.

Practical translation: if you're sending customer data to a US processor, you need consent from the data subjects or a signed Standard Contractual Clause. A freelance colorist in Los Angeles is not automatically allowed to receive your client's customer list, even if your client asked you to send it. This catches agencies off guard regularly.

## What "good enough" looks like

For most Lagos agencies doing creative work (not fintech, not health, not legal), the realistic bar is:

Use a transfer tool with TLS + encryption at rest + password + download limit + short expiry + a DPA in the paid tier. Keep a simple log. Sign data sharing agreements with recurring clients. Don't send regulated data over free-tier tools.

That combination will survive an NDPR audit and will hold up on most GDPR reviews for non-health, non-financial data. It won't save you if you're moving sensitive categories (biometrics, health, criminal records), for which you need specialist tools.

The standard [gdpr.eu explainer on data transfers](https://gdpr.eu/) is worth 20 minutes if you haven't read it. It's less scary than people think. The practical obligations are modest, and getting them right once means not thinking about it again for two years.

Need to handle client work with an actual audit trail? [Start a transfer](/) and check the business tier for DPA terms if your client asks.
