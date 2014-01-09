---
layout: post
title: Recovering an Android Phone With a Broken Screen
---

Over the break, I dropped my phone on a tile floor and totally shattered the screen.
I can still see what's happening, but the digitizer is not working so I cannot unlock it or do anything.
I ordered a new phone, but in the meantime I would like to access my text messages (a lot of them NYE well-wishes from friends I don't see too often) and get to my Google Auth credentials.

There are a few people who have managed to get into their phones using adb shell.
[This post on reddit](http://www.reddit.com/r/Android/comments/1r2zha/) is the best writeup I've found.
However, they omit the steps they followed to enable adb debugging on a phone where this was disabled.

## Enabling ADB via Recovery Mode ##

This is what I did:

  1. Hold the power button until the phone reboots
  2. Hold down the "down volume" button until you get into the bootloader
  3. Use the volume and power buttons to boot into recovery mode
  4. Follow the instructions in step 1 of [the reddit post](http://www.reddit.com/r/Android/comments/1r2zha/) but also run `update global set value = 1 where name = "adb_enabled";` to enable debug mode

The debug mode will not persist after the phone reboots.
To fix this, I followed instructions [in this stackexachange question](http://stackoverflow.com/questions/13326806/enable-usb-debugging-through-clockworkmod-with-adb):

```
adb shell
mount /system
cd /system
cp build.prop build.prop.backup
echo persist.service.adb.enable=1 >> build.prop
```

If you edit `build.prop` via `adb pull` and `adb push`, remember to `chmod 644 build.prop` or your phone won't boot.

## Accessing the phone ##

Once I did this, my phone booted with USB debugging turned on.
Now, I wanted access to my phone.
There are many options for this -- screencasting, VNC server, etc... -- but the easiest solution is a bluetooth mouse.
Once you've got one paired with your phone, it's as though you've go your touchscreen back.

You will need to access your settings menu and pair the mouse.
From `adb shell`, you can use the `input tap` command to send screen tap events.
`input tap X Y` is a tap at the corresponding X and Y coordinate, with `0 0` being the upper left-hand corner.

I had an icon for the settings menu on my home screen, so I got to it by running `input tap 250 800`.
Once there, from `adb shell` run:

```
input tap 600 400  # for bluetooth
input tap 100 1100 # search for devices
input tap 100 1000 # to pick the first device that you've found
```

At the end of this process, you will have a pointer on-screen which works just like your finger.

## Moving to a new phone ##

I used titanium backup (I paid for the Pro version).
I used the mouse to do a backup of all of my apps and their data.
I also backed up my SMS/MMS and call log.
To do that, click `Menu` -> `Backup data to XML` and then pick a local location to save the XML files.

I copied the `TitaniumBackup` dir using `adb pull` and pushed it to the new phone with `adb push`.
I had to do the restore of the XML data separately, using `Menu` -> `Restore data from XML`.
I had to enable the advanced view in the file picker to find the location of my XML files on KitKat 4.4.2.

Afterwards, I had Google Play update all of those apps to newer versions.
This happened without problems.
