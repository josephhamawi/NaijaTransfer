---
title: "Color profile preservation when you transfer design files"
description: "sRGB, Adobe RGB, ProPhoto RGB: which survives a transfer intact, and what happens when a client opens the wrong one."
date: "2026-04-19"
cluster: "formats"
tags: ["design", "color", "technical"]
---

Color profiles are the unglamorous hero of every color-critical handoff. They tell the software that's opening your file how to map the RGB values inside to actual visible colors. Strip the profile and your carefully graded sunset turns into somebody else's guess at what you meant. This happens more often than most creatives realize, because modern tools hide the profile layer unless you know where to look.

## The three profiles you'll encounter

sRGB is the internet default, standardized in 1996. Roughly 72 percent of the colors a human eye can see fit inside its gamut. Every browser, every phone, every consumer display assumes sRGB unless told otherwise. If you're delivering anything for web, Instagram, or standard video, sRGB is what the final file should be tagged as.

Adobe RGB is wider, covering about 50 percent more of printable colors, especially in the greens and cyans. It's the standard for print work. Most DSLRs offer it as an in-camera option. Most pro monitors (NEC PA series, EIZO ColorEdge) can display its full gamut. Most consumer monitors can't.

ProPhoto RGB is the widest, covering more of the visible spectrum than most output devices can produce. It's a working space for RAW processing in Lightroom and Capture One. You wouldn't deliver a final ProPhoto JPEG to a client because most software would show it wrong. You'd convert to sRGB or Adobe RGB at export.

DCI-P3 is the video and cinema standard, with Display P3 (Apple's variant) now baked into every Mac, iPhone, and iPad. Roughly midway between sRGB and Adobe RGB in gamut coverage, but with different primaries.

## What happens when the profile strips

An image with no embedded profile, opened in a color-managed application like Photoshop, gets assumed to be sRGB. If the file was actually ProPhoto RGB, the colors shift dramatically. Reds go pink. Greens go muddy. Skin tones shift warmer.

An image with no embedded profile, opened in a non-color-managed application (old browsers, some older phone apps), gets shown with whatever the display's native gamut happens to be. On a wide-gamut monitor, an sRGB image without a tag looks oversaturated. On a standard monitor, it looks fine but different from other images that were tagged correctly.

The assumption baked into untagged files is sRGB, because that's what most of the world uses. But "most" isn't "all." A print client opening an untagged Adobe RGB file assumes sRGB, gets washed-out colors, calls you, you spend an hour figuring out that the profile got stripped in transit.

## Where profiles get stripped

Social uploads strip aggressively. Instagram converts everything to sRGB and strips embedded profiles. Facebook does the same. This is mostly fine because those platforms are displayed on sRGB devices, but if you shot in Adobe RGB and didn't convert first, colors shift before upload.

Some mobile apps strip profiles on export. WhatsApp re-encodes and typically preserves sRGB but may strip non-sRGB profiles.

Some screenshot tools on older OSes save without profiles.

Some web forms re-encode uploads and strip everything.

Transfer services like [NaijaTransfer](/) and Dropbox don't touch your file bytes, so embedded profiles survive. Cloud storage providers like Google Drive and OneDrive also preserve. The issue is almost always in re-encoding pipelines, not in transfer pipelines.

## Which formats carry profiles cleanly

JPEG carries an ICC profile in a dedicated marker segment. Every major tool preserves this when saving JPEG, if the option is enabled.

PNG carries a profile via the iCCP chunk. Preserved by design in most tools.

TIFF carries the full profile in a dedicated IFD. It's the safest format for color-critical work.

PSD (Photoshop) carries profile info in the file header. Survives all Adobe roundtrips.

RAW files don't carry a delivery profile but do carry the camera's profile. When you export from Lightroom, you select the output profile explicitly.

SVG can carry a profile but rarely does in practice.

HEIC (Apple's format) carries profile info. Survives iCloud transfers.

[BBC R&D published research](https://www.bbc.co.uk/rd/publications/whitepaper326) on color management in production workflows that's readable even if you're not at the BBC.

## Print-specific, which trips a lot of creatives

Print houses want CMYK, not RGB. The conversion from Adobe RGB to CMYK is done by a color management engine using a profile for the target printer and paper. Send your designer or print house the Adobe RGB (or sRGB, or whatever wide-gamut space you worked in), not pre-converted CMYK, unless they specifically ask.

Why? Because CMYK conversion is destination-specific. The ISO Coated v2 profile for European offset print is different from GRACoL for North American. If you convert to the wrong CMYK profile, the print house has to convert again, which compounds gamut compression.

Give them the widest-gamut RGB source you have and let their pre-press handle the CMYK conversion for their specific equipment.

## How to verify a profile survived

Open the file in Photoshop, Lightroom, or Affinity Photo. Look at the status bar or document info. The embedded profile name should appear (sRGB IEC61966-2.1, Adobe RGB (1998), etc.).

On macOS, right-click the file, "Get Info," then scroll to "More Info" for the profile name on many image formats.

ExifTool: `exiftool -ICC_Profile:ProfileDescription file.jpg`.

Spot-check one file per delivery. Takes ten seconds.

## My workflow for color-safe delivery

For web and screen delivery, convert to sRGB at export. Embed the profile. Deliver as JPEG or PNG. The client on Instagram, the designer in Figma, the dev on a MacBook, all see the same colors.

For print delivery, export at Adobe RGB or leave in ProPhoto RGB if the designer will do their own conversion. Always embed. Deliver as TIFF or PSD.

For video, tag the file with the intended color space (Rec. 709 for HD, Rec. 2020 for HDR, DCI-P3 or Display P3 for cinema and Apple delivery). The video codec handles the tagging. [Video codecs for delivery](/video-codecs-for-delivery) has the codec breakdown.

For anything going to a client whose toolchain I don't know, deliver sRGB and tell them in the README. It's the lowest-risk common denominator.

[Transferring Adobe design files](/transferring-adobe-design-files) covers the broader Adobe-specific handoff workflow.

## The quiet horror story

A wedding photographer in Lagos delivered a shoot to a print house in Abuja using WhatsApp because the files were "small enough." WhatsApp stripped the Adobe RGB profiles, the print house received sRGB-tagged files that were actually Adobe RGB internally, the resulting prints were shifted warm, and the couple was unhappy. One profile tag would have prevented the whole thing.

## Clean handoff

Embed the profile, export to a format that preserves it, [upload it here](/), share the link. Your colors arrive the way you made them.
