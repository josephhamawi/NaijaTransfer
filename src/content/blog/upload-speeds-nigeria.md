---
title: "Why file uploads are slow on Nigerian residential internet"
description: "A plain explanation of asymmetric ISP routing, international transit, and evening congestion that slows uploads from Lagos to 1 Mbps on a 15 Mbps plan."
date: "2026-04-19"
cluster: "speed"
tags: ["nigerian-internet", "upload-speed", "technical"]
---

Your 15 Mbps plan is honest about download. It lies, quietly, about upload. Most Nigerian home broadband is asymmetric, which means the pipe going out of your apartment is a fraction of the pipe coming in. That's before you factor in the trip your packets take to get anywhere a client actually cares about.

## The asymmetric ratio nobody tells you about

Residential ISPs in Nigeria run asymmetric links because that's what the average household needs. Streaming, scrolling, video calls on the receiving end. The modems Spectranet and ipNX put in your living room are often capped at a 4-to-1 or 8-to-1 down-to-up ratio, which is fine until you try to send a 3 GB edit to a colorist.

I learned this the hard way in Surulere on a "20 Mbps" Spectranet line. Download tested at 18. Upload tested at 2.3. The sales rep on the phone said that was "normal for home fiber." He wasn't wrong. He just wasn't selling me what I thought I was buying.

## Where your packets actually go

When you hit upload on a service hosted in Frankfurt or Virginia, your file doesn't fly there. It hops. From your router to your ISP's edge in Lagos. Then onto a shared international transit link, usually through MainOne or WACS. Then across the Atlantic to a POP in Europe. Then east or west depending on where the origin server lives.

Each of those hops adds latency. More importantly, each one is a shared resource. When 40,000 other Lagos subscribers are watching Netflix at 9 pm, that transit link saturates. Your 2.3 Mbps up becomes 800 Kbps up, and the stream keeps pausing and reconnecting.

## Why evenings are worse than mornings

Ookla's Speedtest intelligence on Nigerian ISPs shows a clear diurnal curve. Evening speeds from 7 pm to 11 pm drop by 30 to 60 percent compared to 5 am baseline on the same line. That's not your modem. That's the contention ratio kicking in.

The NCC's quarterly reports list similar patterns across the four big carriers. You can verify it yourself on [Speedtest](https://www.speedtest.net/) by running a test at 6 am, then again at 9 pm on the same Wi-Fi. The difference is usually embarrassing.

## What an edge in Lagos actually changes

If your file transfer service has an origin in Frankfurt, your upload goes all the way there before anyone acknowledges it received the bytes. If it has an edge POP in Lagos, your upload finishes at the edge, and the service handles the international leg internally, often over a paid-transit link that isn't contending with residential traffic.

On a 2 GB test last month, the same file on the same Airtel line took 47 minutes to a Frankfurt-origin service and 11 minutes to an edge-in-Lagos one. Both were "upload to cloud." One made the round trip. The other didn't.

This is the core argument for [sending large files in Nigeria](/send-large-files-nigeria) through something that already runs POPs on this continent. Geography beats bandwidth.

## What you can actually do about it

You can't fix the transit link. You can work around it:

Schedule big uploads for off-peak windows, which in Lagos means 1 am to 6 am. Use a service with multipart parallel uploads so you're not bottlenecked by a single TCP stream. And make sure your "cloud" isn't secretly across an ocean. If you're curious why a single stream is slow on congested links, we wrote about [parallel vs single-stream uploads](/blog/parallel-vs-single-stream-uploads) with actual numbers.

The uncomfortable truth is that most of what's slow about Nigerian internet has nothing to do with your ISP's competence. It's the shape of the pipe plus the distance to the destination. Change either variable and the math changes.

Try an upload on a Lagos-origin transfer and watch your evening times. [Send a file](/) free and see the difference.
