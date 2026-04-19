---
title: "The best time of day to upload large files in Nigeria"
description: "Why 10 pm is worse than 6 am for upload speed in Lagos, and how to plan a delivery around ISP peak-congestion windows without sacrificing sleep."
date: "2026-04-19"
cluster: "speed"
tags: ["nigerian-internet", "upload-speed", "workflow"]
---

Nigerian residential internet has a rhythm, and that rhythm punishes evening uploaders. The same 5 GB file that sails out in 18 minutes at 5 am will crawl for 2 hours at 9 pm on the same line. If you learn the curve, you can schedule around it and stop fighting physics.

## The congestion curve, described

Ookla's intelligence on Nigerian mobile and broadband upload shows a consistent diurnal pattern across ISPs:

5 am to 8 am: baseline. This is your connection at its actual capacity. Uploads test at 80 to 95 percent of the advertised ceiling. Traffic on shared transit links is low.

8 am to 12 pm: rising. Work starts, office networks ramp up, cellular towers get busier. Upload drops to 60 to 80 percent of baseline but stays workable.

12 pm to 5 pm: midday dip. Lunch and afternoon browsing on residential lines. Upload drops to 50 to 70 percent of baseline.

5 pm to 8 pm: the ramp. People come home, stream Netflix, make video calls. Upload drops to 30 to 50 percent of baseline.

8 pm to 11 pm: peak pain. The worst window of the day for residential upload. 15 to 30 percent of baseline is common. This is when single-stream uploads feel broken.

11 pm to 2 am: slow recovery. Streaming winds down. Upload comes back to 40 to 60 percent.

2 am to 5 am: the sweet spot. Virtually empty. Upload hits the ceiling. Most professional creators running automated overnight deliveries target this window.

## Why 8 to 11 pm is specifically bad

Three things align. Residential streaming is at its peak. The shared international transit links, which serve the Atlantic leg for most services, are saturated. And ISP peering congestion at the Lagos IXP level compounds the problem.

MainOne, WACS, and ACE cables all show utilization spikes in this window. When the cables are full, your packets wait. When packets wait, TCP's congestion window shrinks. When the window shrinks, your effective upload speed drops below 1 Mbps even on a line that delivers 15 Mbps at 6 am.

This isn't MTN or Airtel being cheap. It's the shape of aggregate demand. Every ISP has to provision for the 9 pm peak or eat it, and eating some of it is usually cheaper than provisioning for worst-case.

## Practical scheduling, by delivery size

Less than 500 MB. Any time. Even peak, this finishes in under 20 minutes on most lines. Don't overthink it.

500 MB to 2 GB. Afternoon or morning. 11 am to 4 pm is fine. Avoid 7 to 11 pm if you can.

2 GB to 5 GB. Morning, preferably before 10 am. If you must send in the evening, allocate 2 to 3 hours and start by 6 pm at the latest.

5 GB to 20 GB. Overnight. Start between 11 pm and 1 am, let it finish while you sleep. Alternatively, very early morning if you're awake.

20 GB and up. Fiber or nothing. Mobile can't reliably sustain 20 GB uploads without retries. Start overnight and have a backup link ready.

## The "start overnight" workflow

The pattern I've settled into: finish editing by 9 pm. Start the upload at 11 pm, when evening peak is starting to fade. Go to sleep. At 7 am, check that it finished. Send the download link to the client while I'm making coffee.

This works because NaijaTransfer resumes from chunk state if the upload dies mid-stream. If my router hiccups at 3 am, the upload picks up when the connection's back. I don't wake up to a failed transfer. [Why transfer resumes from zero](/blog/why-transfer-resumes-from-zero) covers what a real resumable upload looks like, versus the fake resume most services claim.

## The weekend and holiday effect

Saturdays are slightly better than weekdays at peak, because corporate networks are quiet. But residential streaming is usually higher, which partly offsets the gain. Sundays are the best day of the week for uploads overall.

Public holidays are a mixed bag. Christmas day morning is wonderful. Christmas evening is the worst of the year, because everyone is home, streaming, video-calling relatives overseas, and watching pirated movies simultaneously. Don't plan anything on December 25 after 6 pm.

Nairametrics has covered Nigerian broadband quality [multiple times](https://nairametrics.com/), and the variance during holidays is consistent across their reports.

## What to do if you must upload at 9 pm

Occasionally the deadline doesn't care about congestion. If you have to ship at 9 pm:

Use a parallel-upload tool. Single-stream will suffer disproportionately. See [parallel vs single-stream](/blog/parallel-vs-single-stream-uploads) for why.

Use a Lagos-origin transfer service so the Atlantic leg isn't your problem. [Sending large files in Nigeria](/send-large-files-nigeria) walks through which ones actually have local POPs.

Keep a 4G MiFi on a different carrier as a hot backup. If your fiber drops mid-upload, you pivot to mobile without starting over.

And set realistic expectations with the client. "Delivery by 10 pm" on a 10 GB file at 9 pm is a conversation, not a schedule.

Most of file-transfer stress in Lagos is scheduling stress dressed up as bandwidth stress. Fix the schedule and the bandwidth problem shrinks. [Try it free](/) on your next early-morning upload.
