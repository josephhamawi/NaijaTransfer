---
title: "ZIP, RAR, 7z: which one for creative project bundles?"
description: "A plain comparison of the three archive formats on compression ratio, compatibility, and what breaks when a client on a Mac opens your .rar."
date: "2026-04-19"
cluster: "formats"
tags: ["file-formats", "archives", "compression"]
---

Three archive formats have survived long enough to matter in 2026: ZIP, RAR, and 7z. Every creative has opinions. Most of those opinions are wrong because they're based on what a 2011 tutorial said. I've shipped hundreds of project bundles since then, and the short version is that the right format depends on who you're sending it to, not which one is technically best.

## What each format actually is

ZIP is the oldest of the three, dating back to 1989, and it's baked into every operating system that matters. Double-click on macOS, right-click Extract All on Windows, unzip from the command line on Linux. No extra software. That's the whole pitch.

RAR came out of Russia in 1993 and is proprietary. You can create a .rar only with WinRAR or a licensed library. Extracting is free and widely supported, but not built into macOS Finder. A client on a Mac who gets a .rar will stare at it, then text you.

7z is the youngest (1999) and technically the strongest. It's open source, uses LZMA2 as its default algorithm, and typically compresses 10 to 20 percent smaller than ZIP on the same input. It also handles solid archives, which means related files share a compression dictionary and shrink harder.

## Compression ratios, tested on actual sessions

I packed the same 4.8 GB Ableton project folder three times last week. ZIP default settings got me 3.9 GB. RAR at normal compression hit 3.7 GB. 7z with LZMA2 ultra settled at 3.3 GB. That's 600 MB saved on one session, which matters on a 5 Mbps Glo line.

The gains shrink when your content is already compressed. A folder of MP4 video files compresses maybe 1 to 2 percent in any format. Don't bother with ultra settings on video bundles. You'll burn 20 minutes of CPU time to save 40 MB.

Text-heavy stuff compresses hard in all three. Source code, XML, JSON, DAW session files (which are often XML underneath) will shrink by 70 to 90 percent. That's where 7z pulls ahead.

## Compatibility, which is where it actually falls apart

ZIP opens everywhere. macOS Finder, Windows Explorer, iOS Files app, Android file managers, Chromebooks, every Linux distro. There's nothing to install.

RAR does not open natively on macOS. Your client needs The Unarchiver or Keka. Most creative professionals have one installed, but "most" isn't "all." I sent a .rar to a client in Abuja in 2023 and lost two hours to a back-and-forth about why she couldn't open it.

7z needs third-party software on macOS and Windows both. Keka on Mac, 7-Zip or WinRAR on Windows. Less painful than it used to be because Keka is a one-click install, but it's still a step.

If you want format politics, Ars Technica has a solid [overview of archive history](https://arstechnica.com/gadgets/2019/11/how-a-years-old-windows-feature-sank-a-multibillion-dollar-merger/) that's tangentially related and worth the read.

## My opinion, for what it's worth

7z is better than RAR and it's not close. Smaller files, open source, free tools, solid archive support, stronger encryption (AES-256 built in). If you're choosing for yourself, pick 7z.

But your client probably can't open it without downloading something, and that's the whole problem. ZIP is the diplomatic choice. RAR is a coin flip. 7z is the right answer for power users who already have Keka or 7-Zip installed.

## What I actually use

For anything going to a client I haven't worked with before, ZIP. Every time. No surprises, no support calls.

For anything going to another producer, designer, or editor I work with regularly, 7z. We both have the tools. The file is smaller. Upload is faster. It's a quiet win.

For archive-to-self (backup, long-term storage), 7z with encryption. LZMA2 holds up well over time and AES-256 is audited and trusted.

RAR I almost never create anymore. I extract them when clients send them. I don't pack them.

## A note on splitting

All three formats support splitting into multi-part archives. ZIP uses .z01, .z02, .zip. RAR uses .part01.rar, .part02.rar. 7z uses .7z.001, .7z.002. If one part dies in transit you need to re-upload that part, not the whole thing. We covered this in detail in our piece on [splitting large projects](/splitting-large-projects-into-chunks).

For chunked delivery specifically, the upload service matters as much as the archive format. [NaijaTransfer](/) handles multi-GB transfers in a single shot on a decent connection, which means you can skip splitting entirely for most jobs. If you're still deciding between services, [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) has the breakdown.

## The one-line summary

ZIP for clients, 7z for peers, RAR almost never. Upload the packed file [to NaijaTransfer](/) and send the link. Done.
