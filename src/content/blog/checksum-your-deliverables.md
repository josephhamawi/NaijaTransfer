---
title: "Checksum your deliverables: the 30-second habit that prevents disaster"
description: "How to generate and share an MD5 or SHA-256 so a client can confirm the file they downloaded is the one you uploaded."
date: "2026-04-19"
cluster: "formats"
tags: ["file-integrity", "technical", "workflow"]
---

A checksum is a short fingerprint of a file. Feed any file into a hash function and you get back a string of characters that's unique to that exact file. Change one bit and the checksum changes completely. Share the checksum with your file, and the recipient can confirm they have exactly what you sent. It's a 30-second habit that prevents a specific and terrible class of disaster: delivering a file that's silently corrupted, noticing a week later, and having to redo the whole transfer.

## The two hashes that matter in 2026

MD5 is the old default. Fast, 128-bit output, still fine for integrity checking (not fine for security, but you're not using it for security). A 10 GB file takes about 30 seconds to MD5 on a modern SSD.

SHA-256 is the modern default. Slower than MD5 by maybe 2x, 256-bit output, still secure for any non-cryptographic use. A 10 GB file takes about a minute.

For file integrity, either works. MD5 is enough to detect every accidental corruption you'll ever encounter. SHA-256 is the "use this" answer for anyone who wants to look professional.

## How to generate a checksum

### macOS or Linux

```
shasum -a 256 delivery.zip
md5 delivery.zip
```

Output is the hash followed by the filename. Copy-paste into your delivery email.

For a folder of files:

```
shasum -a 256 *.zip > checksums.txt
```

One file, one line, the whole directory covered.

### Windows

PowerShell:

```
Get-FileHash -Algorithm SHA256 delivery.zip
Get-FileHash -Algorithm MD5 delivery.zip
```

Or in CMD:

```
certutil -hashfile delivery.zip SHA256
```

### Any platform with a file manager

Some file managers (Dolphin on Linux, Path Finder on Mac, some Explorer extensions on Windows) show file hashes in Properties. Slower than the command line but GUI-friendly.

## How the recipient verifies

The recipient runs the same command on their downloaded copy. They compare the output hash to yours. If they match exactly, the file is bit-identical. If they differ, something went wrong in transit.

You can even send a `checksums.txt` file with your delivery. Tools like `shasum -c checksums.txt` on macOS or `sha256sum -c checksums.txt` on Linux verify every file in the list against the recorded hash in one command. The output is a clean "OK" or "FAILED" per file.

## What a hash mismatch actually means

Download was incomplete. The most common cause. Browser stopped early, user assumed it finished, file is truncated. Hash doesn't match. Solution: re-download.

Transit corruption. Rare but real. A bit flipped between the server and the disk. Hash doesn't match. Solution: re-download.

Wrong file. Recipient grabbed an older version or a different file. Solution: clarify and resend link.

Your source file changed after you hashed. If you hashed before a final save, the hash is stale. Solution: re-hash, re-send.

## Why this matters for large files specifically

On a 100 MB file, most corruption shows up as visible damage. A JPEG that's half a JPEG. An audio file that clicks at the cut. You notice.

On a 50 GB video master, a corrupted 4 KB block might not trigger a visible error. Your video plays through, looks fine, but three seconds in chapter 14 has a subtle artifact you didn't notice until a broadcaster rejected the delivery.

Checksums catch this. Without them, you're trusting that every byte of a 50 GB transfer landed cleanly, which usually happens, but not always.

I lost an afternoon in 2023 to exactly this. Delivered a 30 GB project to a colorist. They opened it, started working, hit a bad frame two hours in, flagged it, I re-delivered. Two hours of their time, a delay in the schedule, and a minor dent in the relationship. Ten seconds of hashing would have caught it before they started.

## When to skip it

Small files, under 100 MB. The chance of silent corruption is vanishingly low and the file will fail visibly if something went wrong.

Internal-only transfers between machines you trust, on networks you trust. Overkill.

Anything non-critical. A reference mix going to a friend for notes doesn't need a SHA-256.

## When to always do it

Final deliverables to paying clients. Always.

Masters going to archive. Always.

Anything being backed up off-site. Hash before and after, verify on restore.

Anything that will be edited further. If there's a corruption, catching it early saves the downstream work.

Legal or compliance deliveries where integrity matters.

## The delivery email template

A five-line block in your delivery email:

```
Delivery: MasterProject_v04_20260418.zip
Size: 47.3 GB
SHA-256: a3f7e9b2c5d8f1a4b7e2c5d8f1a4b7e2c5d8f1a4b7e2c5d8f1a4b7e2c5d8f1a4

To verify: shasum -a 256 MasterProject_v04_20260418.zip
Compare the output to the hash above. They should match exactly.
```

Clients who work with media files understand this immediately. Clients who don't will read the instruction and paste-run the command, or ask you for help. Either way, you've shown them you care about delivery integrity.

## Tools that automate this

rclone, the swiss-army cloud sync tool, computes and verifies checksums automatically on supported backends.

rsync on Linux and macOS has `--checksum` mode that verifies every file after transfer.

Backblaze B2 and Wasabi both publish MD5 on every uploaded object and verify automatically on download.

[Cloudflare's learning center](https://www.cloudflare.com/learning/ssl/what-is-a-hash/) has a readable primer on hash functions if you want the broader context.

## Transfer services and automatic verification

Modern transfer services handle integrity checks internally. Chunked uploads with per-chunk verification, automatic retry on bad chunks, and verification at the end of the transfer.

[NaijaTransfer](/) does per-chunk verification on upload and uses resumable downloads that verify bytes on the way down. You can still generate your own SHA-256 for the end-to-end assurance that the file you downloaded equals the file you packed before upload, but the in-transit corruption risk is minimized by the service itself.

For the broader delivery workflow, [file naming conventions](/file-naming-conventions-that-save-hours) covers the naming layer and [splitting large projects](/splitting-large-projects-into-chunks) covers multi-part archives where per-part checksums are essential.

## The payoff

Ten seconds of hashing on your end, ten seconds of verification on the client's end, and an entire class of support conversation disappears. You never have "did it download OK?" debates. You have "yes it matches" or "re-download, here's the link." Clean. Fast. Professional.

[Our pricing](/pricing) covers the transfer side. The integrity habits are free. Build them. [Ship your file here](/) and include the hash in the email.
