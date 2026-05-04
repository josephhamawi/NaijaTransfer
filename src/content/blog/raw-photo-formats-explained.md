---
title: "RAW photo formats explained: CR2, NEF, ARW, DNG"
description: "What each brand's RAW format actually stores, why Adobe DNG exists, and which ones are safer to archive for the next decade."
date: "2026-04-19"
cluster: "formats"
tags: ["photography", "raw", "file-formats"]
---

A RAW file isn't a photo. It's a record of what the sensor captured, one value per pixel, before any processing. The JPEG your camera saves alongside is the camera's interpretation of that data. The RAW is the data itself. Every camera brand has its own container for that data, and that's where the alphabet soup starts.

## The big four

Canon shoots CR2 (older bodies) and CR3 (2018 and later). CR2 is a TIFF-based container. CR3 moved to an MPEG-4 wrapper for better metadata support and HEIF compatibility.

Nikon shoots NEF. It's TIFF-based, unchanged in broad strokes since the D1 in 1999, though the contents have evolved with every sensor generation.

Sony shoots ARW (Alpha RAW). Also TIFF-based, revised heavily when they introduced the A7 series.

Adobe DNG (Digital Negative) is the oddball. It's not a camera brand's format. It's Adobe's attempt to create a universal RAW container, published as an open spec in 2004.

Fuji shoots RAF. Olympus shoots ORF. Leica shoots DNG natively on most recent bodies. Panasonic shoots RW2. Pentax shoots PEF or DNG (user-configurable).

## What's in a RAW file

A RAW file contains three things. The sensor data itself, usually 12 or 14 bits per channel before demosaicing. EXIF metadata (camera model, lens, aperture, shutter, ISO, timestamp, GPS if enabled). And a JPEG preview, embedded for thumbnail display, typically 1 to 2 MB.

The sensor data is where the value is. A 14-bit RAW has 16,384 tonal values per channel. A JPEG has 256. That's a 64x reduction when you convert. Everything photographers love about RAW (highlight recovery, shadow lifting, white balance freedom after the fact) comes from that bit depth difference.

Resolution determines filesize more than anything. A 24 MP RAW from a Sony A7 III runs about 25 MB. A 45 MP RAW from a Nikon Z7 II hits 55 MB. A 61 MP Sony A7R V file pushes 120 MB when uncompressed.

[DPReview's sensor comparisons](https://www.dpreview.com/articles/) have the cleanest technical breakdowns if you want to go deep.

## Why DNG exists

Adobe launched DNG in 2004 to solve an archive problem. Each camera brand's RAW format is proprietary. Canon could, in theory, stop supporting CR2 in future versions of Digital Photo Professional. They almost certainly won't, but "almost certainly" is not a guarantee for files you'd like to open in 2044.

DNG is an open spec. The format is documented. Any software that implements the DNG spec can read your DNGs forever.

Some cameras (Leica, Pentax, some Ricoh) write DNG natively. For the rest, you convert after the shoot using Adobe DNG Converter (free) or let Lightroom do it on import.

DNG files are typically 15 to 20 percent smaller than the proprietary RAW they came from, because DNG's compression is slightly more efficient. You can also embed the original proprietary RAW inside the DNG, which inflates the file but guarantees you can always get back to the source if needed.

## Compatibility, which is the real issue

Lightroom and Capture One support every modern RAW format. Not instantly, but within a few weeks of a new camera shipping. Adobe and Phase One push format updates regularly.

Affinity Photo, Luminar, DxO PhotoLab: similar timeline. Newer cameras lag by a month or two.

The problem comes with older software and with very new cameras. If a client on Lightroom 6 gets your CR3 from a Canon R5, they can't open it. Lightroom 6 shipped before the R5 existed. The fix is to convert to DNG before you send.

This also matters for third-party previews. Google Photos, Apple Photos, Dropbox previews: these don't reliably show every RAW variant. A DNG is much more likely to render a preview than a proprietary RAW on the same service.

## What to archive

For archive purposes, DNG wins. It's open, documented, slightly smaller, and its preview rendering is more portable.

For working files, the camera's native RAW is fine. You shot it, you edit it, you deliver the JPEG or TIFF.

For client handoff, I convert to DNG if the client is on an unknown toolchain. If they're a Lightroom user on current software, the native RAW is fine and saves the conversion time.

For delivering to clients specifically, [delivering RAW photos to clients](/delivering-raw-photos-to-clients) covers the workflow end to end.

## Upload sizes, because they add up

A wedding shoot of 1,500 RAWs at 50 MB each is 75 GB. That is a real number. Email is out. Cloud storage shares are slow and tie the client to whichever ecosystem you chose.

A transfer service is the clean answer. [NaijaTransfer](/) handles multi-tens-of-GB uploads in one shot, and for volume shooters [the business tier](/business) removes the per-transfer cap entirely.

If you're uploading from Lagos on MTN 4G, plan for a long session. See [upload speeds in Nigeria](/upload-speeds-nigeria) for realistic throughput numbers by network.

## One habit worth adopting

Shoot RAW plus JPEG on a new camera for the first month. The JPEG gives you a quick preview and a fallback if the RAW workflow breaks. After a month, you can usually drop the JPEG and save the card space.

And when you ship the RAWs, always include a text file with the camera body, lens set, and any custom white balance you used. Five lines saves the editor on the other end 30 minutes of guessing.

## The one-line answer

Archive as DNG, work in native RAW, ship to [NaijaTransfer](/) when the folder is too big for email, which is basically always.
