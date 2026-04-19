---
title: "Hotspot tethering for emergency creative handoffs"
description: "Phone-to-laptop tethering for uploading when home fiber is down, including the thermal and battery tradeoffs on modern phones."
date: "2026-04-19"
cluster: "speed"
tags: ["mobile", "troubleshooting", "workflow"]
---

Your home fiber is down. The delivery is due in 90 minutes. Your phone has 4 bars of 4G and an hour of battery left. This is when tethering earns its keep, and when doing it badly turns a tight deadline into a missed one. A few choices you make before you hit "upload" decide whether the transfer finishes or dies at 40 percent.

## USB versus Wi-Fi tethering

USB tethering is faster, more stable, and charges the phone while the laptop uses it as a modem. Wi-Fi tethering is convenient but caps you at the phone's hotspot Wi-Fi throughput, which on most Android phones maxes at 60 to 80 Mbps even if the cellular link is faster. For anything bigger than 500 MB, USB is the right call.

iPhones: connect the Lightning or USB-C cable, toggle Personal Hotspot on, macOS detects it as an interface. Android: USB tether setting under Network and Internet, then laptop picks it up. Linux usually needs nothing; Windows sometimes needs a one-time driver.

I use USB for anything above 1 GB. The stability difference is noticeable over 30+ minute uploads.

## Thermal throttling is real and aggressive

Modern phones do three things at once when tethering a big upload: run the cellular radio at max power, run Wi-Fi (if hotspotting), and handle the packet forwarding on the SoC. All three generate heat. Once the phone passes 40C internal, it starts throttling the cellular modem to protect the battery.

An iPhone 14 uploading through Personal Hotspot for 20 minutes in a warm Lagos living room will drop from 18 Mbps upload to 6 Mbps because the baseband is throttled. Nothing alerts you. You just see progress slow down.

Fixes that help: lay the phone on a ceramic tile or glass table, not on fabric or a laptop palm rest. Run a small desk fan toward it. Turn off the screen during upload. If the phone is in a rugged case, take it off.

What doesn't help: putting the phone in the fridge. Condensation forms inside the phone when it warms back up. Don't do this.

## Battery versus charging during upload

USB-tethered to a laptop, the laptop supplies power. This sounds fine. The catch is that most laptops only deliver 5W or 7.5W over USB, which is less than the phone draws at max radio. The phone charges, but slowly, and if the battery was below 30 percent when you started, you may not gain ground.

Better: plug the phone into a wall charger with a separate USB cable, and USB-tether with a second cable. Yes, two cables. The phone stays fully powered and the laptop sees it as a network interface.

On iPhone specifically, if you're on 15W wireless MagSafe during a tether, the phone will throttle the modem within 15 minutes because wireless charging itself generates heat on top of everything else. Use wired charging during tethering. Always.

## Picking which SIM to tether on

Not all Nigerian carriers behave the same for tethering. Some quick notes from testing four SIMs in the same drawer:

MTN 4G+: consistent 10 to 18 Mbps upload in the afternoon. Reasonable tethering performance. Data plans designed for tethering exist, which helps.

Airtel 5G: fast but coverage-dependent. When it works, you get fiber-level upload speeds. See [optimizing MTN, Glo, Airtel, 9mobile uploads](/blog/mtn-glo-airtel-9mobile-uploads) for carrier-specific notes.

Glo: cheapest per GB but tail-latency issues make it worst for long uploads. Third choice unless nothing else works.

9mobile: surprisingly decent in Maitama and Port Harcourt. In Lagos, coverage gaps limit it.

Keep the SIM you don't usually use as a backup in a cheap MiFi. If your primary fails, the backup is a power-on away.

## APN and tethering configuration tweaks

Most tethering problems in Nigeria come from carrier-level APN configurations that throttle tethered traffic differently from on-device traffic. Three things to check:

Set hotspot channel to 5 GHz if your laptop supports it (reduces contention with neighbors).

On Android, disable "Data Saver" mode during upload (it kills background streams).

On iPhone, toggle "Maximize Compatibility" off in Personal Hotspot settings if all your devices support 5 GHz. This forces 5 GHz and skips 2.4 GHz for better throughput.

If your carrier throttles tethering specifically, some users report success changing the TTL (Time To Live) on outgoing packets so the carrier's shaping can't distinguish tethered from direct traffic. This is gray-area territory and may violate your carrier's terms of service. Weigh accordingly.

## The 90-minute-delivery playbook

Fiber drops at 4:30 pm. Delivery due at 6 pm.

First 5 minutes: move to whichever window in your apartment has the best MTN or Airtel signal (RSSI above -90 dBm ideally). Plug phone into wall charger. USB-tether to laptop. Kill all other network-heavy apps on the laptop (Dropbox, Backblaze, Zoom).

Next 5 minutes: start a Speedtest to confirm the link is actually delivering what you expect. If upload tests at 2 Mbps, the upload of a 2 GB file is going to take just under 3 hours. Panic appropriately or keep going.

Remaining 80 minutes: start the upload, don't touch the laptop, don't touch the phone, don't walk around with the phone. Leave both alone. Check progress every 20 minutes.

If this scenario describes your life regularly, a second ISP on different physical infrastructure is cheaper than missed deliveries. For anything creative, [sending large files in Nigeria](/send-large-files-nigeria) benefits from redundancy more than raw speed.

Tether once a week on purpose just to keep your setup tested. [Try it free](/) with a small test file so you know the setup works before you need it.
