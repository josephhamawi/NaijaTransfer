---
title: "How to measure your actual upload speed, not the number MTN advertises"
description: "The difference between advertised and effective upload speed, and three ways to test what your connection really delivers at 8 pm on a Tuesday."
date: "2026-04-19"
cluster: "speed"
tags: ["upload-speed", "testing", "nigerian-internet"]
---

The number on your ISP's bill is a promise, not a measurement. What you actually get depends on the time of day, the distance to the test server, how many neighbors are watching YouTube, and whether your router has been on for six weeks straight. Testing once, at noon, with Speedtest picking its nearest server tells you almost nothing about your real upload capacity.

## The three numbers that matter

When you upload a file for real, three things get measured whether you know it or not. First, your raw link speed in Mbps. Second, the effective throughput to the actual destination, which is usually 30 to 60 percent of raw. Third, the goodput after TCP overhead, retransmits, and any encryption, which is lower still.

Airtel home fiber sold me 15 Mbps up. It delivers 3 up in the evening. That's not because Airtel is lying. It's because the path from my router to the server on the other end includes 11 hops, two of which are congested at 9 pm.

## Test 1: the naive Speedtest

Run [Speedtest](https://www.speedtest.net/) and let it pick a server. You'll get a number that looks good. Ignore that number. That's the peer server sitting one hop away from your ISP, which has dedicated peering. It's not representative of anything you actually do.

Do it anyway, three times. At 6 am, at 2 pm, at 9 pm. Write down the upload number for each. If the 9 pm number is more than 40 percent lower than the 6 am number, your ISP is running hot on contention during peak.

## Test 2: Speedtest with a distant server

Now rerun the test, but manually pick a server in Frankfurt, London, or Virginia. This approximates the real path your files take when you send them to an internationally hosted service.

On my MTN 5G router, Lagos-to-Lagos Speedtest gave me 42 Mbps up. Lagos-to-Frankfurt gave me 8. Lagos-to-Virginia gave me 4.2. All three numbers were taken within ten minutes. The gap tells you how much of your "speed" is actually available for the work you do.

## Test 3: the upload-a-real-file test

The best test is the one that matches your actual workflow. Pick a 500 MB file. Upload it to three places: Google Drive, your file transfer service of choice, and, if you can, a server in Lagos. Time each one with a stopwatch on your phone.

Divide 500 MB by the number of seconds, multiply by 8, and you get effective Mbps. If Google Drive took 18 minutes and a Lagos-origin transfer took 4, the difference isn't your connection. It's path and protocol.

This is why we built NaijaTransfer with POPs on this continent. Side-by-side testing is basically how [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) stops being an opinion and starts being a number.

## How to track it over time

One test is a photograph. You want a movie. Pick the same time of day, same Wi-Fi network, same test server, and run it weekly. A shared spreadsheet with five columns works fine. Date, time, download, upload, server.

After a month, you'll see patterns. Tuesday evenings might always be worse than Thursday mornings. School holidays might flatten the curve. You might notice your router needs a reboot every three weeks. That knowledge is worth an hour of testing.

## What to do with the number

Once you know your actual effective upload at the time you need to send files, plan around it. A 5 GB delivery on a 3 Mbps effective link takes almost four hours of wall time. If you're told "send it by 4 pm," you start at noon, not 3:45. For planning large workflows, the math in [uploading a 10 GB file](/blog/uploading-10gb-file-nigerian-broadband) gets into the actual numbers.

The point is not to make you paranoid about your ISP. It's to stop you blaming yourself when a file takes twice as long as the plan says it should. Your plan was based on a number that only exists at 3 am.

Want to see what your line actually does on a transfer that ends at a Lagos edge? [Try it free](/) and check the timer.
