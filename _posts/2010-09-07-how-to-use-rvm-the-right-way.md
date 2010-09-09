---
layout: post
title: How to use RVM - the right way
---

I've always run Ruby, and I've always used RVM. But it's not until recently when I attended [Aarhusrb](http://aarhusrb.dk) and [@chopmo](http://twitter.com/chopmo) gave a talk on RVM, that I realized how wrong I was using RVM. Basically, I'm somewhat always using system Ruby, installing all gems with `sudo`. However, digging into RVM I found useful features, such as gemsets. And installing gem not as `sudo`, and so forth. Thus I realized I should actually run my Ruby environment through RVM, instead of only using RVM when I had to run some code that was not compatible with whatever Ruby version I was using on the system, usually the latest.  

Here are my new discoveries, compiled down to a blog post.

## Installing RVM

If you don't already have RVM installed, you should do it now. It's fairly simple to install:

{% highlight bash %}
$ bash < <( curl http://rvm.beginrescueend.com/releases/rvm-install-head )
{% endhighlight %}

And then add what it says to `.bashrc`, `.bash_profile` or whatever you use.

{% highlight bash %}
$ echo '[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm"' >> .bashrc
{% endhighlight %}

What I hate about installing gems, is that `ri` and `rdoc` usually are extremely slow. I never use this offline documentation anyway, and it's faily easy to disable the generation of it and speed up your gem installs, just put this in `~/.gemrc`:

{% highlight ruby %}
gem: --no-ri --no-rdoc
{% endhighlight %}

Verify if the `rvm` command works, and check your system notes:

{% highlight bash %}
$ rvm notes
{% endhighlight %}

## Uninstalling all gems in system Ruby (Optional)

*Now this is not required, I just did it to clean my system. Therefore you can safely skip this step.*

Now that you have RVM installed, you can simply empty the gemset (this'll all make more sense later):

{% highlight bash %}
$ rvm gemset empty
{% endhighlight %}

Before running this you can take a backup of all your currently installed gems:

{% highlight bash %}
$ rvm gemset export backup.gems
{% endhighlight %}

This leaves you with a file, desribing all your system's gems. ([*Quite a file, in my case*](http://gist.github.com/568262)). If you at some point need to install all these gems again, it's simply a matter of running:

{% highlight bash %}
$ rvm gemset import backup.gems
{% endhighlight %}

We'll talk a bit more about `rvm gemset {import,export}` later; why it's as nifty as it is.

## Installing Rubies

Rubies are essentially Ruby versions, let's go ahead and get `Ruby 1.9.2` first, and set that as our default interpreter. Afterwards, we'll install `Ruby 1.8.6`. And then we'll try to switch between the two environments.

Installing `1.9.2` is very easy, it's simply a matter of issuing:

{% highlight bash %}
$ rvm install 1.9.2
{% endhighlight %}

It can take a while to install, since it compiles from source.  
Let's switch to it; verify it all works!

{% highlight bash %}
$ rvm 1.9.2
$ ruby -v
ruby 1.9.2p0 (2010-08-18 revision 29036) [i686-linux]
{% endhighlight %}

Great!  
We want `1.9.2` to be our default interpreter:
    
{% highlight bash %}
$ rvm --default 1.9.2
{% endhighlight %}

Restart your shell, and run `ruby -v` to verify it's all working as expcted. Let's install `1.8.6` along with `1.9.2`:

{% highlight bash %}
$ rvm install 1.8.6
{% endhighlight %}

And then we can switch to it, like we switched to `1.9.2` before:

{% highlight bash %}
$ rvm 1.8.6
{% endhighlight %}

(Which is a shortcut for `rvm use 1.8.6`). You are now up and running with two Ruby environments, congratulations!

## Gemsets

So what are gemsets? The shortest explanation, is found within the name. Gem-sets.  
RVM's documentation puts it like this:

> RVM gives you compartmentalized independent ruby setups. This means that ruby, gems and irb are all separate and self-contained from system and from each other.   
> You may even have separate named gemsets.  
> Let's say, for example, that you are testing two versions of a gem with ruby 1.9.2-head. You can install one to the default 1.9.2-head and create a named gemset for the other version and switch between them easily.

So let's go ahead and create one of those fancy gemsets:

{% highlight bash %}
$ rvm gemset create foo
'foo' gemset created (/home/sirup/.rvm/gems/ruby-1.9.2-p0@foo).

$ rvm 1.9.2@foo
$ gem list
*** LOCAL GEMS ***
{% endhighlight %}

This is rather self-explanatory. First we create our gemset, then we change to use that gemset. And then we check to see we are within the new (empty) gemset.  
Let's try to install a few gems, note again, we do not use `sudo` to install gems, as everything is kept in `~/.rvm`:

{% highlight bash %}
$ gem install rails
$ gem list
gem list
*** LOCAL GEMS ***

abstract (1.0.0)
actionmailer (3.0.0)
actionpack (3.0.0)
activemodel (3.0.0)
[..]
{% endhighlight %}

Great! Let's switch back to our `global` gemset (this is the default gemset, you can also switch to it more explicitly with `rvm 1.9.2@global`):
    
{% highlight bash %}
$ rvm 1.9.2@global
{% endhighlight %}

And `gem list` here returns an empty list, as expected since no gems are installed in the global gemset.  
This has a lot of uses, for instance if you are working on one project, you can work in a gemset for that specific project only. You can even export your gemset (explained as a "backup solution" in [Step 1](#step1)), so others can easily get up and running with exactly your gems, with all the correct versions.  
Let's try that export feature again:

{% highlight bash %}
$ rvm 1.9.2@foo
$ rvm gemset export rails.gems
$ cat rails.gems
abstract -v1.0.0
actionmailer -v3.0.0
actionpack -v3.0.0
activemodel -v3.0.0
[..]
{% endhighlight %}

You are then free to send `rails.gems` to someone else, and that person would simply import the gemset like so:

{% highlight bash %}
$ rvm gemset create rails
$ rvm 1.9.2@rails
$ rvm gemset import rails.gems
{% endhighlight %}

Which would install all the gems from `rails.gems`, and the exact same versions. This is great when you work in teams, because we all tried messing up the versions..  
In Rails 3, the gem problem is somewhat solved with the neat integration of Bundler. However, the gemset still has a lot of great uses. For instance testing an application with different gemsets, etc.

## rvmrc

Now there are different kinds of `rvmrc` files:

* System `/etc/rvmrc`
    - System wide configuration
* User `~/.rvmrc`
    - User wide configuration
* Project `.rvmrc`
    - Project wide configuration

The most interesting one is the project `.rvmrc`. Every time you `cd`, RVM looks for a file called `.rvmrc`. If it finds it, it executes it.  
Ouput from `bash` says more than a thousand words:

{% highlight bash %}
$ echo "rvm 1.8.6@project" > ~/projects/ruby-1.8.6-project/.rvmrc
{% endhighlight %}

{% highlight bash %}
~/projects $ ruby -v
ruby 1.9.2p0 (2010-08-18 revision 29036) [i686-linux]
~/projects $ cd ruby-1.8.6-project/
~/projects/ruby-1.8.6-project $ ruby -v
ruby 1.8.6 (2010-02-05 patchlevel 399) [i686-linux]
~/projects/ruby-1.8.6-project $ rvm gemset name
project
{% endhighlight %}

You can read more about `rvmrc` in [RVM's documentation](http://rvm.beginrescueend.com/workflow/rvmrc/).
