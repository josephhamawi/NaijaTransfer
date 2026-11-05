---
title: "Choosing TIFF, DNG or PSB for Layered Photoshop Deliverables in Nigeria"
description: "A practical guide for Nigerian creators on when to use TIFF, DNG or PSB for layered Photoshop files, with tips on reliable transfer using local payment and upload solutions."
date: "2026-11-05"
tags: ["tiff", "dng", "psb", "photoshop", "delivery"]
cluster: "formats"
---
## The real‑world challenge

Oluchi runs a visual effects studio in Lekki. A client in Abuja has asked for a layered Photoshop file that contains 12 smart objects, adjustment layers and a 4K background. The deadline is tomorrow, the internet drops every time the power flips, and the client’s finance team refuses any USD‑denominated invoice. Oluchi needs to decide which file type will preserve the layers, stay under the 5 GB email limit, and arrive intact on the client’s Windows PC.

## TIFF: Strengths and limits

TIFF (Tagged Image File Format) is the long‑standing workhorse for high‑quality raster data. It supports lossless compression, 16‑bit channels, and can store multiple pages. When saved with the "Photoshop" option, a TIFF can embed all layers, masks and vector data.

- **Pros**: Universally readable by Photoshop, GIMP and many DAM systems. Lossless compression keeps file size reasonable for moderate layer counts.
- **Cons**: The maximum file size is 4 GB. A 12‑layer 4K project with smart objects can easily exceed this limit, causing the save to fail or the file to truncate.
- **Best use**: Small‑to‑medium layered projects, archival copies where cross‑application compatibility matters.

For Oluchi, a 5 GB PSB would be safer than a 4 GB TIFF.

## DNG: When raw meets layered

Digital Negative (DNG) is Adobe’s open raw format. It is primarily designed to store raw sensor data, but Photoshop can embed a full PSD structure inside a DNG container when you use "Save As DNG" with the "Embed Photoshop data" option.

- **Pros**: Smaller than equivalent PSD because raw data is compressed efficiently. The format is open, so future‑proofing is better than proprietary PSD.
- **Cons**: Only Photoshop (and some Lightroom plugins) can read the embedded layers. Non‑Adobe tools will see just the raw image. The workflow adds an extra conversion step.
- **Best use**: Photographers who need to ship raw‑plus‑edit data to other Adobe users without exposing a large PSD.

Oluchi’s client uses Photoshop, so DNG could work, but the extra conversion adds risk under a tight deadline.

## PSB: The giant for Photoshop

PSB (Photoshop Big) is the extended version of PSD that lifts the 2 GB limit. A PSB can store up to 4 EB of data, effectively unlimited for any current project.

- **Pros**: No size ceiling for layered files. Preserves every Photoshop feature – smart objects, adjustment layers, vector masks, 32‑bit channels.
- **Cons**: Only Photoshop can open a PSB. Some older versions of the software (pre‑CS2) lack support. The file size can be massive; a 12‑layer 4K composition may easily hit 6‑8 GB.
- **Best use**: High‑resolution video frames, complex compositing, any deliverable that must retain the full edit stack.

Given the client’s need for a fully editable file, PSB is the safest technical choice.

## Choosing the right format for your workflow

| Situation | Recommended format | Reason |
|-----------|-------------------|--------|
| Small brochure mockup, <2 GB | TIFF | Wide compatibility, lossless compression |
| Raw photo shoot + edits, send to another Adobe user | DNG (embed Photoshop) | Keeps raw size low, open spec |
| Complex video overlay, 4K + many smart objects | PSB | No size limit, preserves all layers |
| Need to stay under email limits (25 MB) | Export a flattened JPEG for preview, keep master in PSB |

Oluchi should generate a PSB for the client, then create a low‑size preview JPEG for quick reference.

## How to send the files reliably in Nigeria

The biggest obstacle is moving a multi‑gigabyte file from Lagos to Abuja without hitting a payment wall. International services often bill in dollars, trigger virtual‑card mark‑ups, or simply decline Nigerian bank cards.

Naira pricing via Paystack. No dollar billing, no virtual-card markup, no card decline at checkout. This local payment gateway lets you purchase transfer credits in naira, avoiding the foreign‑card friction that plagues services like WeTransfer. The platform also uses the TUS protocol for resumable uploads, meaning the transfer can survive power outages, ISP swaps between MTN and Spectranet, or a switch from 4G to fiber. You start the upload, lose power, reconnect, and the file resumes from the last byte.

1. **Create the PSB** – Save the layered file as a PSB on your workstation.
2. **Compress for upload** – Zip the PSB (e.g., `project_final.psb.zip`). A zip adds a small integrity check and may reduce size by 5‑10 %.
3. **Upload with the local transfer tool** – Log in, pay ₦2,000 for a Pro plan if you need more than the free 4 GB, then drag the zip into the upload window. The resumable uploader will keep track of each chunk.
4. **Copy the share link** – Once the upload finishes, copy the generated link. No recipient account is required; the client can click and download directly.
5. **Notify the client** – Send the link via WhatsApp or email. The client can start the download immediately, even on a 3G connection; the resumable server will re‑assemble the file on their end.

By using a service that bills in naira and tolerates unstable connections, Oluchi avoids the $12 USD monthly fee of WeTransfer, the card‑decline nightmares, and the need for the client to create a Google or Dropbox account.

> “The biggest win is a link that works the first time, without asking the client to sign up or wrestle with a foreign payment gateway.”

For more technical details on each format, see the official Adobe documentation on [TIFF](https://en.wikipedia.org/wiki/TIFF), [DNG](https://helpx.adobe.com/photoshop/using/dng.html) and [PSB](https://helpx.adobe.com/photoshop/using/file-formats.html).

## Bottom line

When a layered Photoshop deliverable must survive size constraints, preserve editability, and travel across Nigeria’s patchy internet, PSB is the default choice. Pair it with a locally‑priced, resumable transfer service to keep the workflow smooth and the payment simple.

Try the Nigerian‑built transfer solution today – it’s the only service with Naira pricing via Paystack, no dollar billing, no virtual‑card markup, no card decline at checkout, and a resumable upload engine built for our internet. Get started at https://naijatransfer.com/#download
