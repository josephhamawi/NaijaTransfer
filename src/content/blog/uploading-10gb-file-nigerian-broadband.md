---
title: "How to upload a 10 GB file on Nigerian broadband without losing a day"
description: "A realistic plan for shipping a feature-length video or multi-track session over a Nigerian residential connection, end to end, with actual numbers."
date: "2026-04-19"
cluster: "speed"
tags: ["upload-speed", "file-size", "nigerian-internet"]
---

Ten gigabytes is the threshold where "send it" stops being trivial and starts being a project. On a 20 Mbps advertised residential line in Lagos, which typically delivers 5 to 8 Mbps of real-world upload, a 10 GB file takes between 3 and 5 hours of wall time. That's not unless something goes wrong. That's when everything goes right.

## Step one: do the math before you click

Take your effective upload speed in Mbps, divide by 8, and you have MB per second. Divide 10,240 MB by that number and you get seconds. Divide by 60 for minutes.

On 5 Mbps effective (realistic for Yaba residential fiber at 9 pm): 10,240 / (5/8) = 16,384 seconds = 273 minutes = 4.5 hours.

On 15 Mbps effective (realistic for fiber at 6 am): 10,240 / (15/8) = 5,461 seconds = 91 minutes.

On 50 Mbps effective (a Spectranet 100 Mbps plan delivering well): 27 minutes.

The point of the math is to set expectations. If you're planning to start the upload at 7 pm and your effective speed is 5 Mbps, the file won't be done until after midnight. Plan accordingly.

## Step two: pick your time window

Off-peak Nigerian residential upload performs 2 to 3 times better than peak. 6 am to 10 am gives you uncongested international transit. 2 am to 5 am is even better if you can schedule it. Evening peak, especially 8 to 11 pm, is where 10 GB uploads go to die.

If the delivery is due at 9 am the next day, start the upload at 2 am. You'll be asleep. The upload will be done. This is not workaround behavior, this is the correct plan given how Nigerian broadband actually behaves. For more on the timing window, [the best time of day to upload](/blog/best-time-of-day-upload-nigeria) has the data.

## Step three: prepare the file so you don't waste time

Before starting a 3 hour upload, verify three things.

The file is actually complete. No one wants to discover at chunk 450 that you exported with the wrong audio track. Open the file, scrub to the end, confirm the last frame or last bar is what you meant to send.

The compression is right. A 10 GB delivery that could have been 6 GB with a smarter codec is an hour of your life you didn't need to spend. [Video codecs for delivery](/blog/video-codecs-for-delivery) walks through what's worth re-encoding and what's not.

The file is on your fastest disk. Uploading from a slow external USB drive can bottleneck you below your connection speed. SSD to upload, HDD only if nothing else is available.

## Step four: use a tool that resumes

This is not optional. A 10 GB upload that fails at chunk 1,847 and has to restart from zero is a personal tragedy. The tool needs to support resume on the actual chunks that succeeded, not the entire transfer.

Test this before you trust it. Start a 1 GB test upload, kill your network at 40 percent, reconnect, and see if it resumes from 40 or starts from 0. Most tools that claim resume actually don't. The ones that do will visibly skip the already-done chunks and continue.

NaijaTransfer resumes from the last successful chunk. If the upload dies at chunk 580 out of 2,048, the next session starts at chunk 581. This matters most on the 10 GB category of file.

## Step five: don't babysit

Start the upload. Don't watch it. Checking the progress bar every 5 minutes costs you focus and doesn't make the upload faster. Set a calendar reminder for when the math says it should be done, plus 20 percent buffer, and do something else.

Some creators keep a second laptop for uploads and do their actual work on a different machine. That's excessive for most people. More practical: put the upload on your main laptop, close the heavy apps (Premiere, Logic, Ableton) to free RAM, and work on email or notes for the duration.

## Step six: verify the download

Once the upload completes, open the download link yourself. Does the file size match what you sent? Is the MD5 or checksum, if your tool provides one, correct? Most services don't show you this, but the good ones do. If the file is corrupted, you want to know before the client does.

The Nigerian Communications Commission publishes broadband quality reports quarterly. The trend since 2022 has been gradual improvement in median residential upload, especially in urban Lagos, but the variance is still wide. [The NCC data](https://ncc.gov.ng/) is worth skimming once a year.

## What 10 GB actually is

A 60 minute 4K ProRes 422 HQ video is roughly 45 GB. A feature film master in ProRes LT is 60 to 80 GB. A fully tracked Logic session with recorded strings and no compression is 8 to 15 GB. 10 GB is the size of something real, which is why the planning matters.

For workflows that live in this size range regularly, [the business plan](/business) pays for itself on the first month. The free tier handles one-off 10 GB transfers without complaint.

Start your 10 GB upload at 2 am tonight. [Send a file](/) and set the timer.
