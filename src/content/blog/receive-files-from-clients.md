---
title: "Receiving files from clients: a producer's request-flow playbook"
description: "How to ask a client for 20 GB of reference footage without a chain of broken links, and where file-request links beat email."
date: "2026-04-19"
cluster: "compare"
tags: ["workflow", "client-delivery"]
---

Most conversations about file transfer are about sending. The receiving side gets less attention and causes more producer pain. Asking a client for 20 GB of reference footage through email is where projects go sideways, and the fix is almost always structural, not technical.

The default flow most producers use is: ask in email, client replies "sure, how should I send it?", producer says "whatever's easiest," client sends a WhatsApp voice note saying they're in traffic and will send tomorrow, nothing arrives for four days. Then the client sends a link that expires in two days because they used a free tier. This is not an invented scenario, it's roughly every third project I've watched run.

## The fix: file request links

A file request link is a URL you generate in your transfer tool, send to the client, and they use to upload directly into your account. They don't need an account. They don't need to explain their choice of tool. They don't need to pick expiry settings. They click, they drag, they go.

This turns the conversation from "how are you going to send me the files?" into "upload here when you're ready." Which is a dramatically shorter sentence with a dramatically higher completion rate.

## Why file requests beat email and WhatsApp

### Email attachments die at 25 MB

Most mail servers refuse attachments larger than 25 MB. For reference footage from a phone shoot, you're past that limit in one clip. We wrote about [why email won't take 4 GB attachments](/blog/why-email-wont-take-4gb-attachments) in detail, but the short version: it's a 1990s protocol limit that nobody is going to fix.

### WhatsApp compresses

Videos sent through WhatsApp (even on "best quality") get recompressed to around 1.5 Mbps bitrate. For reference footage that's fine. For actual production material it's a disaster. You will be deliverably a final color-graded piece based on source footage that lost 80 percent of its data in transit. Always use a file-level tool, not a chat app.

### Google Drive means the client needs an account

Every friction point cuts completion rate. If the client needs to log into Google, create a shared folder, invite you by email, and wait for confirmation, you've stacked four failure points before a single byte moves. File request links have zero.

## The producer's playbook

### Before the project starts

Send a one-line note with two links: one for the client to upload reference material to you, one for you to deliver final assets back to them. Different links, different purposes. Clients treat the relationship as structured from day one.

### When you ask for something mid-project

Don't ask in email, ask in a task management tool if you use one, with the upload link embedded. Notion, Asana, whatever. If you don't have that, email is fine, but always include the upload link in the first message. Never ask "how should we move the files?" because the answer is always "the tool I already sent you a link for."

### After the client uploads

Confirm receipt immediately. "Got it, here's what I received: three .mov files, 4.2 GB total, thanks." This tiny feedback loop builds trust and also catches the case where they uploaded the wrong files.

## The specific workflow that saves producers hours

This is the flow I've seen work across eight Lagos studios:

1. Project kickoff call. Producer sends the client a file request link at the end of the call, in the same email that confirms scope.
2. Client uploads reference material within 48 hours. Producer gets a notification, confirms receipt.
3. Mid-project, producer drops a short email or DM with a new file request link for any new assets needed.
4. At delivery, producer uses a separate send flow (not a request) with short expiry and download tracking.

This reduces the number of "can you resend?" messages by roughly 80 percent. Which means you spend your producer time producing, not chasing.

## The client types to watch for

### The "I'll put it on my cousin's Google Drive" client

Gently redirect. They will forget, the link will go dead, or they will share the wrong folder. Send your upload link back: "easier if you drop it here, no login needed."

### The "I'll email it in pieces" client

Redirect harder. Split files are how you end up with a corrupted 7z that won't extract. We covered this in our post on [ZIP vs RAR vs 7z for creatives](/blog/zip-vs-rar-vs-7z-for-creatives). Spare everyone the headache.

### The "can I just drop it off on a USB?" client

This is actually fine for very large transfers if they're local to you. Over 100 GB, a hard drive is often faster than broadband. Just label it clearly and track it.

## What a good file request link setup looks like

Named link ("Client X reference material"), expiry 30 days, no password, notification on upload. You want this one to be easy. Friction at the upload step is friction on your own business.

For a deeper look at how transfers work when the client is the one with bad internet, our guide to [sending large files in Nigeria](/send-large-files-nigeria) covers the line-quality side. It applies equally in reverse.

A useful read on ops flows specifically for creative studios is [PCMag's productivity coverage](https://www.pcmag.com/) of file-request tools. Their comparative reviews of the request feature across WeTransfer, Dropbox, and others highlight how uneven the implementations are.

Tired of chasing clients for files over WhatsApp? [Start a transfer](/) and use a file-request link the next time you need reference material.
