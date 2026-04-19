---
title: "Transferring Adobe design files without breaking the links"
description: "Package, Collect Files, and the forgotten linked-asset path that makes a .indd or .ai open broken on the client's machine."
date: "2026-04-19"
tags: ["design", "adobe", "workflow"]
cluster: "creators"
---

Adobe files have a quiet habit of lying to you about being complete. InDesign opens your .indd fine, because the linked images are sitting on your drive exactly where the file expects. The client opens the same .indd on their machine and gets a wall of red error triangles where the photos should be. This is fixable. It's just one menu option most designers never use.

## The linked-asset problem

InDesign, Illustrator, and Photoshop all handle external assets differently, and the differences matter.

InDesign does not embed images by default. Every photo you place in a layout is a link back to the original file on your drive. The .indd knows where the file is, what it looks like, and where in the layout it sits. But if the file moves, or if the .indd travels to a different machine, the link breaks.

Illustrator can embed or link. Default is link, which means the same trap as InDesign. Photoshop embeds everything in a .psd by default, which is why .psd files are usually huge and why they rarely break in transit.

Most broken client handoffs I've seen involve an InDesign file missing four or five linked images because the designer zipped the .indd without the asset folder.

## InDesign: use Package, always

File, Package. Walk through the dialog. InDesign creates a new folder containing the .indd, a `Links` subfolder with every placed image, a `Fonts` subfolder with every font used (watch the licensing on this), and a PDF proof plus a report text file.

The resulting folder is self-contained. Zip it, send it, and the client opens the .indd on their machine with every link intact because everything is in the same relative folder structure.

Package takes 30 seconds. Most designers skip it and send the raw .indd. Half of those handoffs come back with "some of the images are missing" a week later.

Font licensing matters here. If you've licensed Adobe Fonts (the service formerly called Typekit), those fonts don't travel through Package cleanly, because the license is tied to the Creative Cloud account. The client needs their own Adobe Fonts subscription or the fonts fall back on their end. For genuinely portable type, stick to fonts you've purchased outright or open-source fonts like Google Fonts.

## Illustrator: embed before you send, or use Package

Illustrator has a Package option too, under File, Package. Same idea as InDesign. It pulls linked assets into a subfolder and writes a report.

If you'd rather not Package, you can embed every linked asset into the .ai itself. Window, Links, select all, and the flyout menu has an Embed option. The file gets bigger but it's self-contained. I use embed for one-off logos heading to a print shop and Package for anything with more than a handful of linked assets.

## Photoshop: usually fine, except for Smart Objects

Photoshop files embed rasters by default, so a flattened or lightly-layered .psd travels fine. The exception is Smart Objects linked to external files. Right-click any Smart Object in the Layers panel and if it says "Convert to Embedded," it's currently linked to an external file that won't travel.

For handoff-ready .psd files, embed every Smart Object. The file gets bigger (a typical layered .psd with a few Smart Objects might grow from 200 MB to 800 MB) but it's portable.

## The font trap, which catches everyone once

Fonts are the single biggest handoff failure in Adobe work. Every designer I know has sent a file that "looked perfect" on their screen, only for the client to open it on a Mac without the same foundry library and see default Helvetica where a $400 display face used to be.

Package in InDesign and Illustrator collects the font files. This is legally grey in some cases. Most foundry licenses let you include fonts for production handoff if the printer or client is working on the same job. Some don't. Check the EULA before you ship fonts with a file.

For true safety, outline the fonts on any final-artwork file heading to print or to a non-designer. Type, Create Outlines in Illustrator, or Convert to Shape in Photoshop. The file becomes uneditable type, but it renders identically on any machine. Keep a non-outlined version for future edits.

I lost a whole afternoon in 2023 on a brochure that looked fine on my Mac and came back from the print shop with every headline set in a default system font. The foundry font wasn't in the handoff. Outlining is now default for anything heading to print.

## Color profiles, because print files break differently

If your file is heading to print, embed the color profile. File, Document Setup, and check the color space. Most print files are CMYK at a specific profile (GRACoL, SWOP, Fogra depending on the region and press). If the client's machine doesn't have that profile installed, colors shift.

Export a PDF proof alongside the packaged file. PDF/X-1a is the print standard. The client can open the PDF and see the colors as they should print, even if the native .indd renders differently on their monitor.

## The upload

A packaged InDesign folder with a dozen high-res photos typically runs 500 MB to 2 GB. [Transfer it directly](/) in one go. Our [business tier](/business) handles the larger, more frequent handoffs that a production studio runs through monthly.

## One more thing

Include a short readme. "Main file is `brochure_final.indd`. Fonts in `Document fonts` folder. Print-ready PDF at `brochure_final.pdf`. Call me if links are missing." Saves a phone call every time.

For a related workflow on the sibling design tool, [sharing Figma designs with clients who don't use Figma](/sharing-figma-with-non-figma-clients) covers the export side. [Adobe's official InDesign packaging guide](https://helpx.adobe.com/indesign/using/packaging-files.html) is the canonical reference if you want to dig deeper.

Package once. Send once. [Upload it here](/) and keep the client meeting short.
