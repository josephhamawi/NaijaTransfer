---
title: "Sharing Figma designs with clients who don't use Figma"
description: "How to export a Figma file so a client without an account can review it, mark it up, and not lose layer fidelity."
date: "2026-04-19"
tags: ["figma", "design", "client-handoff"]
cluster: "creators"
---

Figma is the easiest design tool to share with other designers and one of the harder ones to share with clients. You drop a link, they open it, and half the time they don't understand what they're looking at because they've never used the interface. The cursor lands in frames, the zoom does unexpected things, and the comment feature is buried until they sign up for an account. Here's how to get a review without forcing them to learn a new app.

## The link-and-hope approach, and why it fails

Figma does let you share a view-only link that works without an account. `figma.com/file/...` opens in the browser, pans and zooms, and anonymous visitors can leave comments. Sounds great.

In practice, clients who aren't designers get lost. They don't know how to zoom into the right frame. They see the entire canvas, every variant and experiment, and they ask why there are seventeen versions of the home page. The answer, of course, is that design is messy. That's a bad thing to explain mid-review.

If you're going to share a link, clean the file first. Hide or delete every exploration frame. Rename pages to "Review: Home" and "Review: Checkout" so the client sees only the finished work. Set the default view to a specific frame, not the full canvas. Share the link to that frame, not to the file root.

## Export to PDF, the most underrated option

For a client review, a multi-page PDF beats a Figma link nine times out of ten. File, Export Frames to PDF. Figma stitches your frames into a single PDF, one frame per page, in whatever order they sit on the canvas.

The client opens the PDF in Preview, Acrobat, or whatever PDF reader they have. They scroll. They zoom. They mark up with Acrobat's comment tools or Apple's built-in Markup. They send it back with notes attached to specific pixels. Every client knows how to do this. Nobody needs to be taught.

A typical multi-page design PDF runs 5 to 40 MB depending on how image-heavy the designs are. [Send it directly](/) and the client has it in their inbox.

## When PDF isn't enough

For interactive prototypes, static PDFs lose the flow. If the client needs to click through a signup experience or see how a modal opens, the Figma link is the only option. In that case, use Present mode's share link, not the file link.

Present mode (the Play button in Figma, top right) locks the view to the prototype. The client clicks hotspots. They don't see the canvas. They can't accidentally break the layout by dragging. It's the closest Figma gets to feeling like a real app for a non-designer.

Share the Present link, not the edit link. And set the link to "Anyone with the link can view" in the share dialog, so the client doesn't hit a Figma login wall.

## Exporting individual frames

For cases where the client only needs one or two screens reviewed, export as PNG at 2x. Select the frame, Export, PNG, 2x resolution. You get a high-DPI image the client can open anywhere.

PNG at 2x is large (a full-page website mockup can hit 4 to 8 MB per page), but that's the point. At 1x, the image looks blurry on a Retina screen and the client thinks your design is blurry. At 2x, it renders crisp.

For marketing handoffs where the client wants assets for their website, export at 1x as PNG (or SVG for logos and icons). Keep 2x for review, 1x for use.

## The dev-handoff question

If the receiver is a developer, Figma's Dev Mode is the right tool. They get CSS specs, measurements, and auto-generated code snippets. No export needed.

If the receiver is a non-designer client who's passing the file to their own developer, a PDF plus the original Figma link is enough. The developer opens the Figma link, inspects frames, pulls specs. The client uses the PDF to review visually.

I sent a client an unexported Figma link once in 2024 for a four-page site review. The client opened the canvas, saw 40 variants of every page I'd explored, and came back asking why the design was "still so unfinished." I'd burned a week of review time because I hadn't cleaned the file. Now I always duplicate the file, delete everything that isn't final, rename it `ClientName_Review.fig`, and share that instead of the working file.

## Assets, for production

When the client or their developer needs real assets, Figma's batch export is faster than most designers realize. Select every frame with an export setting, and Figma gives you a single click to bundle them all. The result is a zip with every asset at every resolution you configured.

For a 20-asset website export in 1x and 2x PNG plus SVG, expect a zip around 15 to 40 MB depending on image content. Small enough to email, but not all email services handle attachments that size reliably. [Upload the zip here](/) instead and skip the bounce-back emails.

## Typography and font-embedding

Figma handles fonts differently than Adobe. If you use a Google Font, exports render fine because Google Fonts are universally installed. If you use a paid foundry font, the PDF export renders that font as paths (not editable text), which is actually what you want for client review.

For development handoff, the developer needs access to the font files themselves. Figma doesn't ship fonts with exports. Send the font files separately, with the license, or link to the foundry page. Most foundry licenses cover one developer seat per project.

## The upload

A typical client review package (a cleaned PDF, a Present link, and maybe a short note) runs under 50 MB. For scale, [our pricing page](/pricing) covers options if you're doing dozens of client reviews a month.

For related design handoff reading, [transferring Adobe design files without breaking the links](/transferring-adobe-design-files) covers the other half of the design tooling landscape. And [the Figma help center article on PDF export](https://help.figma.com/hc/en-us/articles/360040028114-Export-to-PDF) has the official reference.

Clean the file. Export the PDF. [Send it](/) and book the review call.
