---
title: "Video codecs for delivery: ProRes, DNxHD, H.264, H.265"
description: "A clear comparison of the four codecs you actually need to know in 2026, with bitrate-per-minute ballparks for a 4K project."
date: "2026-04-19"
cluster: "formats"
tags: ["video", "codecs", "delivery"]
---

Four codecs cover 95 percent of professional video delivery in 2026. ProRes, DNxHD (and its sibling DNxHR), H.264, and H.265. Each exists because the others aren't right for something. Knowing which to use when is what separates a clean delivery from a weekend rebuilding a timeline.

## The short version

ProRes and DNxHR are mastering and editing codecs. They're intra-frame (every frame is complete on its own), high-bitrate, and designed to survive multiple re-encodes without artifacting.

H.264 and H.265 are distribution codecs. They're inter-frame (frames reference each other to save space), low-bitrate, and optimized for delivery to eyeballs, not for editing.

Send ProRes or DNxHR to a colorist. Send H.264 to a client for approval. Send H.265 to a platform that explicitly accepts it. Don't mix those up.

## ProRes, specifically

Apple ProRes comes in variants. 422 Proxy, 422 LT, 422, 422 HQ, 4444, and 4444 XQ. Each is higher bitrate than the last.

A 10-minute 4K ProRes 422 HQ clip is around 12 GB. Same clip in ProRes 4444 XQ is about 27 GB. Proxy for the same footage is around 2 GB. These numbers scale linearly with duration, so a 90-minute finished feature in 4K ProRes 422 HQ runs about 110 GB. Yes, really.

ProRes decodes fast on Apple Silicon and most x86 machines. It's the go-to intermediate for FCP, Premiere, Resolve, Avid, and pretty much every NLE. [Apple's ProRes whitepaper](https://www.apple.com/final-cut-pro/docs/Apple_ProRes_White_Paper.pdf) has the bitrate tables if you want the definitive numbers.

## DNxHD and DNxHR

Avid's DNxHD is the HD equivalent. DNxHR is the 4K-plus version. Same idea as ProRes: intra-frame, high bitrate, edit-friendly.

DNxHR comes in LB (low bandwidth), SQ (standard quality), HQ (high quality), HQX (10-bit HQ), and 444. Rough bitrates at 4K 24fps: LB around 60 Mbps, SQ around 145 Mbps, HQ around 220 Mbps, HQX around 330 Mbps, 444 around 500 Mbps.

A 10-minute DNxHR HQX clip at 4K runs about 25 GB. It competes directly with ProRes 422 HQ and the file sizes land in similar territory.

Avid Media Composer prefers DNxHR natively. Premiere and Resolve handle it fine. FCP needs a workaround (usually transcoding to ProRes on import).

## H.264, the universal delivery codec

H.264 (AVC) has been the default delivery codec since roughly 2005. It's in every browser, every TV, every phone, every streaming platform. If you're delivering a file to a client for review, H.264 is the answer unless you're told otherwise.

A 10-minute 4K H.264 clip at 40 Mbps runs about 3 GB. Same clip at 15 Mbps is 1.1 GB. Same clip at 8 Mbps (the rough bitrate for a 1080p YouTube upload) is 600 MB.

Quality at 40 Mbps is indistinguishable from the ProRes source for almost all viewers. Quality at 8 Mbps is visibly compressed in high-motion scenes but fine for talking-head content.

H.264 is hardware-accelerated on basically everything. Encoding is fast, decoding is instant.

## H.265, the successor that's still not quite the default

H.265 (HEVC) compresses about 40 to 50 percent better than H.264 at equivalent quality. A 4K H.265 file at 20 Mbps looks roughly as good as H.264 at 40 Mbps.

The problem is licensing and compatibility. H.265 has a patent pool that's been contentious for years. Some browsers handle it natively (Safari, Edge). Chrome added hardware H.265 decode in 2022 but software decode lags. Older hardware struggles.

For client delivery, H.265 is fine if you know your client is on modern hardware. For broad delivery to anyone with a browser, H.264 is still the safer call.

[The Verge covered the codec wars](https://www.theverge.com/2022/4/12/23021767/google-chrome-hevc-h-265-video-codec-hardware-decoding) if you want the background politics.

## Picking in practice

Delivering a color pass back from a colorist: ProRes 4444 or DNxHR 444, whatever the color house specified. Usually ProRes 4444 XQ for 12-bit material.

Sending a working cut to an editor who will add more edits: ProRes 422 HQ or DNxHR HQ. Edit-friendly, not precious about file size.

Sending a review cut to a client for feedback: H.264 at 15 to 25 Mbps for 4K, 8 to 12 Mbps for 1080p. Small enough to upload fast, good enough to judge the cut. [Client proofing](/client-proofing-watermarked-previews) has the full workflow for this.

Uploading to a streaming platform: whatever their spec says. YouTube accepts H.264 and H.265, re-encodes everything anyway. Vimeo accepts ProRes for master quality. Netflix and broadcasters have specific delivery specs you must match.

Sending a master to long-term archive: ProRes 422 HQ at minimum, ideally 4444 if the source material warrants it. Disk is cheap.

## Upload sizes, because this is where it hurts

A one-hour documentary in ProRes 422 HQ at 4K is about 70 GB. That's the actual master file you ship to a broadcaster.

You can't email 70 GB. You can barely upload it on most Nigerian connections without planning. [Upload speeds in Nigeria](/upload-speeds-nigeria) has the realistic throughput numbers.

For large video deliveries, [NaijaTransfer](/) handles multi-tens-of-GB uploads without the 2 GB cap that WeTransfer throws at free users. If you're delivering to broadcasters regularly, [our pricing](/pricing) makes more sense at scale.

## One thing I got wrong for years

I used to deliver ProRes to every client, thinking bigger file meant more professional. A client in Abuja on a weak connection spent 14 hours downloading a ProRes 422 HQ file she was just going to view on a laptop. H.264 would have been 4 GB instead of 48 GB and she would have seen the same thing. Match the codec to the recipient's actual use. Not to your ego.

## Closing

Pick the codec, pack the file, [send it here](/). Stop mailing hard drives unless the client explicitly asked.
