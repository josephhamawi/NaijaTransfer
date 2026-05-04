---
title: "Pro Tools session transfers and the plugin-dependency problem"
description: "How to ship a Pro Tools session without breaking the plugin chain, and what to freeze before you upload."
date: "2026-04-19"
tags: ["pro-tools", "music-production", "workflow"]
cluster: "creators"
---

Pro Tools is still the lingua franca of professional studios, and for a reason. The session format is stable, well-documented, and predictable across machines. The thing that breaks Pro Tools transfers isn't the session file. It's the plugin chain. Specifically, the iLok-protected, paid, version-specific plugin chain that most Pro Tools users have spent a decade building.

## The .ptx is not your problem

A Pro Tools session file (.ptx, or .pt for older versions) is small. Under 5 MB even for big sessions. It's a metadata file: what tracks exist, what audio files they reference, what plugins sit on what channels, where the automation breakpoints are. Pro Tools reads it and assembles the session from the pieces.

The pieces, though, are the problem. A Pro Tools session references audio in the `Audio Files` folder next to the .ptx, and the `Fades` folder, and any `Video Files` if you're working to picture. All of that has to travel together, or the session is broken on arrival.

## Use Save Copy In, not zip the folder

File, Save Copy In is the Pro Tools equivalent of FL Studio's Zip looped package or Logic's Copy audio files setting. When you run it, Pro Tools gives you a dialog with checkboxes. Check "All audio files," "Session plugin settings folder," and "Movie/video files" if relevant. Leave "Don't copy fade files" unchecked.

What you get is a new session folder with every asset copied into it, nothing referenced externally. Zip that folder, and it's portable.

For sample rates, if your collaborator is on a different rate than your session, Save Copy In lets you convert on the way out. 48 kHz is the industry default for film and TV. 44.1 kHz for music release. Match whatever the final delivery is, or match the receiver's session if they've told you.

## The plugin-dependency problem

Pro Tools users run the biggest plugin chains in the game. Waves, FabFilter, Soundtoys, UAD, Slate, iZotope, Sonnox, Plugin Alliance, the whole stack. Every one of them is paid. Every one of them is iLok-protected in most cases. None of them travel with the session.

If your collaborator doesn't have the same plugins, the session opens with greyed-out inserts where the processing used to be. The audio plays dry. Automation still exists, but it's automating nothing. The session sounds wrong.

## Commit tracks before you send

Pro Tools 2018.1 added Track Commit, and it's the feature that solves this problem. Select a track, right-click, Commit. Pro Tools renders the plugin chain to audio and replaces the track with a clean audio version. The original track is hidden but preserved, so you can uncommit later if you need to tweak.

Commit every track with plugins the receiver doesn't have. For a mix session, that's probably most of them. For a tracking session heading to a mix engineer, the receiver usually wants the raw tracks anyway, so only commit where you've got time-based effects you want baked in.

Leave a note in the session memo or a readme.txt explaining what's committed and what isn't. The receiver needs to know whether they're getting your mix decisions or a blank canvas.

## Freezing, as a lighter alternative

If you want to keep the plugins in place for your own reference but make the session portable, Track Freeze is the lighter touch. It renders the track to audio but keeps the plugin chain visible on a disabled track. On the receiver's end, they see what you had, even if they can't process through it. Less clean than Commit, more informative.

I had a session in 2024 where I committed a whole mix before sending, and the mix engineer came back asking what reverb I'd used. I couldn't remember. If I'd frozen instead, the answer would have been visible in the inactive plugin slot. Lesson learned.

## The size reality

A committed Pro Tools session with all audio collected typically runs 2 to 8 GB. Film and post sessions go much bigger, 20 GB plus when there's a lot of dialogue and effects. For music, stay in the 2 to 5 GB range and you're normal.

On a Nigerian uplink, that's 40 to 90 minutes on a good 4G line at 2am. For the ISP-specific numbers, [sending large files in Nigeria](/send-large-files-nigeria) has the breakdown. [Upload the zip here](/) when you're ready, and don't try to split it into smaller chunks unless you have to.

## Sample libraries

If your session uses virtual instruments backed by huge sample libraries (Kontakt, Play, Omnisphere), don't expect Save Copy In to pull those in. It grabs session audio, not plugin sample libraries. Render those tracks to audio before committing, or the receiver gets silence.

This is the single biggest gotcha for Pro Tools post-production. Virtual orchestras are the most common case. A session with a dozen Kontakt strings tracks needs all of them printed to audio, because nobody on the other end has your exact library version and key-switch mappings.

## One last check

Open the session yourself after Save Copy In, on a machine that isn't the one you've been working on if you can. Or at least open it with your main plugin chain disabled. See what's missing. Fix it before you upload.

For a cross-DAW read on the same general problem, [Logic Pro: should you send the bounce or the full session?](/logic-pro-bounce-or-session) covers the decision tree. [Avid's official knowledge base](https://avid.secure.force.com/pkb/articles/en_US/troubleshooting/Pro-Tools-Save-Copy-In-Best-Practices) has the technical reference on Save Copy In if you want the canonical version.

Commit, save, zip, upload. [Send it directly](/) and keep the session moving.
