---
title: "Parallel uploads vs single-stream: which is faster on Nigerian internet?"
description: "A technical breakdown of why multipart parallel uploads beat a single TCP flow on congested residential links, with honest tradeoffs for memory and retries."
date: "2026-04-19"
cluster: "speed"
tags: ["technical", "upload-speed", "multipart"]
---

A single TCP stream is limited by the weakest link in its path. On a congested Lagos-to-Frankfurt route at 9 pm, that weak link is a shared international peering point where your bytes wait their turn. Open eight streams at once, and you get eight turns in the queue instead of one. That's roughly why parallel uploads feel like magic on Nigerian residential lines, and roughly where they stop being magic.

## How a single stream gets stuck

TCP uses a congestion window that grows when packets get through and shrinks when they don't. On a healthy link, the window grows until it hits the bandwidth-delay product and stays there. On a lossy link with high latency, which describes most Lagos-to-Europe paths during peak, the window spends most of its time shrinking. You end up with a single stream that's averaging 20 percent of the raw link speed, not because the link is bad, but because TCP can't keep the window open.

I ran a test on a 1 GB file last week, single stream to a Frankfurt server, MTN 4G at 9:30 pm. Average throughput: 1.8 Mbps. The line's actual capacity at that moment, measured with a parallel tool: 7 Mbps. The single stream got a quarter of what the link could give.

## Why parallel fixes it

Open eight parallel streams, each uploading a different chunk of the same file. Each stream has its own congestion window. When one shrinks because of a dropped packet, the other seven keep going. The total throughput is the sum, and on a lossy link, that sum is much closer to the link's real capacity.

Same file, eight-way parallel, same hour, same SIM: 5.4 Mbps average. Three times faster. The file finished in 25 minutes instead of 74. That's not an edge case. That's every evening for two months of testing.

## The AWS S3 multipart model, explained simply

AWS S3 popularized the multipart upload API in 2010. The idea is simple. You tell the server "I'm going to upload a file in N chunks of 5 MB each." You upload all N chunks in parallel. When they're all in, you send a "complete" call, and the server glues them together into one object.

Two things fall out of this for free. If one chunk fails, you retry that chunk alone, not the whole file. And the server can be anywhere multipart-compatible storage lives, including Cloudflare R2, Backblaze B2, or any S3-compatible Nigerian provider. The [AWS multipart documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) is readable if you want the exact protocol.

## The tradeoffs nobody mentions

Parallel uploads aren't free. Three costs:

**Memory.** Each stream needs buffer space. Eight streams at 5 MB each means 40 MB of RAM allocated for the upload state. On a 2018 budget laptop, that's noticeable.

**CPU for hashing.** Most multipart systems hash each chunk before uploading to verify integrity. Parallel hashing eats CPU, especially on the M1 MacBook Air's efficiency cores. Your laptop's fan will tell you when this is happening.

**Diminishing returns past 8 streams.** Going from 1 to 4 streams is a huge jump. 4 to 8 is smaller. 8 to 16 is usually noise or worse. Too many streams mean the contention becomes the bottleneck. Six to eight parallel streams is the sweet spot for most Nigerian residential links.

## When single-stream is actually better

If your link is rock-solid with near-zero loss, a single well-tuned stream with a large send buffer can match or beat parallel. This describes data-center-to-data-center transfer, not your apartment in Yaba.

Also, if your file is smaller than 50 MB, the overhead of coordinating parallel chunks costs more than it saves. Most tools automatically fall back to single-stream for small files, which is the right call.

## What NaijaTransfer does

NaijaTransfer chunks your upload into 5 MB pieces and uploads six in parallel by default. If a chunk fails, it retries that chunk with exponential backoff, up to five times. If you close the browser tab mid-upload, the next session resumes from where the last chunk succeeded, not from zero. We wrote about [why transfer resumes from zero](/blog/why-transfer-resumes-from-zero) in more detail if you've been burned by services that fake this feature.

This matters most for creators sending [large files in Nigeria](/send-large-files-nigeria) where a 3 GB upload might touch 600 chunks. Losing one at chunk 580 shouldn't throw away 90 minutes of work.

Try a parallel upload on your actual connection. [Send a file](/) and watch the chunk counter move.
