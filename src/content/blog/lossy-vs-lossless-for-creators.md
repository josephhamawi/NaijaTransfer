---
title: "Lossy vs lossless, for creators who actually ship work"
description: "When lossy formats are the right call, when they are malpractice, and how to decide without reading a 20-page whitepaper."
date: "2026-04-19"
cluster: "formats"
tags: ["file-formats", "audio", "video"]
---

Lossy versus lossless is a question that gets treated like religion, which is silly because the answer is obvious 90 percent of the time. The short version: lossy for delivery to humans, lossless for work in progress and archive. The long version has some interesting edge cases.

## What the words actually mean

Lossless means every bit of original information survives. FLAC, WAV, ALAC, ProRes, DNxHR, PNG, TIFF, DNG. Run the file through a decoder, you get back exactly what you put in. No quality loss, ever, no matter how many times you re-save.

Lossy means the encoder throws data away to make the file smaller. MP3, AAC, OPUS, H.264, H.265, JPEG, WebP. The missing data is chosen to be information your eyes and ears won't notice much, using perceptual models built up over decades. The [Fraunhofer group](https://www.iis.fraunhofer.de/en/ff/amm/consumer-electronics/mp3.html) that invented MP3 spent 15 years on psychoacoustic research before the format shipped.

A lossy file is typically 5 to 15 percent of the size of its lossless source. That's why it exists.

## When lossy is the right call

Anything going to a listener or a viewer for consumption. A song you're sending to a friend to check out. A rough edit going to a client for notes. A reference mix. A video going to WhatsApp. An Instagram post. A YouTube upload (YouTube re-encodes anyway, so sending them lossless is wasted bandwidth past a point).

Rule of thumb: if the file is the final destination, lossy. MP3 at 320 kbps, AAC at 256 kbps, H.264 at sensible bitrates. These are indistinguishable from lossless for 99 percent of listeners on 99 percent of playback systems.

AAC at 256 kbps genuinely sounds the same as WAV to almost everyone. Blind tests have been run for 20 years and trained audio engineers barely crack 60 percent. Untrained listeners are at coin-flip.

## When lossy is malpractice

Anything you're going to edit further. Any master going to distribution. Any photo you'll re-edit. Any video clip you'll color-grade or intercut. Any file you want to archive for longer than six months.

Re-encoding lossy files compounds the loss. Every save chips away a little more. A JPEG re-saved 30 times looks like a fax. An MP3 re-encoded from MP3 will smear.

If you're sending stems to a mix engineer, lossless. Always. [Sending demos, WAV vs MP3](/sending-demos-wav-vs-mp3) gets into this for music specifically.

If you're delivering a video master to a broadcaster or streamer, ProRes or DNxHR. Not H.264. Broadcasters have delivery specs for a reason.

## The edge cases that trip people up

OPUS at 96 kbps is genuinely transparent for speech. You can send a 90-minute podcast as a 65 MB OPUS file that sounds identical to the 900 MB WAV source. This is legitimate magic and it's why podcasts have settled on OPUS for distribution.

Apple ProRes Proxy is technically lossy but so generous with bitrate that most colorists can't tell the difference from ProRes 422 unless they're looking for artifacts. It's the right trade for offline editing.

Photographers shooting JPEG-only (no RAW) are making a lossy commitment at capture. If you didn't take the RAW, you can't get it back later. I made this mistake on a shoot in Enugu in 2022 and I've never trusted the "just shoot JPEG to save space" advice since.

DNG is Adobe's lossless RAW format, and it's worth knowing about. See [RAW photo formats explained](/raw-photo-formats-explained) for the detail.

## How to decide in 10 seconds

Ask yourself: is this file going to be edited again? If yes, lossless. If no, lossy is fine, and often better (smaller file, faster upload).

Ask yourself: am I archiving this? If yes, lossless. Disk is cheap, redoing work is not.

Ask yourself: is the recipient a professional who will re-encode anyway? If yes, lossy is fine. YouTube, Spotify, Netflix, they all re-encode your upload. Sending a 100 GB ProRes to YouTube achieves nothing their ingest wouldn't already do with a 5 GB H.264.

## What I actually send

Client deliverables: lossy, final-quality (H.264 at 15 Mbps for 1080p, AAC at 256 kbps for audio, JPEG at 90 quality for photos).

Working files to collaborators: lossless. ProRes, WAV, TIFF, or the native project file.

Archive: lossless, with checksums. I wrote about [checksum habits](/checksum-your-deliverables) elsewhere.

Upload destination depends on size. Anything past 500 MB, I send it through [NaijaTransfer](/) because email won't carry it and the link is cleaner than a Drive share.

## Closing thought

Lossy isn't evil, and lossless isn't always correct. The question is what happens to the file next. Pick accordingly. And if you're handing off large lossless bundles frequently, [our pricing](/pricing) handles the file sizes that make email giggle.
