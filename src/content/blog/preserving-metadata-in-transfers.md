---
title: "Preserving EXIF, XMP, and IPTC when you transfer photo and video files"
description: "The metadata fields that get stripped when you re-encode or re-pack files, and which tools preserve them cleanly."
date: "2026-04-19"
cluster: "formats"
tags: ["photography", "metadata", "workflow"]
---

Metadata travels inside a file. Camera make and model, lens, focal length, shutter speed, ISO, GPS coordinates, copyright, caption, keywords, color labels. If you did the shoot, you shot the metadata too. Losing it in transit is a quiet disaster because you usually don't notice until a client asks why their stock submission bounced back.

## The three main metadata standards

EXIF (Exchangeable Image File Format) is the oldest, dating back to 1995. It's primarily camera-written: capture settings, timestamps, GPS if enabled, orientation flag. Read-write by editing software but typically filled at the moment of capture.

IPTC (International Press Telecommunications Council) is the journalism standard. Headline, caption, byline, credit, keywords, location, source. Mostly human-written, added after capture.

XMP (Extensible Metadata Platform) is Adobe's 2001 spec that wraps around both. It uses XML, supports arbitrary custom fields, and plays well with non-destructive edits in Lightroom (crop, exposure, color grade, keywords, color labels, flag states).

Most modern tools write all three when you tag a photo. Lightroom writes XMP by default and mirrors key fields into IPTC and EXIF where applicable.

## What strips metadata

Re-encoding a JPEG. If you open a JPEG in any editor and "Save As" JPEG, most editors keep EXIF by default but may strip XMP or IPTC depending on settings. Photoshop's Export As dialog is particularly aggressive about stripping metadata unless you explicitly check the box.

Social media uploads. Instagram strips nearly everything. Facebook strips everything. Twitter (X) keeps basic EXIF but strips XMP keywords. WhatsApp re-encodes and strips heavily. If metadata matters, don't use these platforms as transfer services.

Some cloud storage previews. Google Photos preserves metadata on the full file but strips it from rendered previews. Dropbox keeps metadata intact. iCloud Photos keeps metadata but handles it quirkily across devices.

Generic file conversion tools. ImageMagick with default flags will strip metadata. Handbrake on default settings strips video metadata. You have to explicitly pass flags to preserve (`-metadata_header_padding` and friends).

## What doesn't strip metadata

Direct file copy. Drag, drop, copy, paste: all preserve metadata. The file bytes don't change.

Archiving into ZIP, RAR, or 7z. These are lossless wrappers. The file inside is bit-identical to the original, metadata and all.

Uploading to a transfer service that doesn't re-encode. [NaijaTransfer](/) doesn't touch your file bytes. What you upload is what your recipient downloads. Same for WeTransfer, Dropbox Transfer, Smash. Check the service's policy if you're not sure.

Lightroom export with "Include All Metadata" checked. Capture One export with metadata options enabled. Most pro tools preserve when asked.

## Photo-specific, the common traps

When you export from Lightroom, there's a metadata dropdown. "All Metadata" keeps EXIF, XMP, IPTC. "All Except Camera Raw Info" keeps EXIF and IPTC but strips the non-destructive edit history (useful for client delivery where you don't want them to see your editing moves). "Copyright Only" keeps just copyright. "Copyright & Contact Info Only" keeps legal stuff.

For client delivery, "All Except Camera Raw Info" is usually the right call. You keep the capture data and IPTC, strip the edit recipe.

GPS coordinates are a privacy issue. A wedding shoot in Lekki has GPS on every frame by default. Your client may not want that going to a stock site or a blog. Strip GPS specifically with Lightroom's "Remove Location Info" before export.

The EXIF orientation flag is its own headache. Cameras tag the capture orientation, but some software rotates the actual pixels too. If both happen, you get a photo that's upside-down on one device and right-side-up on another. Check once on a test file before shipping a whole set.

## Video metadata, which is messier

Video containers (MP4, MOV, MKV) carry metadata differently. There's no single standard like EXIF for video. Each codec and container stores what it stores.

MOV (QuickTime) stores rich metadata through Apple-specific atoms. Timecode, reel name, camera info, all preserved when you keep the file in MOV.

MP4 uses iTunes-style tags for consumer stuff (title, artist, album) but has limited pro metadata fields.

MXF (Material Exchange Format) is the broadcast standard and carries extensive metadata for professional workflows.

When you transcode video, metadata gets partly or fully stripped depending on the tool. FFmpeg preserves most metadata if you pass `-map_metadata 0`. Adobe Media Encoder preserves through the queue. Handbrake strips aggressively.

[AJA's technical docs](https://www.aja.com/family/ki-pro) have a readable breakdown of video metadata fields if you want the deep version.

## The sidecar option

For RAW files, Lightroom and Capture One write a separate `.xmp` file alongside the RAW. This sidecar holds all edits, ratings, keywords, and metadata additions that the RAW format itself doesn't accept natively.

When you transfer RAW files, always send the .xmp sidecars in the same folder. Without them, the edit recipe is gone. The RAW is still intact, but your work on it isn't. I've watched a client "lose" an afternoon of my edits because I forgot to include the sidecar files. That was a fun email chain.

[RAW photo formats explained](/raw-photo-formats-explained) covers the RAW format landscape if you want the context.

## How to verify metadata survived

ExifTool is the gold standard. It's a Perl tool that reads and writes metadata in basically every format. `exiftool -a -G image.jpg` dumps everything.

Photoshop's File Info dialog (Cmd+Option+Shift+I on Mac) shows the major fields.

Lightroom's Metadata panel in the Library module shows EXIF, IPTC, and XMP for any selected file.

Open the file after transfer and spot-check two or three fields. If they're there, the rest probably is.

## What I do

Ship RAW plus sidecar, packed into a ZIP. The ZIP preserves both files bit-perfect. Upload to [NaijaTransfer](/) which doesn't re-encode. The client unzips and imports, metadata intact.

For JPEG delivery, export from Lightroom with "All Metadata" or "All Except Camera Raw Info" based on the job. Never upload final JPEGs through Instagram if they're also going elsewhere.

For video, deliver in the codec the client requested (see [video codecs for delivery](/video-codecs-for-delivery)) and spot-check with ExifTool or MediaInfo before handing off.

## Last note

Metadata is invisible until it's missing. Build the habit of checking before you send. And when you send, [upload it here](/), where your file bytes reach the recipient exactly as you packed them.
