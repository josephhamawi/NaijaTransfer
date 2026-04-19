---
title: "CDN edge locations and why proximity matters for uploads"
description: "A practical explanation of how a Lagos POP versus a Frankfurt origin changes your real-world upload time on the same phone and the same network."
date: "2026-04-19"
cluster: "speed"
tags: ["cdn", "technical", "infrastructure"]
---

CDN marketing talks about "200+ edge locations" like it's a competition. For a reader in Lagos, what matters is whether one of those edge locations is in Lagos, or at least on your continent. The difference between an edge at your door and an origin across an ocean is not a little bit. It's two different services pretending to be the same.

## What an "edge" actually is

A CDN edge is a server the CDN owns, sitting in a data center close to end users, that caches content and accepts uploads. When you hit the CDN, DNS routes you to the nearest edge, which talks to the origin on your behalf over its own internal network.

The magic isn't the edge itself. It's that the CDN's internal network between the edge and the origin is usually much better than your ISP's international transit. Cloudflare's backbone, Fastly's, Akamai's, each runs on long-term fiber contracts with predictable latency. Your residential upload goes over shared best-effort links with unpredictable everything.

## The Lagos POP math

Cloudflare has a POP in Lagos, confirmed in their public infrastructure map. AWS opened Cape Town in 2020, which is the closest full region for most "global" services. Google Cloud has Johannesburg and an edge in Lagos. Most of the big CDNs have something in Lagos, Cape Town, or Nairobi now, which is a different world than 2018.

When you upload to a service with a Lagos edge, your bytes travel maybe 15 to 30 milliseconds to reach that edge. When you upload to a service whose nearest server is in Frankfurt, your bytes travel 180 to 240 milliseconds, assuming no congestion. At 9 pm with congestion, the Frankfurt number regularly doubles.

Latency doesn't sound like it should affect throughput, but TCP's congestion window is literally shaped by round-trip time. Double the latency, and your effective upload speed on a single stream drops by more than half on a lossy link. That's why the same file, same ISP, takes 11 minutes to Lagos and 47 to Frankfurt on a bad evening.

## Upload vs download at the edge

Here's where it gets interesting. Most CDN customers care about download. Images, video, JavaScript, delivered from the edge to the end user. The edge caches that content and ships it fast.

Uploads are different. The edge has to receive the bytes and ferry them to the origin for permanent storage. If the origin is in Oregon and you're uploading from Lagos, the edge still has to make the Lagos-to-Oregon trip eventually. But, and this is the key, it does it over its own network, not yours.

Your user session ends as soon as the edge has the bytes. The CDN handles the "last mile" to origin internally, often over dedicated fiber with 2 percent the packet loss of your ISP's international transit. The [Cloudflare Radar](https://radar.cloudflare.com/) dashboard publishes per-country peering data that makes this concrete.

## Why not every service with a Lagos POP is equal

Having a POP in Lagos is not enough. The service has to actually accept the upload at that POP and not just use it as a routing hint. Some "global" services use edge POPs purely for download caching and force uploads through a single origin region. For those, a Lagos POP doesn't help your upload at all.

The test is simple. Upload a 100 MB file and watch the network panel in your browser devtools. If the PUT request is going to a hostname that resolves to a Lagos IP, you're uploading locally. If it resolves to a Dublin or Virginia IP, you're not. Most services don't advertise this, but the DNS doesn't lie.

## What this looks like in practice

NaijaTransfer's ingest endpoints resolve to African data center IPs for clients in Nigeria. That's the whole pitch. The uploading part of your workflow lives on this continent, not the other one. For anyone working on [large files in Nigeria](/send-large-files-nigeria), that geography is the main variable.

The tradeoff is that if your recipient is in Tokyo, the download leg is still going to be long. But the download leg is their problem, not yours, and it's also usually faster than the upload leg from Nigeria because intercontinental peering to Japan has more redundancy than transit out of Lagos.

For context on how big this effect really is, [uploading a 10 GB file on Nigerian broadband](/blog/uploading-10gb-file-nigerian-broadband) works through the math with real numbers.

Curious what your line looks like ending at a Lagos edge? [Try it free](/) and check the upload timer.
