---
title: "Optimizing uploads on MTN, Glo, Airtel, and 9mobile"
description: "Carrier-by-carrier notes on which Nigerian mobile network uploads best at which times, and the APN tweaks that help tethered creators finish on time."
date: "2026-04-19"
cluster: "speed"
tags: ["mobile", "nigerian-internet", "upload-speed"]
---

Every creator in Lagos has a favorite carrier, and the favorite is usually the one that didn't fail during the last deadline. That's not a methodology. After two years of tracking upload speeds across four SIMs in the same drawer, there are actual patterns, and they're not what the marketing pages say.

## MTN: best at 2 pm, mediocre after 8 pm

MTN's 4G+ in Ikeja gives me a consistent 12 to 18 Mbps up from 10 am to 4 pm. After 8 pm it drops to 3 to 5. This isn't unique to my block. Ookla's mobile intelligence shows MTN holding the highest median daytime upload in Lagos but falling behind Airtel on 5G during evening peak in several LGAs.

If you're tethering to finish a project, MTN wins in the afternoon. It's the closest thing Nigeria has to a reliable daytime mobile upload. Just don't plan a 9 pm delivery on it unless you like watching progress bars breathe.

## Glo: cheapest for bulk, worst tail latency

Glo's data is the cheapest per gigabyte if you're uploading 10 GB a week. But Glo's tail latency, meaning the occasional 2 to 5 second packet delays, is the worst of the four. That's fine for streaming, which buffers. It's terrible for upload protocols that retry on timeout.

I've had Glo sessions where raw speed tested at 14 Mbps up but an actual file upload averaged 2.8. That gap is retries eating your bytes. For large-file workflows, that unpredictability makes Glo a second choice even when the pricing looks good.

## Airtel 5G: fast when it works, rage when it doesn't

Airtel 5G is a rocket. When I'm in a 5G zone in Lekki Phase 1, I've hit 90 Mbps up. That's better than most home fiber in Lagos. The catch is coverage collapses past the main roads. Walk 200 meters into a side street and you're back on 4G at 8 Mbps.

Also, Airtel drops. At 11 pm on a random Tuesday last October, I lost the tower four times in 40 minutes during a client handoff. I called customer care. The agent asked me to reset my SIM. Twice. The fault, it turned out, was a power outage at the Lekki base station. I found out because the apartment next door told me their WiFi was also out, and it uses the same backhaul.

## 9mobile: the surprise at 6 am

9mobile's network is smaller, so it's less congested. In Maitama, 9mobile 4G gives me 9 to 11 Mbps up at 6 am, which is better than Airtel at the same hour on the same block. Coverage is the issue. If you're in an area with decent 9mobile signal, it's genuinely competitive for off-peak uploads.

For Port Harcourt and Abuja specifically, several creators have told me 9mobile is their go-to secondary SIM for resilience when MTN is acting up. In Lagos, it's more hit-or-miss.

## APN and tethering tweaks that help

Three things move the needle. First, on Android tethering, switch the hotspot to 5 GHz-only if your laptop supports it. Fewer devices contend on 5 GHz and you avoid microwave interference. Second, for iPhone, disable "Low Data Mode" during uploads, because it throttles background TCP streams. Third, if you're using an MTN SIM in a MiFi, set the APN manually to `web.gprs.mtnnigeria.net` rather than letting the device autoconfigure. The autoconfig APN sometimes gets routed through a proxy that caps upload.

If your phone is running hot during a long upload, thermal throttling is real. Lay the phone on a cold marble surface or a cooling pad. A shirt wrapped around the phone, which people do, traps heat and halves your throughput after 15 minutes.

## The carrier-agnostic thing you control

Which carrier you use matters less than where your upload is going. A Lagos-origin transfer service treats all four carriers as local traffic. A Frankfurt-origin service treats all four as international. On my testing, the carrier swap changes upload time by 20 to 40 percent. The origin swap changes it by 60 to 80 percent.

For a deeper look at why path matters this much, [CDN edge locations](/blog/cdn-edge-locations-matter) explains the physics. For the NaijaTransfer side of things, [pricing](/pricing) for mobile-heavy workflows is built with this exact problem in mind.

Swap SIMs, test at 6 am vs 9 pm, and find your combination. [Send a file](/) and see which carrier finishes first on your block.
