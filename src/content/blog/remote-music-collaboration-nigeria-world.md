---
title: "Working with a producer in London when your studio is in Surulere"
description: "Time zones, file formats, and the rhythm of remote music sessions when one of you is on a Nigerian uplink."
date: "2026-04-19"
tags: ["music-production", "collaboration", "remote-work"]
cluster: "creators"
---

Remote music sessions between Lagos and London sound straightforward. You make a beat, you send it, they add vocals or topline, they send it back. The reality is messier. Time zones, uplink speeds, file-format disagreements, and the quiet psychology of working with someone you've never met in person all play into whether the session ships or stalls.

## The time-zone math

Lagos is UTC+1. London is UTC+0 most of the year, UTC+1 during British Summer Time. When the UK is on GMT, you're one hour ahead. When they're on BST, you're on the same clock. Either way, the overlap is generous.

What you actually care about is the network, not the wall clock. Nigerian uplinks are usually at their best between 1am Lagos time and 7am Lagos time, which is midnight to 6am London time. That means if you want a file to arrive in London by the time your collaborator wakes up, you start the upload at 2am or 3am Lagos time. They wake up at 7am London time, open their email, and the file is waiting.

This is the single most useful rhythm I've found: you upload overnight, they work during their day, they send back in their evening, which is late evening for you. You review, make changes, upload again overnight. Two round trips per 24 hours if you're both disciplined.

## The format agreement

Agree on formats up front. This sounds obvious. It isn't. I've been on sessions where I sent 24-bit WAVs at 48 kHz, the other producer's DAW was locked at 44.1 kHz, and none of us noticed the pitch shift until four hours into a mix.

Lock this down in the first email:

- Sample rate: 44.1 kHz for music that'll release on streaming, 48 kHz if there's any video attached
- Bit depth: 24-bit for working files, dithered 16-bit only for final delivery
- Stem format: WAV, not MP3, bounced from bar 1 with silence at the head
- Reference mix: 320 kbps MP3 is fine for a reference; you don't need a WAV of a rough

This one-paragraph agreement saves more hours than anything else in a remote workflow.

## The file-size reality

A typical stem pack for a four-minute song at 24-bit, 48 kHz, with 20 tracks, runs 700 MB to 1.2 GB. Add a reference mix and a short notes.txt and you're at 1.3 GB. That's the unit of a remote music session, roughly.

On a Lagos MTN 4G line at 3am, 1.3 GB uploads in 25 to 45 minutes. Start it before bed, check it when you wake up. On a Glo mobile line at 9pm, triple that and pray the network doesn't drop. For the ISP-specific numbers, we've written more on [sending large files in Nigeria](/send-large-files-nigeria).

[Upload the stems directly](/) and paste the link in an email with the notes. Don't split the stem pack into multiple uploads unless you have to. One link is easier for the receiver to track than five.

## Session notes, the underrated glue

The notes file is what keeps a remote session coherent. Not a long document. Ten lines of plain text.

```
Project: EKO_DRIFT
BPM: 96
Key: F minor
Session length: 3:42

What's done:
- Drums, bass, main melody, pads
- Rough mix at -14 LUFS

What I need from you:
- Topline on the chorus (0:52 to 1:28 and 2:34 to 3:10)
- Backing vocals on the hook, feel free to experiment
- If you have time: a vocal bridge before the second chorus

Deadline: Friday April 25

Reference mix in /reference/, stems in /stems/, MIDI in /midi/
```

That's 12 lines. A London-based vocalist opens that file and knows exactly what the ask is, what the constraints are, and what the deadline looks like. Compare to a five-minute voice note on WhatsApp where half of it is you clearing your throat.

## The iterative cadence

Remote sessions work on rounds. Round one: you send the beat and stems. Round two: they send back their vocal takes or their topline bounces. Round three: you integrate, mix roughly, send for approval. Round four: final revisions.

Four rounds means four uploads per side, which on Nigerian internet is eight to sixteen hours of upload time over the life of the project. Plan for it. A "fast" remote collab is two weeks from kickoff to deliverables. "Fast" in the Lagos sense.

I worked with a songwriter in East London in 2024 on a three-song EP. Ten rounds over seven weeks. Most of the back-and-forth was the audio quality of her reference takes (her room wasn't treated, and my feedback kept being about untreated-room ambience rather than the song). Eventually we agreed she'd send only her cleanest takes, and I'd stop pretending the dirty takes were a creative choice.

That taught me the biggest thing about remote sessions: the faster you surface the friction, the faster the work moves. Don't let bad audio slide because you don't want to have a hard conversation. Have the conversation.

## Video calls, for the thing text can't handle

Text is fine for 90 percent of a remote collab. The remaining 10 percent is the conversation that needs tone: disagreements about the chorus direction, arguments about tempo, moments when the vibe of the song is shifting and you both need to be in the same mental room.

Schedule a 30-minute video call per project, usually around round two. It's not strictly necessary. It's strictly useful.

## The commercial side

Figure out the money in the first email too. Producer splits, mechanical royalties, master ownership, publisher interest. Don't start the session assuming you'll "figure it out later." Later is when one of you gets signed and the other finds out they're not on the contract.

For serious cross-border work, [the business plan](/business) has room for the collaboration volume a full-time producer needs. [Our pricing page](/pricing) covers the smaller stuff.

## One more read

For the session-packing side of the same workflow, [sending beat packs to collaborators](/sending-beat-packs-to-collaborators) covers what goes in the stem pack itself. And [Mix Online's feature on remote collaboration](https://www.mixonline.com/recording/remote-collaboration) is worth reading for how top-tier mixers in LA and Nashville handle cross-continent sessions.

Agree on the format. Upload overnight. [Send the stems here](/) and go write the next song while the network does its job.
