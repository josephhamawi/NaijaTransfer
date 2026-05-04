---
title: "FLAC, WAV, ALAC: which lossless format for your master?"
description: "A breakdown of filesize, metadata behavior, and DAW compatibility for the three formats a mastering engineer will accept."
date: "2026-04-19"
cluster: "formats"
tags: ["audio", "mastering", "file-formats"]
---

A mastering engineer will accept WAV, FLAC, or ALAC. They will not accept MP3, AAC, or OPUS. If you send a lossy file to a mastering session you are asking the engineer to polish a photocopy. The question is which of the three lossless formats to send, and the answer isn't obvious.

## The short version

WAV is the universal default. FLAC is half the size and open source. ALAC is Apple's answer to FLAC, similar compression, native on macOS and iOS. All three are bit-perfect. The differences are in metadata handling, filesize, and what your engineer's DAW prefers to import.

## WAV, and what it is

WAV has been around since 1991, developed jointly by Microsoft and IBM. It's uncompressed PCM audio wrapped in a RIFF container. A 24-bit 48 kHz stereo WAV runs about 16.5 MB per minute. A four-minute song is around 65 MB.

WAV supports metadata via the BWF (Broadcast Wave Format) extension, which adds fields for timestamp, originator, description, and more. Pro Tools and most broadcast tools read BWF metadata natively. Consumer tools often strip it.

The big WAV limitation is file size. It doesn't compress. A 70-minute album at 24-bit 48 kHz is around 1.2 GB as a set of individual track WAVs. Upload that on a 4 Mbps line and you're there for an hour.

## FLAC, the open-source winner on paper

FLAC (Free Lossless Audio Codec) is an Xiph.org project, same foundation that gave us Ogg Vorbis and OPUS. It's lossless compression using linear prediction and run-length encoding, typically shrinking 24-bit audio to 50 to 60 percent of the WAV size with no quality loss at all. The [xiph.org FLAC docs](https://xiph.org/flac/documentation.html) are the reference.

That 1.2 GB album becomes around 650 MB as FLAC. Same audio, decoded to the bit, half the upload time.

FLAC supports embedded metadata via Vorbis comments (title, artist, album, album art, ReplayGain values, and arbitrary custom fields). It handles these cleanly across platforms.

The catch is DAW support. Pro Tools doesn't import FLAC natively until recent versions (2023 and later). Older Pro Tools sessions choke on it. Logic handles FLAC but will convert on import. Ableton imports it, same conversion step.

If your mastering engineer is on Pro Tools, ask first. Don't assume.

## ALAC, Apple's parallel universe

ALAC (Apple Lossless Audio Codec) was proprietary until 2011, when Apple open-sourced it. Compression ratios are similar to FLAC, usually within 1 to 3 percent either way. That 650 MB album might be 635 MB in ALAC, or 680 MB. It fluctuates by material.

ALAC is the format you'll get if you rip CDs in Apple Music or iTunes at lossless quality. It's native on every Apple device going back to iOS 6, and it handles metadata through the MP4 container (ALAC files are usually .m4a).

Logic Pro imports ALAC natively. Pro Tools imports ALAC natively. Ableton imports ALAC (with a conversion step). It's the most "it just works" format if your engineer is on Apple hardware, which statistically most mastering engineers are.

## Metadata, which matters more than you think

Track titles, ISRC codes, artist names, album art, tempo, key: these travel with the audio file when you embed them properly. Mastering engineers, distributors, and DSPs all read this metadata.

WAV: limited to BWF, which most DAWs respect. Filename is often how metadata actually travels.

FLAC: rich metadata via Vorbis comments. Embed everything you want. It survives cleanly.

ALAC: metadata via MP4 atoms. Works well on Apple platforms, mostly fine everywhere else.

If you're sending stems for mastering, strip metadata to avoid confusing the engineer. If you're sending the final master that will be distributed, embed ISRCs and track info.

## Sample rate and bit depth, briefly

Mastering engineers want 24-bit. Not 16-bit. 16-bit is the delivery format (CD, Spotify's lossless tier), not the working format. Working at 24-bit gives 48 dB of additional dynamic range to process without running into the noise floor.

48 kHz is the current standard for most contemporary work. 44.1 kHz is fine for pure music destined for CD or DSP only. 96 kHz is overkill for 99 percent of material, and the engineer will probably downsample anyway.

Don't upsample. Ever. A 44.1 kHz recording upsampled to 96 kHz is still 44.1 kHz of information wrapped in a larger file.

## What I send

For mastering, 24-bit 48 kHz WAV by default. It's the format every engineer can open without thinking. Upload size hurts but [NaijaTransfer's pricing](/pricing) handles the volume without the artificial caps of free tiers.

If the engineer specifically says FLAC is fine, I send FLAC. Half the upload time, identical audio. It's worth asking before every project. I've lost an hour re-exporting sessions because I assumed FLAC would fly and the engineer was on Pro Tools 2019.

If I'm sending to an engineer on Logic, ALAC is clean and small. Fine as a first choice there.

For format context on when lossy is actually okay, [lossy vs lossless for creators](/lossy-vs-lossless-for-creators) covers the broader decision.

## One note on file naming

Name the files `01_SongTitle_24b48k_Master.wav` or similar. The engineer needs to know bit depth and sample rate at a glance without opening the file. Our piece on [file naming conventions](/file-naming-conventions-that-save-hours) goes deeper.

## Upload, then email the link

Whichever format you pick, pack the album as a single zipped folder and [upload it to NaijaTransfer](/). Send the link. Don't email a 1.2 GB attachment. That's a fight you won't win.
