---
layout: post
title: Minimum Viable Air Quality Monitoring
---

If you, like me, live in the Bay Area, you may have woken up to something like this last week:

![Outdoor Air Quality](/static/images/minimal-aq-outside.jpg)

This is my back yard, but things looked just as dire in the house:

![Indoor Air Quality](/static/images/minimal-aq-inside.jpg)

If you checked a website, like [PurpleAir](https://www.purpleair.com/map?opt=1/mAQI/a10/cC0#8/38.138/-121.702) or [AirNow](https://fire.airnow.gov/?lat=37.86988000000008&lng=-122.27053999999998&zoom=12), you would see scary numbers and dire warnings about staying indoors and avoiding the air outside.
However, how *is* the air inside your house?
Are you actually much safer?

Thankfully, answering this question has gotten cheaper and easier in recent years.
Low-cost air quality sensors have been built into reasonably inexpensive hardware.
The [PurpleAir indoor sensor](https://www2.purpleair.com/products/purpleair-pa-i-indoor), for instance, is only $200.

The heart of that device is a plantower laser dust sensor which can be [had on AliExpress for about $12](https://www.aliexpress.com/item/32639894148.html).
With PurpleAir, you're paying for more than just the sensor.
That device includes a BME280 temperature/pressure/humidity sensor, a microcontroller that can access a WiFi network, and is conveniently packed into a nice-looking device.
You pay for integration of all that hardware, firmware to make it work together, and software that integrates the data on the back-end and gives you a nice map to view it on.
You're also paying for hosting to allow PurpleAir to visualize all the data.
So, by buying one, you're not only becoming better-informed, but you're also helping folks in your neighborhood be better-informed too -- a *positive* externality, for once!

However, if you're brave enough, there are advantages to building the hardware yourself.
Getting several sensors inside and outside your house can help you understand more about the air you're breathing.
It can help quantify interventions, like installing an air purifier or running [a box fan](https://www.texairfilters.com/how-a-merv-13-air-filter-and-a-box-fan-can-help-fight-covid-19/).
If you have a large house, you can see how quality differs throughout the house.


This post will help you build a minimum viable sensor that works with your laptop.
By running from your own computer, you can avoid sending data to a cloud, can avoid interfacing with typically-terrible IoT configuration interfaces, and can log and visualize the data in whatever way you like.

## Hardware 

The bill of materials for this project includes two things:
* Plantower PMS7003 -- maybe [this one](https://www.aliexpress.com/item/32784279004.html)
* A USB-to-TTL cable like [this one](https://amzn.to/2GYAYAD)

This should run you about $20 all-told.
I also needed the following tools and supplies:
* soldering iron and solder
* heat shrink tubing and a lighter
* wire clippers/strippers

The PMS7003 sensors I had did not come with the little breakout board, and this device has *very* small pins.
To connect to it, I used some 30AWG wire-wrap wire and a wire-wrapping tool.
If you get a PMS7003 with a breakout and cable, you won't need this.

My first task was connecting to the PMS7003.
Here's the pinout, from the [data sheet](https://download.kamami.com/p564008-p564008-PMS7003%20series%20data%20manua_English_V2.5.pdf):

![PMS7003 pinout](/static/images/minimal-aq-pms7003-pinout.gif)

You'll only need 4 wires -- for power, ground, serial Tx, and Rx.
I stripped the tiniest bit of insulation on my wire wrap wire, tinned both the wire and the pin, and touched them together with the soldering iron (very carefully, to avoid bridging the pins).

![soldering wires](/static/images/minimal-aq-wires.jpg)

Here's a (blurry) photo with all 4 wires connected:

![soldering wires](/static/images/minimal-aq-all-wires.jpg)

Next, I stripped my USB TTL cable and tinned the exposed multi-strand wires.
Tinning just means touching the soldering iron to the wire and allowing some solder to flow onto the wire.
This makes the wire stiff, so I can wire-wrap onto it using my wire-wrap tool.

![USB TTL](/static/images/minimal-aq-usb-ttl-tinned.jpg)

Next, I wire-wrapped the exposed, tinned wires.
Black and Red are for ground and power, and get connected together.
On my TTL cables, `green` is for `Tx` (transmit) and `white` is for `Rx` (receive).
You need to connect the `Tx` of the PMS7003 to the `Rx` of the TTL cable, and vice versa.
I made it easier for myself by making my `white` wire on the PMS7003 be the `Tx` pin (Pin9), so I could just do white-to-white:

![Completed Wiring](/static/images/minimal-aq-wired-up.jpg)

After wire-wrapping, I soldered the wires together (belt *and* suspenders!)
Finally, I put some heat-shrink tubing over the wires and shrunk it using a lighter.
I then taped the device right to the USB plug with electrical tape.
Be sure to avoid covering up the air intake and expel ports on the PMS7003.
Also, be mindful of USB polarity.
The orientation that I have in the photo is probably the way your USB port is aligned on your computer, so the PMS7003 ends up on top of the USB plug.

![Completeled device](/static/images/minimal-aq-complete.jpg)

Here it is, plugged into my computer and ready for software integration:

![Plugged into computer](/static/images/minimal-aq-in-computer.jpg)

## Software

Next, you'll need some software to integrate with this hardware.
The USB TTY device is likely already supported by your OS.
On my laptop, I'm running Ubuntu 20.04, and this is what I see when I plug it in:

```
[1457958.125315] usb 1-2: new full-speed USB device number 38 using xhci_hcd
[1457958.281810] usb 1-2: New USB device found, idVendor=067b, idProduct=2303, bcdDevice= 4.00
[1457958.281816] usb 1-2: New USB device strings: Mfr=1, Product=2, SerialNumber=0
[1457958.281820] usb 1-2: Product: USB-Serial Controller
[1457958.281823] usb 1-2: Manufacturer: Prolific Technology Inc.
[1457958.283810] pl2303 1-2:1.0: pl2303 converter detected
[1457958.285306] usb 1-2: pl2303 converter now attached to ttyUSB0
```

Looks like it got recognized correctly, and it's also helpful to note the address of the device.
In my case, it'll be available on `/dev/ttyUSB0`.
While it has power, the PMS7003 will be outputting a continuous stream of binary data containing the particulate readings onto that TTY device.
The [data sheet](https://download.kamami.com/p564008-p564008-PMS7003%20series%20data%20manua_English_V2.5.pdf) specifies the protocol:

![PMS7003 protocol](/static/images/minimal-aq-pms7003-protocol.png)
