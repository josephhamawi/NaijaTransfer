---
title: "Video editor handoffs: proxies, codecs, and project packing"
description: "A clear checklist for shipping a Premiere or DaVinci project across town or across continents without losing a day to reconnecting media."
date: "2026-04-19"
tags: ["video-editing", "premiere-pro", "davinci-resolve"]
cluster: "creators"
---

Video projects are the largest, messiest, most linkage-dependent thing most Nigerian creators ever have to ship. A single wedding video timeline can reference 200 GB of source footage spread across a dozen external drives. Sending that to a colorist in London isn't a button-click. It's a workflow, and the workflow is what separates editors who make deadlines from editors who don't.

## Source files vs project files

A Premiere project (.prproj) or DaVinci Resolve project (.drp) is small. Usually 50 to 500 MB. It contains the edit decisions, the effects, the transitions, the timeline structure. What it doesn't contain is the actual video.

The actual video lives in whatever you were shooting on: Sony XAVC-S, Canon CRM, Blackmagic BRAW, ARRI ProRes files, whatever your camera outputs. The project file points at those files by path. If the paths break, the project opens as an empty timeline with red "media offline" warnings.

Everything below is about solving the "media offline" problem at the point of handoff.

## Premiere: use Project Manager

Premiere Pro's Project Manager (File, Project Manager) is the tool for packaging a project to send. Two modes matter: Collect Files and Copy to New Location, and Consolidate and Transcode.

Collect Files copies every clip referenced in the timeline into a new folder alongside a fresh .prproj. Nothing is changed. The new project is self-contained and opens identically to the original. Use this when you want the receiver to have full editing control over the original footage.

Consolidate and Transcode is the same, but also converts the footage to a single codec of your choice. Useful when you want to send a colorist ProRes 4444, or a mix engineer low-res proxies, rather than the native camera files.

I consolidate to ProRes 422 for most color handoffs. Each clip is about 250 to 400 MB per minute at 1080p, 800 MB to 1.5 GB per minute at 4K. A five-minute piece with 20 minutes of source footage consolidates to roughly 80 GB at 4K ProRes. Yes, that's a lot. That's the reality of color work.

## DaVinci Resolve: the DRB archive

DaVinci Resolve has a cleaner export: right-click the project in the project manager, Export Project Archive (.dra). Resolve bundles the project file, all media, and all caches into a single archive folder.

The archive is identical to the original on the receiving end. The receiver opens Resolve, File, Restore Project Archive, and points at the .dra folder. Everything reconnects automatically.

For color-round-trip work, this is the standard. Send a .dra, the colorist works, they send back a .dra, you restore it and see their grades.

## Proxies, for editors on slow connections

Proxies are where Nigerian uplinks start making sense of video handoffs. Instead of sending 80 GB of ProRes, you send 4 GB of H.264 proxies plus the project file. The receiver edits against the proxies. When they're ready to render final, they reconnect to the high-res media (which you've uploaded separately and slower).

Both Premiere and Resolve support proxy workflows natively. In Premiere, right-click any clip, Proxy, Create Proxies. Choose H.264 at 1024x540 for a lightweight proxy. A typical proxy is 10 to 15 percent of the original file size. Resolve does the same under the Media Pool right-click menu.

Proxy workflows are slightly more complex to set up but save you days of upload time on large projects. For a cross-continent color handoff, it's the only sane approach.

## The codec question

If you're sending final-quality footage, not proxies, use ProRes 422 HQ or DNxHR HQ. Both are edit-friendly codecs designed for post-production. Each is roughly 6 to 10 GB per hour at 1080p.

Don't send H.264 or H.265 as a deliverable to an editor. Those codecs are designed for distribution, not editing. They decode slowly, don't scrub well, and compound artifacts when re-encoded. They're fine for client previews, not for editorial.

If the receiver is specifically asking for H.264 (for a quick review, for a social-media cut, for a client presentation), send H.264 at a high bitrate (20 to 30 Mbps for 1080p, 40 to 60 Mbps for 4K). Anything lower and you've sent a compressed preview, not a deliverable.

For a related read on format choices, [sending demos to A and Rs: WAV or MP3?](/sending-demos-wav-vs-mp3) covers the same decision tree for audio, and the logic transfers.

## The folder structure

Whatever tool you use, the folder the receiver unzips should look like this:

```
PROJECT_NAME_v1/
  project_file.prproj (or .drp)
  footage/
    day1/
    day2/
    ...
  audio/
  graphics/
  proxies/ (optional)
  notes.txt
```

Predictable. Flat-ish. Named so the receiver doesn't have to think. A project file in the root means the receiver double-clicks it and Premiere/Resolve opens with everything linked through relative paths.

## The upload, which is the hard part

An 80 GB video project on a Lagos Airtel 4G line at 3am runs 6 to 12 hours depending on the night. On fibre, 3 to 5 hours. On mobile data during business hours, plan for the whole day and expect a drop.

Split the upload if it helps you psychologically, but note that modern transfer services handle 80 GB as a single upload fine, with resume support, and splitting adds coordination work for the receiver. [Send it directly](/) in one shot if your connection is stable enough.

I ran a 120 GB wedding-feature handoff in 2024 over a single MTN fibre line overnight. Started at 11pm, finished at 8am. Worked. It also wouldn't have worked a year earlier on the older line. ISPs do get better.

## The delivery note

Include a text file with codec info, frame rate, and any notes on transitions or effects that might render differently on the receiver's system. Example:

> Footage: Sony XAVC-S 4K, 25fps. Consolidated to ProRes 422 HQ for this handoff. LUT applied in timeline is Sony S-Log3 to Rec709. Color house to confirm their target profile.

Saves two emails. Every time.

## The volume case

If you're a post house handling multiple projects a month, [our business plan](/business) covers the scale without the free-tier caps. For comparisons, [Dropbox vs Google Drive vs NaijaTransfer](/wetransfer-alternative-nigeria) has some numbers. And [Blackmagic's DaVinci Resolve manual](https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_18_Reference_Manual.pdf) has the canonical reference on project archive workflows.

Consolidate, pack, upload overnight. [Start the upload here](/) and let the network do the work.
