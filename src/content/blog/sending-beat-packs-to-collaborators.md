---
title: "How Nigerian producers share beat packs without losing their minds"
description: "A walkthrough of packing stems, presets, and reference mixes for a co-producer in Accra or London, plus the mistakes that cost you the session."
date: "2026-04-19"
cluster: "creators"
tags: ["music-production", "workflow", "collaboration"]
---

A beat pack looks simple until you're on WhatsApp at 11pm trying to explain to a co-producer in London why the kick sample is missing. Then it's a real thing. I've shipped enough of these that I now pack every session the same way, regardless of whether the person on the other end is down the road in Yaba or five time zones out.

## What goes in a beat pack

A full beat pack, the kind another producer can actually finish, is five things. Stems at 24-bit WAV, bounced from the start of the arrangement so everything lines up. A full-mix reference bounce, also WAV, so they hear what you heard when you stopped. A MIDI export of the drum and melody parts, in case they want to reprogram. A short text note, 10 lines max, saying the BPM, the key, what you think is working, and what you're stuck on. And a folder of any custom one-shots or chops that aren't from a standard sample library.

That's the kit. Anything more is dressing. Anything less is a session that doesn't open properly on the other side.

## Stems, and the BPM trap

Bounce stems from bar one. Not from wherever the part comes in. If the bass enters on bar 9, the bass stem still starts at bar 1, with silence up front. This is the single most common mistake, and it costs you 20 minutes on the other end while your collaborator pulls stems around trying to figure out the downbeat.

Name the files plainly. `01_KICK.wav`, `02_SNARE.wav`, `03_HATS.wav`, and so on. Don't get clever. Your co-producer doesn't need `Kick_PunchyV3_FINAL_USETHIS.wav`. They need to know what it is and what order to drop it in.

Keep the sample rate at whatever the session is. 44.1 kHz for most hip-hop and afrobeats work, 48 kHz if any of this is heading for video. Don't upsample. It doesn't help anyone.

## The reference mix matters more than you think

A rough mix bounce, the one you've been listening to on your phone for the last week, is the map. Without it, whoever opens the stems is guessing at what you wanted. Send it. Even if it's messy. Even if the vocals clip. Send it labeled `REFERENCE_DO_NOT_MIX.wav` so nobody thinks it's a deliverable.

For reference bounces, MP3 at 320 kbps is fine. You don't need a WAV of the rough mix. That's 40 MB you don't need to upload on a Glo line at 9pm. Save the WAV for the stems.

## Folder structure, and why yours is probably wrong

Here's the folder layout I land on after losing a session in 2024:

```
BEATNAME_BPM_KEY/
  stems/
  midi/
  one_shots/
  reference/
  notes.txt
```

That's it. Flat, boring, predictable. Your co-producer opens the zip and doesn't have to think. Nested folders with `final_v2/final_v3/actually_final` are how sessions get lost.

For the transfer itself, zip the whole parent folder and [send the file](/) in one shot. A 2 GB beat pack with stems, MIDI, and a reference mix is normal. We've written more about [sending large files in Nigeria](/send-large-files-nigeria) if you want the ISP-specific timing.

## Plugin-dependency, the thing nobody warns you about

If your co-producer doesn't own the same Serum bank you do, the MIDI is useless. This catches everyone once. The fix is to bounce every softsynth part to audio before you pack. Keep the MIDI too, so if they do own Serum they can tweak it, but never trust that they do. Serum is not free. Neither is Omnisphere, Kontakt, or half the sample libraries sitting on your drive.

For drums, if you're using a custom kit, dump the one-shots into the `one_shots/` folder. A WAV of your kick is 200 KB. It costs nothing to include, and it keeps the beat alive on a machine that doesn't have your exact Splice folder mirrored.

## Notes, and why you should write them

The `notes.txt` file is where the session lives outside the audio. An example:

> BPM 96. Key F minor. Verse 1 done, hook has placeholder melody I'm not married to. Bassline is too loud, I know. Try something softer on the 808. Deadline is Friday the 24th.

That's four lines. It saves a 40-minute voice note. Your collaborator will thank you. If you're running paid sessions regularly, a clean handoff is part of why people come back, which is why our [pricing page](/pricing) charges for scale and not for polish.

## Closing the loop

After they send it back, listen on the same speakers you referenced on. Check the stems are labeled the same way coming back. If they're not, that's a conversation. There's a related piece on [working with a producer in London when your studio is in Surulere](/remote-music-collaboration-nigeria-world) that gets into the cross-time-zone rhythm. And if you want deep reading on stem conventions, [Sound on Sound](https://www.soundonsound.com/techniques/stem-mastering) has a primer that's aged well.

Pack clean, upload once, move on to the next beat. Ready to ship yours? [Upload it here](/) and stop wrestling with WhatsApp 16 MB limits.
