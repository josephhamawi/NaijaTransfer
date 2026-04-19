---
title: "Splitting a 50 GB project into parts your client can actually download"
description: "When to split, how to split, and which formats keep integrity across multiple archive parts if one of the downloads fails."
date: "2026-04-19"
cluster: "formats"
tags: ["file-size", "archives", "workflow"]
---

Splitting a huge archive into parts used to be the only way to ship anything big. It's less common now because resumable uploads and downloads handle most cases. But there are still situations where splitting is the right call, and when it is, the details matter.

## When splitting is still worth it

Your client is on a flaky connection and a single multi-GB download keeps failing at 80 percent. A resumable download solves this better, but not every transfer service or platform supports resume properly. If yours doesn't, splitting gets you smaller, individually retryable downloads.

Your storage or transfer service has per-file size caps. Some older FTPs choke on files over 2 GB. Some cloud providers impose per-file limits on free tiers (Dropbox free is 50 GB per file, Google Drive is 5 TB, but shared links sometimes behave differently under load).

Your client wants to start working on the first half while the second half is still uploading. Splitting lets you deliver in tranches.

## When splitting is not worth it

When a transfer service supports proper resume on interrupted downloads. We support resume at [NaijaTransfer](/), so a 50 GB transfer that fails at 40 GB picks up where it left off. No splitting needed.

When the download is stable. If your client has fiber and you have fiber, a single 50 GB file will download fine in one shot. Splitting is extra work for no benefit.

When the project has internal dependencies that break across parts. Pro Tools sessions, Ableton projects, and Logic projects reference files by path. If you split at a bad boundary, the references break on extraction and the session won't open.

## How to split, by format

### ZIP multi-part

Use 7-Zip on Windows or Keka on Mac. Set "volumes" to a fixed size. You get `project.zip.001`, `project.zip.002`, and so on.

All parts must be present to extract. If part 3 of 10 is corrupted or missing, the archive fails. This is a hard requirement. No part is independently extractable.

### RAR multi-part

WinRAR is the only tool that creates RAR. Set the "split to volumes" field to a size. You get `project.part01.rar`, `project.part02.rar`, etc.

RAR supports "recovery records" that let you repair a corrupted part if you included them during creation. Turn this on for important archives. It adds about 3 percent to the archive size and saves you from having to re-upload a single bad part.

### 7z multi-part

Similar to ZIP multi-part. You get `project.7z.001`, `project.7z.002`. All parts required.

7z doesn't have recovery records like RAR. If a part is corrupted, you re-upload it.

### Tar plus split (for Linux-heavy workflows)

`tar -czf - project/ | split -b 4G - project.tar.gz.part_` gives you part files of 4 GB each. Reassemble with `cat project.tar.gz.part_* > project.tar.gz`.

This is old-school but bulletproof. No metadata layer, no recovery records, just bytes cut at fixed boundaries.

## What size to split to

4 GB used to be the canonical size because of FAT32 filesystem limits (FAT32 can't store a single file over 4 GB). That's rarely the constraint anymore.

Match your split size to what the target connection can download reliably in one session. On a Nigerian fiber line, 5 to 10 GB per part is fine. On mobile data, 1 to 2 GB per part is safer. If each part takes under 15 minutes to download, the psychological barrier disappears for the recipient.

For very large projects (100 GB plus), 10 GB parts give you 10 downloads. That's manageable. 1 GB parts give you 100 downloads. That's a nightmare for the recipient to manage.

## The checksum step, which almost everyone skips

After you create the multi-part archive, generate a checksum for each part. SHA-256 on Mac/Linux: `shasum -a 256 project.7z.*`. On Windows: `Get-FileHash -Algorithm SHA256 project.7z.*`.

Share the list of checksums with the recipient in the same email as the download link. They can verify each part downloaded cleanly before combining. If part 7 fails the checksum, they only need to re-download part 7, not the whole thing.

We wrote about this in detail in [checksum your deliverables](/checksum-your-deliverables). Ten lines of hashes prevents hours of guessing.

## What actually breaks in transit

Incomplete downloads are the classic failure. A file that's 3.9 GB when it should be 4.0 GB. File managers often don't flag this, the browser stops and the user assumes it finished.

Silent corruption is rare but real. A bit flips somewhere between the server and the disk. Checksums catch this.

Transfer service timeouts are the most common on very large single files. Every service has some timeout, whether they advertise it or not. Splitting sidesteps this entirely because each part is an independent download.

[Cloudflare's learning center](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) has a readable writeup on why large-file delivery is hard over HTTP, if you want the infrastructure context.

## What I actually do

For anything under 20 GB, single file via [NaijaTransfer](/). The service handles the download resume properly, so splitting is wasted effort.

For 20 to 100 GB, I sometimes split into 5 GB parts if the client's connection is unknown or weak. Always with checksums.

For 100 GB plus, I ask the client how they want to receive it. Sometimes they want a hard drive couriered. Sometimes they want the split zip. Sometimes they have a corporate cloud that handles the whole thing. Match the method to the recipient.

## Related reading

For Nigerian-specific upload timing, [best time of day to upload](/best-time-of-day-upload-nigeria) has the numbers. For the format trade-offs, [ZIP, RAR, 7z comparison](/zip-vs-rar-vs-7z-for-creatives) lays out the differences.

## The last step

Pack, split if needed, checksum, upload, and share the link plus the hash list. [Upload it here](/). The 30 seconds of checksum generation saves hours on the client side.
