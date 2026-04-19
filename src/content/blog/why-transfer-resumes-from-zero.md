---
title: "Why your file transfer resumes from zero, and how to prevent it"
description: "The difference between services that actually resume and those that pretend to, plus what a real resumable upload looks like under the hood."
date: "2026-04-19"
cluster: "speed"
tags: ["technical", "upload-speed", "resume"]
---

You've uploaded 8 GB of a 10 GB file. Your Wi-Fi blips for 30 seconds. You come back to the tab showing "Upload failed. Try again." You click try again. It starts at 0 percent. That's the service lying to you about resume. A real resumable upload doesn't do that.

## What "resume" actually means under the hood

There are two kinds of resume, and only one is useful.

**Session resume**: the service reconnects your session after a disconnect. If the upload was in progress when the connection dropped, session resume means the upload continues from where the TCP stream was. This is good for brief blips but doesn't survive a browser tab closing or the laptop sleeping.

**Chunk-state resume**: the file has been pre-split into named chunks. Each chunk is uploaded independently and acknowledged by the server. When you reconnect, the client asks the server "which chunks do you already have?" and uploads only the missing ones.

Chunk-state resume is the real thing. Session resume is a courtesy. Most services that say "resumable upload" only do session resume. That's why they start from zero when the tab closes.

## The telltale sign

Test any file transfer service with a 500 MB file. Get it to about 40 percent uploaded. Close the browser tab entirely. Wait 2 minutes. Reopen, log in, go to the upload page.

If the service shows your upload in progress at 40 percent and lets you continue, it has real chunk-state resume. If it shows nothing, or shows a failed/abandoned upload, it has fake resume. The test takes 10 minutes and saves you from trusting a service when a deadline is on the line.

## How chunk-state resume works

The client pre-computes the file's size and splits it into fixed-size chunks. For a 1 GB file with 5 MB chunks, that's 200 chunks.

Before uploading, the client asks the server: "I want to upload this file. Here's its hash. Do you have a partial upload for this hash?"

If yes, the server replies with "I have chunks 1 through 147. Send me 148 onwards." The client skips ahead.

If no, the server creates a new upload session and the client starts at chunk 1.

Each chunk upload is an individual HTTP request with its chunk index. The server writes it to partial storage and acknowledges. When all chunks are in, the client sends a "complete" call and the server stitches them together.

The AWS S3 multipart upload API formalized this pattern in 2010 and most modern file services implement something similar. [AWS's documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html) is the canonical reference.

## Why some services don't do it

Chunk-state resume needs persistent partial uploads on the server. That costs storage until the upload completes or expires. Services that handle millions of uploads a day don't want to hold half-finished files for every abandoned session. So they default to single-shot uploads with session resume, and let you start over if your tab dies.

This works for 90 percent of users uploading photos or small documents. It fails spectacularly for Nigerian creators sending 10 GB video on flaky residential connections.

## Retry logic matters too

Resume is what happens when the whole session fails. Retries are what happen when an individual chunk fails in the middle of an otherwise-healthy upload.

A good transfer service retries each chunk with exponential backoff. First retry after 1 second, next after 2, then 4, then 8, up to five attempts total. If the chunk still fails after 5 retries, then the session fails. If the session fails, you come back later and resume.

Without chunk-level retry, a single packet loss in the middle of a 10 GB upload can kill the whole transfer. With it, transient failures are invisible to the user. NaijaTransfer does exponential backoff on chunks and chunk-state resume on sessions. [Why email won't take 4 GB attachments](/blog/why-email-wont-take-4gb-attachments) covers why traditional protocols like SMTP fail these large-file scenarios in the first place.

## What to look for in a transfer service

Four questions before you trust a service with big uploads.

Does it show per-chunk progress, not just a single percentage? Services that do chunk-state resume almost always expose chunk counts in the UI because the frontend needs it internally.

Can you close the browser tab and resume? Test before you need it.

Does it expose a retry count or last-failed-chunk info if something goes wrong? Transparency here correlates with actual capability.

Does it handle files bigger than 4 GB on single-file upload? Older services still have 32-bit file size fields that silently break at 4 GB. Ispreview has documented [cases of this](https://ispreview.co.uk/) on consumer services.

## The Nigerian angle

This matters more in Nigeria than in places with reliable residential internet. A 4 hour upload from Lagos on a residential line will experience between 2 and 15 transient failures, depending on carrier and time of day. If your service treats each of those as "upload failed, try again from zero," you will literally never complete the transfer during evening peak.

With proper resume and retry, the same upload might take the same 4 hours but the user experience is "it just keeps going" rather than "I've restarted seven times." That's the difference between a tool that works in Nigeria and a tool that works elsewhere.

For how resume fits into the broader picture of [sending large files in Nigeria](/send-large-files-nigeria), the chunk model is one piece of a larger set of choices.

Test your current service with the "close the tab" method. If it fails the test, [try it free](/) on NaijaTransfer and see what real resume feels like.
