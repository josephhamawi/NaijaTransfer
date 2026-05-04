---
title: "Working from Lagos when your clients are in London or New York"
description: "How Nigerian creators actually deliver on deadlines across three time zones, and the file-transfer cadence that keeps projects on schedule."
date: "2026-04-19"
cluster: "speed"
tags: ["remote-work", "collaboration", "nigerian-internet"]
---

Working remotely across three continents isn't hard because of the time zones. It's hard because of the file transfer latency baked into every handoff. A London client who sends a 4 GB asset at 5 pm GMT expects you to have reviewed and sent notes by their next morning. If it takes 90 minutes to download and another 90 to upload your response, that window gets tight.

## The three-timezone math

Lagos is +1 UTC. London is 0 or +1 depending on DST. New York is -5. That gives you a useful overlap pattern:

Your morning (9 am to noon Lagos) is London's 8 to 11 am. Full overlap. This is when sync calls with EU clients happen.

Your afternoon (1 pm to 5 pm Lagos) is London's noon to 4 pm, and New York's 7 am to 11 am. Everyone's awake. This is prime delivery window.

Your evening (6 pm to 10 pm Lagos) is London's 5 to 9 pm, and New York's noon to 4 pm. London is winding down. New York is mid-day.

The trap: your 9 pm Lagos upload happens on a congested residential line, for a client who wants the file by their start of business. If the upload takes 3 hours because of evening congestion, you miss their morning.

## The delivery cadence that works

Experienced Lagos creators working with global clients develop a rhythm. Morning is for review and small turnaround work. Afternoon is for uploads of completed deliverables, while the line is uncongested. Evening is for review of incoming assets, not for sending big files.

This means if a client wants a delivery overnight their time, you finish the work in your afternoon and start the upload at 2 or 3 pm Lagos. The file lands on their server before you break for dinner. You don't gamble on 9 pm throughput.

One video editor I know in Yaba runs every big upload between 6 am and 8 am. That's her London morning, but also Lagos pre-peak. She wakes up early on delivery days specifically to avoid the evening congestion window.

## Handling clients who don't understand bandwidth

The hardest conversation in remote work is explaining why a 12 GB project file takes 2 hours to send. Clients in New York on Verizon FiOS don't think about upload time. Their mental model is "click upload, go get coffee, it's done." That model doesn't survive contact with Lagos residential fiber at 9 pm.

The answer is not to explain the physics in the middle of a deadline. The answer is to pad your estimates. If the upload will take 90 minutes, tell the client "I'll have it to you by 3 pm your time" and mean 2 pm Lagos. If they reply with "can you make it an hour earlier?" you say yes, because you've already built in buffer.

Techcabal published a [useful piece](https://techcabal.com/) last year on Nigerian creators working for international agencies that covered this specifically. The people who win are the ones whose delivery predictability is higher than their raw speed.

## File transfer as the invisible bottleneck

Projects die in the handoff. A London editor uploads raw footage at 2 am London time expecting you to have it by 9 am Lagos. The upload takes 6 hours because their ISP is fine but your ISP's international transit chokes on the incoming stream. By the time you start watching the file, you've lost a working morning.

The fix is bidirectional. They upload to a service with a Lagos edge. You download from that edge, not from Virginia. The same file that took 6 hours over the Atlantic takes 45 minutes edge-to-you. Setting this up once with a client pays for itself on every subsequent project.

For a full breakdown on the edge argument, [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) walks through the origin comparison.

## The weekly billing nobody talks about

If you're on a retainer, file transfer time is just time you've already been paid for. If you're on hourly, it becomes a line item. Some Lagos freelancers bill "transfer time" as part of project management, which is reasonable given that you're babysitting a connection for 90 minutes instead of doing billable work.

More sustainably, invest in a better pipe. Swift or ipNX fiber, 50 Mbps symmetric, costs 35,000 to 45,000 naira monthly. If it saves you 4 hours a week of waiting for uploads, the ROI is instant at any hourly rate worth having.

For studios with multiple creators sharing the same network, [sending beat packs to collaborators](/blog/sending-beat-packs-to-collaborators) looks at the cadence question for music specifically, and the same lesson applies: schedule the transfer, don't improvise it.

## The delivery handoff checklist

Before big deliveries to international clients, a short list. Confirm the file is actually done before you start uploading. A 3 hour upload of the wrong cut is 3 hours you don't get back. Start the upload during your afternoon, their morning, or overnight to them. Send the download link with an explicit "expires on" date. And always include the client's preferred download client, because some corporate IT departments block generic file-share domains.

Work this way and the three-timezone gap stops being a constraint. It becomes a schedule. [Try it free](/) to run the afternoon-delivery test on your line.
