---
layout: post
title: Syncthing
---

[Syncthing](https://syncthing.net/) is a file synchronization tool.
I decided to try it after seeing [this post](https://tonsky.me/blog/syncthing/) on [hacker news](https://news.ycombinator.com/item?id=23537243).
Many posts have been written about how awesome it is, and this is another one of those -- I'm really having fun with it.

## Setup ##

I mainly run `syncthing` on three devices -- my Android phone, my server, and my laptop.
I ended up switching to it because I upgraded my laptop to Ubuntu 20.04, and this [broke Unison](https://unix.stackexchange.com/questions/583058/unison-and-version-compiler-conflicts/583377#583377), which I had previously been using to synchronize a few folders between my server and laptop.
After several hours wasted didn't solve the issue, I gave up on it altogether, and I'm glad I did.

Setup was straightforward on my Ubuntu laptop.

On the server, I had to do a few manual steps.
After adding the apt rep and installation, I copied a systemd unit file from [here](https://computingforgeeks.com/how-to-install-and-use-syncthing-on-ubuntu-18-04/).
I wasn't familiar with the `@.server` and the `User=%i` syntax of unit files, and I still can't find it documented anywhere.
This confused me for a bit, but eventually I got the file named properly, reloaded unit files with `systemctl daemon-reload`, and got the service running with `systemctl enable` and `systemctl start syncthing@igor47.service`.

Next, I wanted to get into the configuration web GUI.
I used a local tunnel:

```bash
$ ssh -L 4567:localhost:8384
```

I was then able to visit localhost:4567 in my local browser and configure `syncthing` on the server.
I picked a custom port for the `syncthing` protocol, and punched a firewall hole for incoming connections on that port.
Also, I picked a custom port for the web GUI server, so I wouldn't conflict with other users who might want to enable their own `syncthing`.
I set the web GUI to only listen on localhost, and then added a reverse proxy to this port from my web server config.

```apacheconf
  ProxyPass /syncthing/ http://localhost:12345/
  ProxyPassReverse /syncthing/ http://localhost:12345/
```

On my phone, I wanted `syncthing` to be able to write stuff onto the SD card.
Apparently, this is [not currently possible](https://github.com/syncthing/syncthing-android/wiki/Frequently-Asked-Questions#what-about-sd-card-support).
I worked around it by granting Syncthing root permissions, which works for me on my rooted Lineage android build.
YMMV.

## What I use `syncthing` for? ##

* removed google photos from my phone and allowed syncthing to sync photos
  directly to my laptop. This is especially handy when I use my phone as a
  scanner (to take photos of documents for archival), since I then immediately
  have them available for email. It's nice to be off Google photos -- one step
  closer to a google-free life!
* syncing my documents folder between laptop and server
* local cache of music. I prviously used
  [dsub](https://f-droid.org/en/packages/github.daneren2005.dsub/) to play my
  music collection, and occasionally had to fight it's cache system to convince
  it that I really wanted it to cache my entire music library. Now, I just
  `syncthing` my music collection onto the SD card in my phone, and then play
  it with
  [Pulsar](https://play.google.com/store/apps/details?id=com.rhmsoft.pulsar&hl=en)
* i use a text-based email reader ([mutt](http://www.mutt.org/)) which I access
  while SSHed into my server. Dealing with attachments can be annoying.
  Previously, I would save them to a web scratch folder and open them in a
  browser. Now, I simply keep a `syncthing`ed scratch folder and throw them
  into there -- they're immediately accessible on my laptop.
