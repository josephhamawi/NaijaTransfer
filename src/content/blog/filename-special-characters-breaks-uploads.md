---
title: "Why filenames with special characters break uploads"
description: "Why a space, a slash, or a Yoruba tone mark in your filename can kill an upload, and the safe-ASCII rule that solves it."
date: "2026-04-19"
cluster: "formats"
tags: ["file-naming", "bugs", "technical"]
---

Filenames look like text to us. To a computer, they're bytes, and different systems interpret those bytes differently. A filename that reads fine on your Mac can become gibberish on a Windows server, or fail an upload entirely because one character got URL-encoded in a way the server didn't expect. This happens to everyone once. Knowing the rule that prevents it saves you the second time.

## The quick rule

Stick to ASCII letters (A to Z, a to z), digits (0 to 9), underscores (`_`), hyphens (`-`), and periods (`.`). Nothing else. No spaces, no accented characters, no tone marks, no emojis, no slashes, no colons.

That's the whole rule. Everything that follows is why.

## What actually breaks

### Spaces

Spaces have to be URL-encoded as `%20` when a filename travels through an HTTP request. Most modern servers handle this correctly. Some don't. Some proxies along the way mangle the encoding. Some command-line tools on the receiving end choke on encoded filenames.

I've watched a client's corporate firewall strip `%20` from download URLs, which turned `My Photo Shoot.zip` into `MyPhotoShoot.zip` on their end, which didn't match the file on the server, which 404'd, which meant they couldn't download. That was a fun support ticket to untangle.

Underscore instead. `My_Photo_Shoot.zip`. Works everywhere.

### Slashes

Forward slash (`/`) is the directory separator on macOS and Linux. Backslash (`\`) is the separator on Windows. Using either inside a filename breaks path handling in predictable and unpredictable ways.

`Client 1/2 delivery.zip` is not a filename. It's an attempt to create a directory called `Client 1` with a file called `2 delivery.zip` inside it. Your OS might catch this and warn you. It might not.

### Colons and other reserved characters

Colons are reserved on Windows (they're used in drive letters: `C:`). macOS used to use them as path separators (pre-OS X), which is why modern macOS silently converts colons to hyphens in the Finder. A file named `12:30 Session.wav` becomes `12-30 Session.wav` without warning.

Question marks, asterisks, less-than, greater-than, pipes, double quotes: all reserved on Windows. None of these can appear in a Windows filename. If you create one on Mac or Linux and send it to a Windows user, it won't save on their disk.

Tilde (`~`) and hash (`#`) are technically legal but get interpreted by various shells and URL parsers in special ways. Avoid them.

### Non-ASCII letters

This is where it gets culturally painful. A filename like `Olá_Afolabí.wav` or `Báàbá Mix.mp3` is entirely reasonable if you're Nigerian or Brazilian. It's also a ticking bomb for cross-system workflow.

Different operating systems encode non-ASCII filenames differently. macOS uses Unicode normalization form D (NFD) by default, which stores `ó` as two codepoints (the letter `o` plus a combining accent). Windows and most Linux systems use form C (NFC), which stores `ó` as a single codepoint.

A file named `Olá.wav` on a Mac sent to a Windows machine might end up visible as `Olá.wav` but with two different underlying byte representations. Comparing filenames programmatically then fails. Sorting fails. Search fails.

Uploads through forms, APIs, or command-line tools sometimes normalize, sometimes don't, sometimes half-normalize. The failures are intermittent and maddening to debug.

Keep the filename ASCII. Put the Yoruba tone marks in the metadata (EXIF Artist field, ID3 tag, XMP description). They're preserved cleanly inside the file bytes. They just shouldn't be in the filename itself.

### Emojis and symbols

Emojis in filenames are surprisingly common now because iOS and Android let you type them in the naming sheet. They render fine on the phone. They explode on uploads.

Same story as accented characters, but worse because emojis live in higher Unicode planes that many older tools don't handle at all. A file with a 🎵 in the name can upload, then its URL becomes unmanageable, then it fails to download cleanly.

## The one exception: localized display

If you absolutely need non-ASCII in a user-facing label, do it at the metadata layer, not the filename layer. The filename is plumbing. The metadata is the label.

`AfolabiAlbum_20260418_v01.wav` as the filename. Inside the WAV, the BWF Description field reads "Àlbùm Afolabi, session 2". That's the right split.

[The W3C has published best practices](https://www.w3.org/International/articles/file-names/) on international filenames. The short version matches what I've written here: ASCII for machine, Unicode for humans, keep them separate.

## URL encoding, the hidden layer

When you upload a file to a transfer service, the filename becomes part of a URL in the shareable link. URLs can only contain a limited character set natively. Everything else gets percent-encoded (`%20` for space, `%C3%B3` for `ó`).

Most services handle this. Most. A filename that works on upload can still produce a download link that breaks in an email client, because email clients re-parse URLs and some of them don't round-trip percent-encoded UTF-8 bytes cleanly.

Safe-ASCII filenames produce safe URLs. No percent-encoding needed. Nothing to break.

## What to do when you receive a file with bad characters

Rename on receipt. Don't pass it along as-is. `Báàbá Mix.mp3` becomes `Baaba_Mix.mp3` in your project folder. Note the original name in your README if it matters culturally.

If the file is from a camera or recorder that named it automatically, check the camera settings. Some Canon bodies insert the date as `2026年4月18日` on Japanese locale firmware. Flip the locale to English before a shoot you'll deliver internationally.

## Upload workflow

Rename files locally before uploading. Use a batch rename tool if you have many files. Finder on macOS has a built-in batch rename. Windows has PowerToys PowerRename. Linux has `rename`.

Once filenames are clean, archive into a ZIP that's also clean-named, and [upload it here](/). The shareable link inherits the ASCII filename and works everywhere.

## Related

For the broader naming approach, see [file naming conventions that save hours](/file-naming-conventions-that-save-hours). For what happens to metadata across transfers, [preserving metadata](/preserving-metadata-in-transfers).

## The summary

ASCII in the filename. Unicode in the metadata. Your collaborators in Toronto and your cousin in Benin both see clean handoffs. [Our pricing](/pricing) covers the volume once you've got the plumbing right.
