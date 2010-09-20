---
layout: post
title: A Rubyist's development environment
---

I consider myself a Rubyist and a minimalist. I want my tools to be few, but I want to know those few tools very well. I keep them sharp.   
It's been about a year since I started programming, this post is supposed to give you a look into my toolbox. I hope it can be of inspiration to you.

I've open sourced all my dotfiles [on Github](http://github.com/Sirupsen/dotfiles).

## Operating System: Linux and Mac

My primary development platform is my desktop computer, running [Arch Linux](http://localhost:4000/my-experience-with-arch-linux "See my blog post about my experience with Arch Linux"). It's a dual screen setup, which I learned to *love*. I also own a Macbook, primarily used for schoolwork and field coding.

As for my desktop setup of noteworthy tools besides my editor, I use bleeding-edge Chromium as my browser. And I use [Openbox](http://openbox.org/wiki) as my window manager. I use Sakura as my terminal, simply because it's lightweight, simple to setup and it does its job.

I have Openbox [configured to act like Vim](http://github.com/Sirupsen/dotfiles/blob/master/.config/openbox/rc.xml), and Chromium I use [Vimium](https://chrome.google.com/extensions/detail/dbepggeogbaibhgnhhndojpepiihcmeb) to achieve the same Vim behavior. In theory I never have to touch my mouse.

### Shell

As for my shell I just use `bash`. I know the cool kids use `zsh`, but I simply haven't bothered to set it up, and I'm really quite happy with `bash`. 

My bash configuration is pretty simple. It just defines some default values, source a few things, and add to my `$PATH`. It also sets my `PS1` which only puts out the current directory. I figured that I *already know* my username, and hostname. Furthermore I really don't need to know the entire absolute path to the current directory.

## Editor: Vim

I've been through many editors. Many. Believe me. About a year ago, a friend recommended me Vim. And I started digging into it. In the start, it was hard. But I had been promised, it'd be worth it. So I sticked to it. In the start, I felt less productive in Vim, because it was somewhat hard to learn. After a few days in it however, I began taking advantage of the endless sets of commands, this all resulted in a *more* productive me. I now love Vim, and nowadays I almost do all of my text-processing in it: I take notes in Vim, I write this very blog post in Vim, and I make kick-ass code in Vim.

My Vim setup really is nothing special. I use a few plugins, and I have a small configuration file which is basically just compiled from a bunch of others. I can't remember which ones. I use Monaco as my Vim (and terminal) font, I simply like this font a lot. [Screenshot](http://imgur.com/IdNuY.png).

## Syncing: Dropbox

As I have multiple computers, I sync everything with Dropbox. This also has the benefit of being backup. I have *everything* I still keep locally in Dropbox these days: mostly configuration and code. The rest is in the cloud. So I keep everything in my Dropbox, and make symbolic links from the Dropbox. For example I have all [my dotfiles](http://github.com/Sirupsen/dotfiles) in `~/Dropbox/dotfiles`, so I simply issue:

{% highlight bash %}
$ ln -s Dropbox/dotfiles/.vim ~/
{% endhighlight %}

To get my Vim plugins on a machine. I've made a [Rake task](http://github.com/Sirupsen/dotfiles/blob/master/Rakefile) to automate all this linking, note I wrote ths script pretty quickly, and not too well, and it uses `FileUtils#rm_rf`, so watch out if you are going to use it for yourself.

## Coding

When I work, I usually work on two monitors. A 19", and a 24". On the 19" I have Pidgin running. On my 24" I have a browser running in the right side, and Vim and a terminal (overlapping each other) in the left side. I *rarely* use any other applications, so I never have to close any windows when I work. I don't use workspaces with this setup either. 
