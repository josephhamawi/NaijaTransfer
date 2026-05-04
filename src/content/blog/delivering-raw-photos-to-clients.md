---
title: "Delivering 500 RAW photos to a wedding client: the Nigerian reality"
description: "How to hand off a full-day RAW shoot without asking the couple to wait a week, and where most photographers lose the download."
date: "2026-04-19"
tags: ["photography", "raw", "client-delivery"]
cluster: "creators"
---

A Nigerian wedding shoot runs 400 to 700 frames if you're working solo, easily 1,200 if you're running second shooters. Each RAW is 25 to 45 MB on a modern full-frame body. That's a minimum of 10 GB and usually more like 25 GB to hand back to the couple. On a Nigerian uplink, that's not a trivial send. It's an engineering problem.

## The first question: do they want the RAWs?

Most couples don't. They want the finished JPEGs, edited, color-graded, delivered as a gallery they can download and share on WhatsApp. RAWs are large, uneditable without Lightroom or Capture One, and visually flat compared to the edited delivery. A newlywed couple opening a folder of .CR3 or .ARW files gets confused, not excited.

Ask before you shoot. Put it in the contract. "Final delivery: 400 edited JPEGs. RAW files retained for 90 days, available on request." This covers you, and it keeps the handoff realistic.

If they do want the RAWs (some do, often for archival or because a family friend wants to edit them), you owe them a plan. The plan is not "WeTransfer it on Monday."

## The real bottleneck: upload speed

Nigerian residential uplinks run 1 to 15 Mbps depending on the ISP, the time of day, and whether you're on fibre or mobile data. 25 GB at 5 Mbps takes a little over 11 hours of continuous upload. At 2 Mbps, you're looking at 28 hours. Those numbers assume the connection doesn't drop, which is a generous assumption.

This is why a lot of photographers in Lagos hand over RAW files on physical media instead of sending them. A 64 GB USB stick costs less than a day of lost shooting time spent watching an upload spinner. For clients in the same city, drop off a drive.

For clients abroad, or for clients who specifically want a cloud download, you're going to upload. Plan it for 2am to 5am when the ISP's network is less saturated. On MTN fibre in Lekki, I get 8 Mbps sustained at 3am against 2 Mbps at 9pm. That's not a claim about MTN, it's just how congestion works. Upload in the window.

## Split the delivery

Don't send 25 GB as one upload. Split into four to six zips, organized by ceremony. `01_GettingReady.zip`, `02_Ceremony.zip`, `03_Reception.zip`, etc. Each zip at 4 to 6 GB is manageable on a single upload session, and if one fails, you don't restart the whole 25 GB.

Name the zips consistently so they sort correctly in the client's downloads folder. Leading zeros matter: `01_` sorts before `10_`, which sorts before `2_` if you're not careful.

For each zip, [transfer it directly](/) and send the link to the client as soon as it finishes. The couple can start downloading while you're still uploading the next batch. Parallelism on the receiving side, sequential on the sending side.

## Compression, which doesn't help for RAW

Zipping RAW files doesn't reduce size meaningfully. RAW formats already use a light internal compression, and zip compression on top only shaves 2 to 5 percent. Don't waste the clock on maximum-compression zip settings. Store-only (no compression) zips faster and the final size is basically the same.

The reason to zip at all is to bundle the folder, not to save space. A folder of 400 loose files is harder for the client to manage than one zip they drag to an external drive.

## The edited JPEGs, which is the actual deliverable

For the edited gallery, JPEG at 85 to 90 percent quality is the standard. A 6000x4000 pixel JPEG at 85 percent is around 4 to 6 MB. Four hundred of them is 1.6 to 2.4 GB total. That's a single upload, under an hour on a decent line.

Keep a full-resolution version and a web-resolution version. The full-res (2000 pixels on the long edge or higher) for download and print. The web-res (1200 pixels) for the client to share on Instagram without murdering quality through Meta's recompression.

Deliver both in the same parent folder, with clear naming. `Full_Resolution/` and `Web_Size/`. Clients will use both, and neither on its own covers the full use case.

## The client-side download problem

Nigerian download speeds are usually better than upload speeds, but not always. A couple downloading 25 GB of RAWs on a 10 Mbps line takes 6 hours. They'll close the laptop, the download will stall, and you'll get a call asking for the link again.

The way around this is a link that supports resumable download. Most modern transfer services handle this. Browsers handle it too, for direct file downloads. Tell the client explicitly: "If the download stops, just click the link again. It'll pick up where it left off." Half of them don't know this.

I had a couple in 2023 who re-downloaded the same 18 GB gallery from scratch three times because they didn't know the browser could resume. Three of my upload hours, times three. Now I put a one-line note in the delivery email explaining how to resume. Saves us both the round trip.

## The cost side, for photographers doing this at volume

A studio shooting three weddings a month is pushing 75 GB of RAW deliveries. On a free transfer plan with a 2 GB cap, that's split into 40 uploads. [Our business plan](/business) handles this without the split, and [the pricing page](/pricing) lays out what scales. For context on how we compare, [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) has the numbers.

## The handoff note

Include a readme.txt in every zip. "This folder contains the RAW files from your wedding on April 5th. 143 frames from the ceremony, 87 from reception. Shot on Canon R5, files in .CR3 format. Open with Adobe Lightroom, Capture One, or Canon Digital Photo Professional. Keep safe."

For a related read on proofing before final delivery, [client proofing: watermarked previews that don't insult the client](/client-proofing-watermarked-previews) covers the pre-delivery stage. [PetaPixel's writeup on client delivery](https://petapixel.com/best-ways-to-deliver-photos-to-clients/) is a useful cross-reference on approach.

Edit, zip, upload in the quiet hours. [Send the gallery here](/) and go shoot the next wedding.
