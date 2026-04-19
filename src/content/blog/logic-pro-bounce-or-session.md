---
title: "Logic Pro: should you send the bounce or the full session?"
description: "A decision guide on when stems are enough and when the project file has to travel with them, plus the filesize reality for each."
date: "2026-04-19"
tags: ["logic-pro", "music-production"]
cluster: "creators"
---

Half the time, a Logic Pro session doesn't need to travel. The stems are enough. The other half, stems aren't enough and only the .logicx project file solves the problem. Knowing which half you're in saves hours. Picking wrong costs you a deadline.

## When stems are enough

If the person on the other end is mixing, mastering, or replacing your vocals, they want stems. They don't want your Logic session. They don't want your channel strip settings. They want clean, labeled, time-aligned WAVs they can drop into their own session and work in their own template.

A full stem bounce from a Logic session usually runs 600 MB to 1.5 GB depending on track count and length. At 24-bit, 48 kHz, a four-minute song with 30 tracks lands around 800 MB. That's a reasonable single upload on a decent Nigerian line.

Stems win when the receiver is a mixer, a mastering engineer, a vocalist tracking to your beat, or an A and R you're sending to for a listen. Any of these people would rather have stems than a Logic project they'd have to open, navigate, and bounce themselves.

## When the full session has to travel

If the other person is a co-writer, co-producer, or arranger who needs to actually edit your work, stems don't cut it. They need the MIDI. They need the plugin chains. They need the arrangement editable at the note level. That means sending the Logic project.

A Logic project is a .logicx package. On macOS it looks like a single file. It's actually a folder in disguise, containing the project XML, the audio folder, any bounces, and any fades. Right-click on it in Finder, "Show Package Contents," and you can see what's inside.

## Package the project for portability

Before sending, run Logic's project cleanup. File, Project Settings, Assets, and make sure "Copy audio files" is checked. Also set "Copy movie files" on if you're working to picture. Then save the project again. This forces Logic to pull any externally-referenced audio into the project package, so the file is self-contained.

Without this step, your .logicx file references audio on your local drive that doesn't exist on the receiver's machine. Same problem as every DAW. The fix is built in. Most producers just don't use it.

A packaged Logic project sits between 500 MB and 3 GB depending on what's in it. A vocal-heavy session with lots of takes and comp lanes can climb higher. Bigger than an FL Studio or Ableton project of similar length, because Logic stores every take even after comping.

## The hybrid, which is what most sessions need

The smartest send, nine times out of ten, is both. A full stem bounce, so the receiver can start listening immediately, plus the packaged Logic project, so they can edit if they want to. Zip them together with a short notes.txt and send as one upload.

```
TRACK_NAME_ARTIST/
  stems/
    01_KICK.wav
    02_SNARE.wav
    ...
  logic_project/
    TRACK_NAME.logicx
  reference_mix.mp3
  notes.txt
```

This is the format that gets a session opened on the first try. The receiver listens to the reference mix, decides what they want to do, and then either works from stems or opens the project.

## Plugins, the usual suspect

If your Logic project uses third-party plugins the receiver doesn't have, those tracks open with "plugin missing" notices. Logic's stock plugins travel fine because the receiver has the same Logic install. But a Waves chain, a FabFilter Pro-Q, or a Soundtoys reverb won't carry over unless they own it.

Bounce any track with exotic plugins to audio before sending. Right-click the track, Bounce in Place, and keep a backup of the original session on your drive. Same pattern as FL Studio, Ableton, Pro Tools. None of this is Logic-specific, it's just how DAW files work.

## The format question for stems

For stems, send WAV. 24-bit is standard. Sample rate should match the session, 48 kHz if it's going to video, 44.1 kHz otherwise. Don't upsample. Don't dither stems unless you know the receiver wants them dithered. For the reference mix, 320 kbps MP3 is fine and saves you 40 MB of upload time. There's more on this format decision in [sending demos to A and Rs: WAV or MP3?](/sending-demos-wav-vs-mp3) if you're weighing the tradeoffs.

## The upload itself

A hybrid package (stems plus packaged project plus reference mix) typically runs 1.5 to 4 GB. [Upload it here](/) in one shot and skip the WhatsApp-split headache. For producers running more than a few of these per month, [our business plan](/business) handles the volume without hitting free-tier caps.

A 3 GB upload on a Lagos MTN 4G connection at 3am runs roughly 45 to 70 minutes, give or take the weather. Plan for it. Start the upload before dinner, check it after.

## One more thing

Don't send the project in progress. Save, close, reopen the project yourself, and make sure it loads clean on your own machine before you zip it. Sounds obvious. Isn't. [Apple's Logic Pro user guide](https://support.apple.com/guide/logicpro/welcome/mac) covers the asset-copy settings if you want to go deeper.

Stems, project, mix, done. [Send it directly](/) and get back to writing.
