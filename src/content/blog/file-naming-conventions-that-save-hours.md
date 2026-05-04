---
title: "File naming conventions that save hours on every handoff"
description: "A practical naming scheme for creative projects that keeps versions sane across producers, designers, and video editors."
date: "2026-04-19"
cluster: "formats"
tags: ["workflow", "file-management", "collaboration"]
---

A good filename is worth more than a good metadata panel because filenames show up in every view, on every system, in every email. A bad filename costs 45 seconds every time someone opens a folder and squints. Multiply that across a project with 200 files and 5 collaborators and you've burned a workday on squinting.

## The one rule that matters most

Your filename must answer three questions without anyone having to open the file. What is this? When was it made or updated? What version is it?

Everything else (producer initials, camera source, channel count, codec) is gravy. The three-question test is non-negotiable.

## A naming scheme that works

The format I've landed on after years of messing this up:

```
PROJECT_COMPONENT_YYYYMMDD_vXX.ext
```

Example: `AfolabiAlbum_Mix_20260418_v04.wav`

Project name (or abbreviation) first, so files sort together when mixed in a folder with other projects. Component describes what this file is within the project (Mix, Master, Stem, Proxy, Delivery, Source). Date in ISO format (YYYYMMDD) so it sorts chronologically in any file browser. Version with leading zeros so v10 doesn't sort before v2.

That's it. Everything else is optional depending on the job.

## Dates in ISO format, always

US format (MM-DD-YYYY) sorts wrong. European format (DD-MM-YYYY) sorts wrong. ISO format (YYYY-MM-DD or YYYYMMDD) is the only one that sorts correctly in every filesystem, every email client, every cloud storage browser.

`20260418` sorts after `20260417` and before `20260419`. Every time. In every tool.

Don't skip the leading zeros. `202648` is a bug. `20260408` is correct.

## Versions, which need more care than you think

v01, v02, v03, up to v99. Never use "FINAL," "FINAL2," "FINAL_USE_THIS," "FINAL_REAL," "FINAL_FORREAL_v2." This is an industry joke for a reason.

When a version goes to the client for approval, branch it. `v04_clientreview`. When revisions come back, bump to v05. When it's delivered, bump to v06 and tag as `v06_delivered`.

If you fork (two parallel ideas), don't use decimals (v4.1, v4.2 confuses sorting). Use letters: `v04a`, `v04b`. Better yet, branch into separate filenames: `ColdOpen_v04` and `WarmOpen_v04`.

## What to avoid

Spaces in filenames. They mostly work now, but some legacy tools, command-line workflows, and cloud sync services still trip on them. Underscores (`_`) are the safe substitute. Or CamelCase if you prefer no separator.

Special characters. Slashes, colons, asterisks, question marks, quotes, pipes. These are reserved in one OS or another. `Cover:Final.jpg` won't save on Windows. `Final?.psd` won't on macOS either. We wrote a whole piece on [special characters breaking uploads](/filename-special-characters-breaks-uploads).

Non-ASCII characters when crossing systems. A Yoruba tone mark is beautiful in a filename intended for your local machine. It breaks uploads, some command-line tools, and cloud sync services. Save the diacritics for the ID3 tag or the XMP field. Keep the filename ASCII.

Very long filenames. Windows has a 260-character path limit by default. If your project lives inside `/Users/ola/Dropbox/Clients/2026/Q2/RyanAfolabi/MasterDelivery/`, you have about 150 characters left for the filename. Keep it tight.

## What to include when handing off

For a mixing session going to a mastering engineer:

```
ProjectName_TrackTitle_24b48k_2mix_20260418_v02.wav
```

Bit depth and sample rate in the name (24b48k) lets the engineer spot issues without opening. `2mix` is industry shorthand for the stereo bounce going to master.

For a video delivery:

```
ProjectName_Cut_1080p_h264_20260418_v03.mp4
```

Resolution and codec in the name lets the client know what they have without inspecting.

For a photo shoot:

```
ProjectName_SessionLabel_YYYYMMDD_###.jpg
```

Three-digit sequential number keeps file ordering predictable across a large batch.

## The "source of truth" pattern

Pick one folder as canonical. Everything new lands there. Older versions move to an `archive/` subfolder. The newest version of anything is always in the top folder, no exceptions.

When you send files, send from the canonical folder. When you receive files, file them into the canonical folder under the date received.

This sounds obvious. Nobody does it consistently. It's the single biggest time saver in any collaborative project.

## The handoff text file

Every delivery folder should contain a `README.txt` or `notes.txt`. Five lines max:

```
ProjectName - Delivery for [Client]
Date: 2026-04-18
Version: v04
Contents: Final mix at 24b48k WAV, master at 16b44k WAV, MP3 reference at 320 kbps
Notes: Mastered to -14 LUFS for streaming. Reference mix included for comparison.
```

It's the difference between "what am I looking at" and "oh, I see."

## Cross-collaborator considerations

When multiple people contribute files, include initials.

```
ProjectName_Component_Initials_YYYYMMDD_vXX.ext
```

Example: `Album_BassTracks_OO_20260418_v02.wav` tells anyone that the bass tracks are from someone with initials OO, dated April 18, version 2.

This becomes essential when files flow back and forth between a producer, an engineer, and a session musician. Without initials, files with the same component name from different sources collide.

## Why this saves real time

A well-named file drops into a project folder and you immediately know what it is, when it was made, and whether you've seen it before. A badly-named file costs you 20 seconds of opening, inspecting, comparing, figuring out. Times ten files per folder, times ten folders per project, times ten projects per year. That's 55 hours a year on squinting.

[Project handoff research](https://arstechnica.com/information-technology/2023/05/the-anatomy-of-file-naming/) has covered this from the enterprise side for decades. Professionals who treat filename as documentation move faster than those who don't.

## Upload stage

Once your files are clean-named, pack them into a zip named the same way. `AfolabiAlbum_Masters_20260418_v04.zip`. [Upload it here](/) and the shareable link inherits the clean name.

## Related

For the integrity side, [checksum your deliverables](/checksum-your-deliverables). For business-scale delivery where volume makes naming discipline non-optional, see [the business tier](/business).

## Last thought

A clean filename scheme is something you set up once and benefit from forever. I spent an afternoon in 2021 documenting my naming rules and pinning them above my desk. Best four hours I ever invested in my workflow.
