---
title: "Password-protecting your transfers: what it actually prevents"
description: "What transfer passwords do, what they don't do, and when to use them plus a download limit vs expiry for real protection."
date: "2026-04-19"
cluster: "compare"
tags: ["security", "privacy"]
---

A transfer password is a speed bump, not a vault door. It keeps a casual link-forwarder from accidentally sharing your file with a group chat. It does not stop a determined attacker, it does not encrypt the file in a way that survives the server being compromised, and it does not protect you if the password gets shared along with the link.

Knowing what the feature does at a mechanical level changes how you use it. Most creators I talk to either treat passwords as overkill ("I'm just sending a mixdown") or as absolute protection ("the file is password-locked, we're fine"). Both are wrong in ways that matter.

## What a transfer password actually does

When you set a password on a link, the service requires the recipient to enter that string before the download starts. The file sits on the server in the clear (or encrypted at rest with keys the service controls), and the password gates access to the download endpoint. That's it. It's an access-control check, not end-to-end encryption.

Practically, this means:

A password stops someone who finds the link from downloading. Useful if the client accidentally forwards the email to a larger internal list, or if the link ends up in a Slack channel it shouldn't have been in.

A password doesn't stop someone with the link AND the password. If your client shares both (and many will, "here's the file Kemi sent, pass is `session01`"), protection is gone.

A password doesn't stop the transfer service from accessing the file. If you're worried about a subpoena or a rogue employee, a password isn't your tool. You want client-side encryption, which is a different feature entirely.

## When to use a password

Use it when the file is sensitive enough that accidental forwarding would be a problem, but not so sensitive that you need cryptographic guarantees. The sweet spot is:

- Unreleased music being sent to a mixing engineer.
- Client photography before they've publicly launched the campaign.
- Early cuts of a film going to a colorist.
- Contracts and NDAs going to opposing counsel.

For anything involving regulated data (health, finance, legal discovery), password-protected transfer is not the right tool. You want a compliance-specific service with audit trails, and you want to make sure your provider meets [NDPR](https://ndpc.gov.ng/) requirements as well as GDPR if European parties are involved.

## The two features that matter more than passwords

I tried three services before I realized the password was the least important lever. What actually matters for day-to-day security:

### Download limit

Cap the link at 1 download, or 3. Once the client has grabbed the file, the link stops working. No amount of subsequent forwarding matters. This is the single most underrated security feature in any transfer product. Pair it with a password and you've got real practical security.

### Expiry

Short expiry (24 to 72 hours) limits the window of exposure. If the link leaks on day 5 but expired on day 3, the leak is harmless. Combined with download limits, expiry means the exposure surface is measured in hours, not weeks. We have a separate post on picking the right expiry for your workflow, worth reading.

## The specific combo I recommend for client work

Password + 3 downloads max + 7 day expiry.

That combination covers roughly 95 percent of creator use cases. The password stops casual forwarding. The download limit stops link-reuse attacks. The expiry caps your exposure window. Any single layer being weaker doesn't compromise the whole.

For the other 5 percent (genuinely sensitive material), use encrypted archives (7z with AES-256) and send the password out-of-band, via a different channel. Not email, not Slack, not WhatsApp. A phone call. Old-school, but it's the only thing that works.

## What password sharing looks like in practice

Most leaks I've seen in creative work aren't hacks, they're casual forwards. Someone on the client side shares the link in a project group chat that includes freelancers who shouldn't see it yet. Someone copy-pastes the password into the same chat for convenience. The file is effectively public inside that group.

This is why a download limit does more work than a password. The chat has 30 people but only one clicks first. Link dies. Everyone else gets an error. Problem solved without drama.

## The NDPR context

For Nigerian businesses handling customer data, the baseline from the [NDPC Implementation Framework](https://ndpc.gov.ng/) calls for reasonable security measures during transfer. Password-protected, time-limited, download-capped links meet that bar for most non-health-non-financial workflows. If you're running a Lagos agency sending customer lists to a courier partner, that combo is probably enough. If you're a fintech sending transaction logs, you need more.

For the bigger picture on how a studio or agency should think about compliance, see our guide to [GDPR and NDPR file sharing](/blog/gdpr-ndpr-compliant-file-sharing). It covers the stuff a password alone doesn't.

Want to send your next deliverable with a password, download limit, and expiry all in one go? [Send a file](/) and set all three on the review screen.
