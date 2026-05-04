---
title: "VPN and file transfer: when it helps, when it hurts"
description: "A clear-eyed look at whether a VPN makes your upload faster or slower in Nigeria, with the specific cases where each is actually true in practice."
date: "2026-04-19"
cluster: "speed"
tags: ["vpn", "upload-speed", "technical"]
---

VPN advice on the Nigerian internet is split between "VPN will fix your slow upload" and "VPN will kill your upload speed." Both are sometimes right. The truth depends on what specifically is wrong with your direct connection and which VPN you're using. Let's sort it out.

## The default: VPN is slower

A VPN adds work. Every packet gets encrypted on your laptop, sent to the VPN server, decrypted there, forwarded to the real destination, then the response comes back the same way. That's extra CPU, extra latency, and extra hops.

On a healthy direct connection, a VPN will make your upload slower by 10 to 40 percent. That's the encryption overhead plus the detour through the VPN server. If your ISP is routing your packets efficiently to the destination already, you're paying for nothing.

## When VPN is faster

There's one specific case where VPN makes uploads faster in Nigeria: your ISP's international transit is the bottleneck, and the VPN provider has better peering than your ISP.

Concretely: MTN residential at 9 pm in Lagos has saturated transit to Frankfurt. Your direct upload to a Frankfurt server gets 1 Mbps. You enable NordVPN to a London endpoint. Your laptop now sends encrypted traffic to London, where NordVPN's infrastructure ships it onward to Frankfurt over NordVPN's network, which has paid transit that isn't congested. The net upload speed ends up at 3 Mbps, triple the direct number.

This happens because the VPN provider is effectively routing around your ISP's bad transit. You're not escaping Nigerian internet, you're escaping the specific bad path your ISP is using.

Arstechnica [covered this effect](https://arstechnica.com/) a few years ago in a different geography, and the mechanism is the same everywhere: when your ISP's path is bad and the VPN's path is good, the detour wins.

## When VPN makes it worse

Three scenarios where VPN costs you throughput.

**Good direct path.** If your ISP peers well with the destination, the VPN detour just adds overhead. Lagos to Cape Town on Airtel, for instance, often has decent direct peering. Adding a VPN routes you through Europe and doubles the path.

**Oversubscribed VPN endpoint.** Free VPNs and some consumer-tier paid VPNs oversell their endpoints. Your "fast London server" is actually hosting 3,000 other users at the same time, and throughput is worse than any direct path.

**UDP blocked or throttled.** Some Nigerian ISPs throttle or shape non-port-443 traffic. WireGuard uses UDP 51820 by default. If your ISP is shaping UDP, your VPN underperforms dramatically. Switch to OpenVPN over TCP 443 and the throttling goes away, at the cost of some overhead.

## Picking a VPN server location

If you've decided to use a VPN for uploads, pick a server close to your actual destination, not close to you. The goal is to get the encrypted leg to where it's useful.

Uploading to a Frankfurt-origin service: pick Frankfurt or Amsterdam VPN endpoints. Your encrypted traffic goes to Europe, gets decrypted, and the final hop to the destination is tiny.

Uploading to a Lagos-origin service: a VPN doesn't help you. Just connect directly. If your direct path to Lagos is bad, something is very broken at your ISP, and the VPN won't fix that.

Uploading to a Virginia-origin service: pick London or New York VPN endpoints. A VPN that terminates in New York has a shorter last hop to Virginia than your direct Lagos-to-Virginia path.

## The privacy angle, briefly

For sensitive file transfers, you might want a VPN not for speed but for traffic privacy. Your ISP can see you're uploading to a specific service domain, though not the file contents (HTTPS handles that). A VPN hides even the destination.

For most creative work, this doesn't matter. For legal or regulated content, or for transfers where you don't want your ISP logging the destination, a VPN is a privacy layer worth having even if it slows the upload slightly. Nigeria's [NDPR guidance](https://ndpr.gov.ng/) is worth reading if you're handling client data that falls under regulated categories.

## The VPN + parallel upload combination

If you're on a VPN and using a multipart parallel uploader, something interesting happens. The parallel streams all go through the VPN tunnel, which means the VPN endpoint becomes a shared bottleneck across your streams. You lose some of the benefit of parallel because all your streams are competing at the VPN exit.

For this reason, parallel uploads through a VPN rarely scale past 4 streams usefully. If you're not VPN'd, 8 streams is a better default. See [parallel vs single-stream](/blog/parallel-vs-single-stream-uploads) for the underlying logic.

## The practical recommendation

Start without a VPN. Measure your actual upload speed to the actual destination you care about. If it's bad, try a VPN with an endpoint close to the destination. If the VPN makes it measurably better, use it. If it doesn't, drop it.

Don't use a VPN as a reflexive habit for file transfer. It's a specific tool for a specific problem, and using it where it doesn't apply just costs you throughput. For the base case, a closer origin is a better solution than a VPN detour. [Sending large files in Nigeria](/send-large-files-nigeria) covers the origin question specifically.

Run an A/B test tonight: upload a 1 GB file direct, then with your VPN on, then compare. [Try it free](/) and see which path your line prefers.
