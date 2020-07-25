---
layout: post
title: Reliable SSH Tunnel for Raspberry Pi
---

You install [raspbian](https://www.raspberrypi.org/downloads/raspbian/) on a brand-new [Raspberry Pi](https://amzn.to/2GMdnjA).
When you plug it into power and the ethernet jack, it's online, but how do YOU get into it?

Over the years I've resorted to:
* giving my Pi a static IP -- which breaks when I put it on a different network
* scanning the network with `nmap`
* running a DHCP server with `netmasq` on my laptop's ethernet port (probably a USB one) and then sharing my wireless connection with the Pi to get it online

Recently, I decided I'd like to just get my Pi online and have it open a reverse-tunnel to itself.
I found a few guides to do this, but none quite put all the pieces together.
There is even a [paid service](https://www.pitunnel.com/) to do this!

However, this is actually quite easy.
I put the script necessary to do this, plus the instructions, in [this repo](https://github.com/igor47/pitunnel).
Hope it helps!
