---
layout: post
title: Arch Linux Configuration
---

After encountering some issues with Ubuntu on my Thinkpad X1 Carbon 6th-gen, I went back to Arch linux.
So far, I'm loving it, but I did have to figure out a few things.
This is meant to document a few things I did to customize the machine to my liking.

## Re-mapping CapsLock to Ctrl 

My brain is very used to the caps lock key being the control key.
When this is not remapped, I end up constantly switching into all-caps mode and being very confused when things don't work correctly.
I used [interception](https://gitlab.com/interception/linux/tools) and the [caps2esc](https://gitlab.com/interception/linux/plugins/caps2esc) plugin to make the re-mapping work in a virtual console as well as in X.

First, install `caps2esc` (I use the [yay](https://github.com/Jguer/yay#installation) package manager):
I picked the `community/interception-caps2esc` package, which was option `1` in the `yay` listing.

```
$ yay caps2esc
```

Next, configure the re-mapping.
I use `-m 1` to disable the mode where pressing `esc` turns on caps lock, since I like the escape key to just remain the escape key and don't really need caps lock.
This configuration goes into the file `/etc/interception/udevmon.yaml`:

```yaml
- JOB: intercept -g $DEVNODE | caps2esc -m 1 | uinput -d $DEVNODE
  DEVICE:
    EVENTS:
      EV_KEY: [KEY_CAPSLOCK]
```

Finally, enable and activate the `udevmon` service, and enjoy no-more caps lock:

```
$ sudo systemctl enable udevmon
$ sudo systemctl start udevmon
```

## Auto-suspend on low battery

Occasionally, I leave my laptop with the lid open for a reason.
Other times, I just forget about it.
I always feel bad coming back to a dead computer with a battery at 0%, since this can [reduce the lifetime of the battery](https://electronics.stackexchange.com/questions/164103/if-li-ion-battery-is-deeply-discharged-is-it-harmful-for-it-to-remain-in-this-s).

To prevent this, I have a script which will auto-suspend my computer if the battery level drops too low.
I use this script (which I put into my `~/bin/auto_suspend.sh` and made executable with a `chmod u+x`):

```bash
#!/bin/bash

battery_level=`cat /sys/class/power_supply/BAT0/capacity`

if [ "$battery_level" -le 5 ]
then
  notify-send "Battery critical. Battery level is ${battery_level}%! Suspending..."
  sleep 5
  systemctl suspend
elif [ "$battery_level" -le 8 ]
then
  notify-send "Battery low. Battery level is ${battery_level}%!"
fi
```

To run this script periodically, I used [systemd timers](https://wiki.archlinux.org/index.php/Systemd/Timers) (since Arch does not come with a cron daemon installed in the base system).
First, I created a unit file for my auto-suspend service, in `~/.config/systemd/user/auto_suspend.service`:

```
[Unit]
Description=Checks battery and suspends if low

[Service]
Type=oneshot
ExecStart=/home/igor47/bin/auto_suspend.sh
```

Next, I created a timer which will periodically activate this service (in `~/.config/systemd/user/auto_suspend.timer`):

```
[Unit]
Description=Check battery level and auto-suspend

[Timer]
OnBootSec=1m
OnUnitActiveSec=1m

[Install]
WantedBy=timers.target
```

My config will activate the timer 1 minute after boot-up, and also 1 minute after every activation.
I then enable the timer:

```
$ systemctl --user daemon-reload
$ systemctl --user enable auto_suspend.timer
$ systemctl --user start auto_suspend.timer
```

You can check the status of the timer like so:

```
$ systemctl --user list-timers
```
