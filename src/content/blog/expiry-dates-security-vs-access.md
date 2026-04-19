---
title: "Setting expiry dates that balance security and client access"
description: "How long a transfer link should live depends on who's downloading, and the three common defaults that are wrong for most Nigerian workflows."
date: "2026-04-19"
cluster: "compare"
tags: ["security", "workflow"]
---

Every transfer tool defaults to some expiry, usually 7 days. That number came from nowhere in particular, and it's wrong for most workflows. Too short for clients who take holidays, too long for truly sensitive work. The right expiry is the one that matches how fast the recipient actually opens their email plus a small buffer, no more.

The cost of getting this wrong is real and common. A dead link on the client side costs you a re-upload, often at a bad time. A link that lives too long is a small but real security exposure. Picking the right default once per workflow saves you from both.

## Why 7 days is wrong

Most people pick 7 days because it's the default. Most defaults were picked in 2012 when 7 days covered an average work week and clients checked email daily. Neither is true now.

Clients in Lagos travel. Clients take leave. Clients are junior staff whose approval chain goes through someone on vacation. Over the last 12 months at a mid-sized creative shop I consult with, the average time from "deliverable sent" to "client opens link" was 4.2 days. The 90th percentile was 11 days. A 7-day default fails the 90th percentile every time.

On the other end: 7 days is too long for anything password-sensitive. If you're sending unreleased material, a 7-day window is six more days than you need the link to live once the recipient has downloaded it.

## The three common defaults and why they're wrong

### 24 hours

The "paranoid" default. Wrong because it assumes the recipient is sitting there waiting. If they're in a different time zone, asleep, in a meeting, or just don't check email until tomorrow morning, you've burned the link. Fine for "I just sent this, go check it now on the phone call" flows. Not fine for async delivery.

### 7 days

The "safe" default. Wrong because, see above, 10 percent of clients take longer than this. You'll have re-uploads once every 10 transfers. Not catastrophic but irritating.

### 30 days

The "generous" default. Wrong because for most creative work, 30 days is two weeks past when anyone legitimately needs the file. The exposure window is longer than the usefulness window.

## The better framing: expiry matches recipient behavior, not your preferences

Ask yourself: when does this client typically open my emails? If the answer is "within an hour," a 48-hour expiry is safe. If the answer is "sometime next week," 14 days is more honest. If the answer is "I have no idea, this is a new client," default to 14 days and pair it with a download limit.

The download limit is the real security backstop. With a 1-download or 3-download cap, the link becomes useless the moment the recipient grabs the file, regardless of how long the expiry is set to. See our post on [password-protecting transfers](/blog/password-protecting-your-transfers) for how this combines with passwords in practice.

## By workflow type

### Delivering finished client assets

14 days with a 3-download limit. Long enough to survive a holiday, short enough to avoid forgotten links sitting around for months. Enable download notifications so you know when they've actually grabbed it.

### Sending a review draft to a collaborator

72 hours with no download limit. You want them to be able to re-download if they close the browser tab. You don't need the link to live longer than the review cycle.

### Sending sensitive or pre-release material

48 hours, 1-download limit, password on the link. The short window is the point. If they miss it, they call you, and you send another. That's a feature, not a bug.

### Onboarding assets for a new team member

30 days, no download limit, no password. You want them to have a week after starting to grab what they need. Make it easy.

### Internal team file pass-through

72 hours with a high download limit. Treat it like ephemeral scratch space.

## The one expiry setting everyone forgets

Manual expiry. Most tools let you kill a link on demand from the dashboard. Use it. The moment you know the recipient has downloaded the file and confirmed, expire the link. This is the single highest-leverage security habit for working with sensitive material and almost nobody does it consistently. I don't either, honestly, but I do it for the 5 percent of transfers that matter most.

## Regional notes for Nigerian workflows

Lagos clients in particular have inconsistent internet access for large downloads. If you send a 10 GB deliverable on Monday and expire the link Thursday, a client on a capped data plan may not finish pulling it down in that window. Factor in connection quality. For large files, expiry should always be long enough for two failed download attempts plus a successful one. For the specifics on why 10 GB uploads are hard in Nigeria, our post on [uploading 10 GB files on Nigerian broadband](/blog/uploading-10gb-file-nigerian-broadband) has the numbers.

For a general security framework on access-control decisions, the [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework) has a clean section on the trade-off between availability and confidentiality. It's written for enterprises but the principles apply at any scale.

## The meta-rule

Default to the middle of your expected recipient behavior distribution, plus a day. Add the cheapest security backstop that doesn't inconvenience the recipient: a download limit. Don't add a password unless the material warrants it. Review the defaults once a year against how long your recipients actually take.

Ready to send with an expiry that matches your workflow rather than a vendor default? [Send a file](/) and set it for 14 days with a download cap, which works for most client handoffs.
