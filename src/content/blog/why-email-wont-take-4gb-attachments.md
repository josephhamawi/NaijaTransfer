---
title: "Why your 4 GB video won't attach to Gmail, Outlook, or Yahoo Mail"
description: "The attachment ceiling for every major provider in 2026, why it exists, and the realistic options when you actually need to send that file."
date: "2026-04-19"
cluster: "formats"
tags: ["email", "attachments", "file-size"]
---

Email was designed in 1971 for a world where a 5 KB message was a big deal. Nothing about the protocol has changed in the 50-plus years since, even though the things we want to send over it have grown by roughly six orders of magnitude. That's why your 4 GB video won't attach to Gmail. It's not a Gmail problem. It's an email problem.

## The actual limits in 2026

Gmail caps attachments at 25 MB for outgoing messages. If you try to attach something larger, Gmail quietly converts the attachment to a Google Drive link. The file itself doesn't travel with the email. Incoming messages max at 50 MB.

Outlook.com and Outlook 365 sit at 20 MB for Outlook.com free accounts, 150 MB for paid Microsoft 365 mailboxes. Enterprise tenants can push this higher, up to around 1.5 GB on specific SKUs, but most admins don't bother.

Yahoo Mail is 25 MB. iCloud Mail is 20 MB for the attachment itself, though Mail Drop (Apple's equivalent of Gmail's Drive trick) handles up to 5 GB via a separate link.

Zoho Mail, Proton Mail, Fastmail, and the rest all cluster between 20 and 50 MB. Nobody is more generous than that by default, and there's a reason.

## Why the limits exist

Email attachments aren't actually files. They're base64-encoded text embedded in the message body. Base64 inflates binary data by about 33 percent, so your 20 MB video becomes 26.6 MB on the wire. Multiply that by millions of messages per hour and the math gets ugly fast.

SMTP, the protocol underneath email, also doesn't handle resume or chunking. If your 200 MB attachment fails at 80 percent, you start over. From zero. Every time. This is why the spec itself (RFC 5322, if you like documents) tacitly assumes messages stay small. The [W3 email foundations](https://www.w3.org/Protocols/rfc822/) are worth a skim if you want to know why it's like this.

Servers also scan attachments for malware, which means every 50 MB file goes through an antivirus pipeline before it reaches the recipient. Large files would tie up those pipelines and choke the rest of the queue.

## What happens when you try anyway

Gmail replaces your attachment with a Drive link silently. Your recipient gets a link, not a file. Sometimes this is fine. Sometimes they're on an airline flight without Wi-Fi and they really wanted the file attached.

Outlook throws an error. It tells you the file is too large and suggests OneDrive. Same pattern.

Yahoo just fails. Older versions of Yahoo Mail would accept the message, then silently truncate or corrupt the attachment. Newer versions block the send entirely.

If you're sending from a mail client like Apple Mail or Thunderbird, the client hands off to your SMTP server, which may or may not reject the message. I've seen attachments go out fine, then bounce three hours later when the recipient's server refused them.

## The options that actually work

Cloud storage links are the default fallback. Google Drive, Dropbox, OneDrive, iCloud Drive. Upload, grab a shareable link, paste into the email. This works but it ties your file to whoever the recipient's identity provider is. A link to Google Drive that requires a sign-in is a headache for a client who doesn't use Google.

Transfer services are the cleaner answer. WeTransfer, Smash, and [NaijaTransfer](/) all exist specifically because email attachments broke 20 years ago and never got fixed. You upload once, get a link, email the link. The recipient downloads without signing in. We've done a side-by-side in [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) if you want the comparison.

For Nigerian users specifically, a local transfer service matters because the file doesn't round-trip through Frankfurt. See [sending large files in Nigeria](/send-large-files-nigeria) for the latency math.

Physical delivery still exists too. For very large files (100 GB plus), a USB drive by courier can genuinely be faster than uploading, especially on a weak connection. Backblaze published [data on shipping drives](https://www.backblaze.com/blog/backblaze-hard-drive-stats/) that backs this up.

## My workflow for anything over 20 MB

Anything under 20 MB, I attach. Anything between 20 MB and 2 GB, I use NaijaTransfer. Anything over 2 GB, same thing but I split if the connection is flaky. Anything over 50 GB, I think hard about whether the client actually needs all of it or if I can deliver a proxy version first and the master later.

Email was never going to be the right tool for sending a 4 GB video. It's the right tool for sending the link to the 4 GB video. Keep them separate and you'll stop losing hours to failed sends.

## One last thing

If a client ever tells you "just email it," the right answer is a link. [Upload the file here](/) and paste the URL into your reply. Nobody has been impressed by a 4 GB attachment since 2006.
