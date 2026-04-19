---
title: "Troubleshooting stalled uploads: a step-by-step fix list"
description: "The six most common reasons a file upload freezes at 47 percent, and how to diagnose which one is hitting you right now without guessing."
date: "2026-04-19"
cluster: "speed"
tags: ["troubleshooting", "upload-speed", "technical"]
---

An upload that stalls at 47 percent is not one problem. It's six different problems that all produce the same spinning cursor. Diagnosing which one you're hitting is the difference between a 2 minute fix and a 2 hour retry. Work through these in order.

## 1. TCP congestion collapse on your ISP's uplink

The most common cause. Your ISP's international transit got saturated, your single TCP stream lost a burst of packets, and the congestion window collapsed to a size so small the connection technically lives but doesn't move.

Symptom: upload speed drops from 5 Mbps to under 100 Kbps without disconnecting. No error. Just glacial.

Fix: cancel the upload, wait 2 minutes, restart. If the new upload immediately goes back to 5 Mbps, that's what it was. If you're on a service that supports multipart parallel, the restart is fast because it resumes from chunk state. If you're on a service that doesn't, the restart starts from zero and is miserable.

## 2. Router has been on for weeks

Home routers leak memory and mishandle connection state. A router that's been on for 6 weeks often exhibits weird behavior: uploads that work but upload speeds that are inexplicably 30 percent of what the connection can actually do.

Symptom: downloads are fine, uploads are slow or stalled, Speedtest shows upload much lower than expected.

Fix: power-cycle the router. Unplug for 30 seconds. Plug back in. Wait 2 minutes for full reconnection. Try the upload again. If speeds jump, that was it. I was sure my ipNX line had died and spent an hour on hold with their support before realizing I hadn't rebooted the router since Christmas.

## 3. Antivirus or firewall intercepting uploads

Some antivirus products proxy outbound HTTPS to inspect payloads. On a big upload, this doubles the work: the antivirus buffers the whole thing to scan it, then passes it through. On a laptop with 8 GB of RAM, this can cause progress to freeze entirely once the buffer fills.

Symptom: upload starts fast, then hangs at a specific percentage (often around 40 to 60) without disconnecting. Other internet still works.

Fix: temporarily disable real-time scanning. Try again. If it completes, add the transfer service's domain to your antivirus whitelist. Common culprits: Kaspersky, Bitdefender, ESET. Windows Defender rarely does this, macOS XProtect never does.

## 4. Browser hit its memory ceiling

Large uploads hold file state in the browser tab. Chrome and Safari both cap tab memory at around 4 GB on most systems. Upload a 5 GB file, and the tab can literally run out of room to buffer the next chunk.

Symptom: progress bar stops updating, tab becomes unresponsive, eventually the browser shows "Aw snap" or similar.

Fix: use a service that streams from disk rather than reading the whole file into memory. Most modern multipart uploaders do this, but some older ones don't. If you're stuck on one that doesn't, split the file into smaller pieces and upload them as separate transfers. For how to split intelligently, [splitting large projects into chunks](/blog/splitting-large-projects-into-chunks) covers it.

## 5. Laptop went to sleep

Self-inflicted but common. macOS App Nap and Windows sleep mode will both pause network activity in inactive tabs after 5 to 10 minutes. The upload appears to continue in the UI but isn't actually transmitting.

Symptom: you left for coffee, came back, and the progress bar hasn't moved since you left.

Fix: on macOS, use `caffeinate -i` in Terminal before starting the upload, or install Amphetamine. On Windows, set the power plan to "High performance" and disable sleep-on-inactivity for the duration. Also keep the browser tab in the foreground. A background tab is fair game for throttling.

## 6. The service itself is having a bad day

Rare but real. The upload endpoint is overloaded, a specific POP is degraded, or there's a rolling deploy happening. You won't know unless the service publishes a status page.

Symptom: upload fails repeatedly at roughly the same progress point. Multiple files, same behavior.

Fix: check the service's status page. Try a different service for the urgent transfer. Come back in an hour. Ookla's [downdetector](https://downdetector.com/) picks up major outages within 15 minutes of them starting, which is faster than most status pages update.

## The diagnostic flow

If an upload stalls, check in this order: reboot router, disable antivirus, restart browser, check the service's status, try from a different network (phone tether). That sequence resolves about 90 percent of cases.

If none work and the issue is persistent, it's probably your ISP's international transit. Call support, but also consider scheduling your uploads for off-peak windows. [The best time of day to upload in Nigeria](/blog/best-time-of-day-upload-nigeria) lays out when those windows are.

NaijaTransfer's resume-from-chunk means none of these failures make you start over. You cancel, you come back, and you pick up where the last good chunk finished. That's a different category of recovery than watching a single-stream upload die at 80 percent and having to begin again. [Try it free](/) if you're tired of starting over.
