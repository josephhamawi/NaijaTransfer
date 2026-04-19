---
title: "The truth about cloud storage auto-compression"
description: "Which cloud providers silently re-encode your uploads, what that costs your work, and how to detect it before you deliver."
date: "2026-04-19"
cluster: "formats"
tags: ["cloud-storage", "compression", "file-integrity"]
---

Cloud storage services promise to hold your files. Some of them hold the exact bytes you uploaded. Others re-encode the file, sometimes silently, and what you get back isn't what you put in. The difference matters a lot if you're a creative shipping masters, RAWs, or video files to clients.

## Who re-encodes what

Google Photos has re-encoded uploads in its free tier since 2015. The "High Quality" (now called "Storage saver") option re-encodes photos to a maximum of 16 MP as JPEG, and video to 1080p as H.264. "Original Quality" preserves the file but counts against your storage quota. If you want your RAW or your 4K ProRes to survive, use Original Quality.

Apple iCloud Photos preserves original files on the server but renders previews and downloads at reduced quality depending on device storage settings. The "Optimize iPhone Storage" option replaces local full-res files with previews. The originals are fine on iCloud's servers, but the version on your phone may be a downscaled JPEG.

Facebook strips everything. Photos uploaded to Facebook come down smaller, re-encoded, with metadata stripped. Instagram too.

WhatsApp re-encodes almost all media through its own pipeline. Photos lose quality, videos get heavily compressed, audio gets converted. If you ever need the original, you need to send it via a different channel.

Twitter (X) preserves uploaded images if you enable the right account setting, but re-encodes on DM. Its video compression is aggressive.

## Who preserves exactly

Dropbox preserves byte-for-byte. What you upload is what you download. This includes all metadata.

Google Drive (as opposed to Google Photos) preserves byte-for-byte. The Photos integration is what re-encodes, not Drive itself. If you upload a RAW or a ProRes to Drive directly, it stays intact.

OneDrive preserves byte-for-byte. Same story as Drive.

Box, Proton Drive, pCloud, Sync.com, MEGA: all byte-perfect on uploaded files.

iCloud Drive (not iCloud Photos) preserves byte-for-byte.

Transfer services like [NaijaTransfer](/), WeTransfer, Smash, and Dropbox Transfer don't re-encode. They're designed to move files, not transform them.

## How to detect re-encoding

Run a hash on the original file. `shasum -a 256 original.mov` on macOS or Linux. Get-FileHash in PowerShell on Windows. Note the hash.

Download your uploaded copy from the cloud service. Run the hash again.

If the hashes match, the file is byte-identical. If they differ, something changed. It could be metadata (less concerning) or actual content (more concerning). You can also compare file sizes as a first pass. If the downloaded file is smaller than the upload, something got re-encoded.

For photos, check EXIF. A re-encoded image often loses or alters EXIF data even if the visible pixels look fine. [Preserving metadata in transfers](/preserving-metadata-in-transfers) covers the detection tools in detail.

[Backblaze published a useful comparison](https://www.backblaze.com/blog/cloud-storage-comparison/) of storage provider behaviors around file handling if you want the broader reference.

## Why services re-encode in the first place

Storage costs. A re-encoded 16 MP JPEG is 3 MB. The original RAW might be 50 MB. At Google's scale, that's billions of dollars a year in storage.

Bandwidth costs. Re-encoded files download faster for users on slow connections, which reduces support load and improves the perceived quality of the service.

Compatibility. A 4K HEVC file won't play on a 2013 Android phone. Re-encoding to H.264 1080p makes it work everywhere. For consumer services aimed at billions of users, this tradeoff makes sense.

The problem is when you're a professional and the service treats your 14-bit ProPhoto RGB RAW the same as your cousin's smartphone snapshot.

## The Nigerian angle

If you upload a 4K ProRes to a service that re-encodes, you then pay the upload cost (data, time on MTN or Glo) plus lose the quality you were trying to preserve. That's two losses for one upload. On a 5 Mbps line, a 10 GB upload takes roughly four hours. Losing that file to silent re-encoding is genuinely painful.

The right answer is to use a storage or transfer service that explicitly promises byte-preservation. For delivery, [NaijaTransfer](/) uses Wasabi-backed storage and doesn't modify uploaded files. For archive, Backblaze B2 or Wasabi directly. For sharing with clients, a transfer link beats a cloud folder share for exactly this reason.

[Our pricing page](/pricing) covers the storage tiers, and there's a fuller writeup in [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) on how we differ from the competition.

## What professionals actually do

For masters and deliverables, use a transfer service or a preservation-focused storage provider. Verify with a hash on a test file before committing your workflow to it.

For backup, 3-2-1 rule. Three copies, two different media, one off-site. At least one of those copies should be byte-perfect. I use Backblaze for off-site backup and a local SSD as the second copy.

For sharing previews with clients or friends, lossy cloud services (Google Photos, iCloud Photos) are fine. The preview is not the master. Don't confuse the two.

For casual photos, the free tier re-encoding is fine. Your iPhone photos of a beach trip don't need bit-perfect preservation.

## The 90-second check

Any time you onboard a new cloud service, run the hash test. Upload a 10 MB test file, download it, compare hashes. Takes 90 seconds. Tells you everything about whether that service will safely hold your work.

I got burned by Google Photos in 2019. Uploaded a wedding shoot at "High Quality," came back a year later to pull RAWs, discovered they were 3 MB JPEGs. The RAWs were gone forever from that copy. Now I hash-check every new service before I trust it with anything real.

## The closing move

When you need to deliver a file exactly as you made it, use a service that promises byte-preservation. [Upload it here](/) and tell the client the file they download is the file you uploaded. No re-encoding, no silent quality loss.
