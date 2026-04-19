---
title: "FL Studio project transfer guide: what to include, what to leave out"
description: "A practical breakdown of the folders, samples, and plugins an FL Studio session needs to open cleanly on someone else's machine."
date: "2026-04-19"
tags: ["fl-studio", "music-production", "workflow"]
cluster: "creators"
---

FL Studio projects break in transit more than any other DAW format I've worked with. Not because Image-Line did anything wrong. Because the .flp file is a pointer, not a container, and most Nigerian producers don't know that until they've sent a project that opens with 14 "sample not found" boxes on the other end.

## The .flp is not the session

An FL Studio project file is small. Usually under 2 MB. That's because it's a list of instructions, not the audio. When FL Studio opens it, it reads the list and goes hunting on your drive for the samples, the VSTs, and the automation files. If any of those aren't where the file expects them, you get a broken session.

Sending someone the .flp on its own is almost always a mistake. Unless they already have your exact Packs folder layout, your plugin licenses, and your sample library mirrored, the session won't open clean.

## Use File, Export, Zip looped package

This is the one setting that fixes 90 percent of FL Studio transfer problems. Go to File, then Export, then "Zip looped package." FL Studio will scan the project, pull every referenced sample, bounce every softsynth that can be bounced, and pack it all into a zip with the .flp in the root.

The resulting zip is usually between 200 MB and 1.5 GB for a normal beat session. A session with heavy Kontakt libraries can push 3 GB. Still. One file. Openable.

On the other machine, the person unzips, opens the .flp inside, and every sample resolves because it's in the same relative folder. That's the magic.

## What Zip looped package won't fix

Third-party VSTs. If your session uses Serum, Omnisphere, Nexus, or any commercial plugin, the zip doesn't include the plugin binary, because you can't legally redistribute it. If your collaborator doesn't own that plugin, those channels open as "missing" and go silent.

The fix is to render those channels to audio before you export. Right-click the channel, render as audio clip, and the audio replaces the plugin instance. Do this for every paid VST the receiver doesn't own. Keep a copy of the original session with the plugins intact on your drive, so you don't lose the ability to tweak later.

I lost three hours to this in 2024 on a session that I thought was clean. Two Serum leads and an Omnisphere pad, all missing on the receiving end. Now I ask first: do you own Serum? If no, render before export.

## The sample-library question

Stock FL Studio samples travel fine. The installer puts them in the same place on every machine, and FL Studio resolves those paths automatically. You don't need to include `FL Studio/Data/Packs/Drums/Kicks/FPC_Kick.wav`. The receiver has it.

Third-party samples from Splice, Loopcloud, or custom packs need to be in the zip. Zip looped package should catch these, but double-check. Open the Browser in FL Studio, look at any sample referenced in the session, and if it's not in `Packs` or a subfolder, assume the export might miss it and drop it into the project folder manually before exporting.

## Naming, versions, and the stuff producers skip

Name the project by what it is. `EKO_BEAT_v3.flp` beats `Untitled_final_FINAL.flp`. Include the FL Studio version in the notes. A project made in FL 21 opens in FL 20 most of the time, but plugins saved in newer formats sometimes don't back-port cleanly.

If you're on the 24.x branch and your collaborator is still on 20.9, mention it. They might need to update, or you might need to bounce stems as a fallback. A short note saves the phone call.

## Shipping the zip

Once you've got the .flp and its samples in one zip, [transfer it directly](/) to your collaborator. A 1.5 GB FL Studio project zip uploads in roughly 20 to 40 minutes on a decent MTN 4G line in Lagos, assuming you're uploading between 1am and 5am when the network isn't saturated. For the cost side of longer sessions, our [paid plans](/pricing) let you send larger projects without splitting them.

For comparison with other services, there's a writeup on [NaijaTransfer vs WeTransfer](/wetransfer-alternative-nigeria) that covers the limits.

## The receiver's side

When your collaborator opens the zip, they should unzip it completely before opening the .flp. FL Studio doesn't read from inside a zip reliably. A half-extracted project will look broken even if everything is technically present.

If they still see missing samples, the "Find samples" dialog in FL Studio can usually resolve them if the files are in the same folder. Point it at the unzipped folder and FL Studio scans and relinks.

For further reading on keeping project files portable in general, [Ableton Live project packing, the version that actually opens](/ableton-live-project-packing-best-practice) covers the same problem from the Live angle, and [Image-Line's manual](https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/projectsettings.htm) has the canonical reference on project settings.

Pack it, zip it, send it once. [Upload the zip here](/) and move on.
