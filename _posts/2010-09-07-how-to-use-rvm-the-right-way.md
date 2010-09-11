---
layout: post
title: How to use RVM - the right way
---

I've always run Ruby, and I've always used [RVM](http://rvm.beginrescueend.com/). But it's not until recently when I attended [Aarhusrb](http://aarhusrb.dk) and [@chopmo](http://twitter.com/chopmo) gave a talk on RVM, that I realized how wrong I was using RVM. Basically, I'm somewhat always using system Ruby, installing all gems with `sudo`. However, digging into RVM I found useful features, such as gemsets, installing gems on a user basis, ..
Thus I realized I ideally should run my entire Ruby environment through RVM, instead of only using RVM for anything not supported by my system install.  

Here are my new discoveries, compiled down to a blog post. Most of this can be found in the great [RVM documentation](http://rvm.beginrescueend.com/).

## Installing RVM

If you don't already have RVM installed, you should do it now. It's fairly simple to install:

{% highlight bash %}
$ bash < <( curl http://rvm.beginrescueend.com/releases/rvm-install-head )
{% endhighlight %}

*If there are > 1 users on your system wishing to use RVM, you may want to look into a [system-wide installation](http://rvm.beginrescueend.com/deployment/system-wide/)*

And then add what it says to `.bashrc`, `.bash_profile` or whatever you use.

{% highlight bash %}
$ echo '[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm"' >> .bashrc
{% endhighlight %}

What I hate about installing gems is that it's slow due to `ri` and `rdoc`. I never use this local documentation anyway, and it's faily easy to disable the generation of it; speeding up your gem installs a great deal. Just put this in your `~/.gemrc`:

{% highlight ruby %}
gem: --no-ri --no-rdoc
{% endhighlight %}

Verify whether the `rvm` command works, and use the chance to also check your system notes:

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

### What?

The shortest explanation, is found within the name. Gem-sets.  
RVM's documentation puts it like this:

> RVM gives you compartmentalized independent ruby setups. This means that ruby, gems and irb are all separate and self-contained from system and from each other.   
> You may even have separate named gemsets.  
> Let's say, for example, that you are testing two versions of a gem with ruby 1.9.2-head. You can install one to the default 1.9.2-head and create a named gemset for the other version and switch between them easily.

Ideally you have a Gemset for each project that you are working on. This keeps your system clean, and eliminates "Gem clutter". Also running `bundle install` will use the project defined gemset to also store the gems.

### Creating and using a gemset

So let's go ahead and create a gemset:

{% highlight bash %}
$ rvm gemset create foo # Create gemset 'foo'
'foo' gemset created (/home/sirup/.rvm/gems/ruby-1.9.2-p0@foo).

$ rvm 1.9.2@foo # Switch to Ruby 1.9.2 with gemset 'foo'
$ gem list # Lists installed gems
*** LOCAL GEMS ***
{% endhighlight %}

Let's try to install a few gems in our new gemset, note again, we do not *need* to use `sudo` to install gems, as everything is kept in `~/.rvm`:

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
$ rvm 1.9.2
{% endhighlight %}

And `gem list` here returns an empty list, as expected since no gems are installed in the global gemset.  

### Dumping and loading gemsets

Let's try that export feature, that I previously explained as a backup solution, again:

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
$ rvm use 1.9.2@rails --create # Shortcut to create, then switch to it
$ rvm gemset import rails.gems
{% endhighlight %}

Which would install all the gems from `rails.gems`, and the exact same versions. This is great when you work in teams, because we all tried messing up the versions..  

### The global and default gemset

Two interesting gemsets are the `global` (`~/.rvm/gemsets/global.gems`) and `default` (`~/.rvm/gemsets/default.gems`) gemsets.  
Gems in the `global gemset`, will be added to the global gemset in *every* new Ruby you install. `rake` and `rdoc` are good examples of handy global gems.  
The `default gemset` is the gems included in every new gemset.

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

My favorite configuration option is `rvm_gemset_create_on_use_flag=1`, having this line in `/etc/rvmrc` or `~/.rvmrc`, gemsets will be automatically created when used:

{% highlight bash %}
$ rvm gemset list
gemsets for ruby-1.9.2-p0 (found in /home/sirup/.rvm/gems/ruby-1.9.2-p0)

foo
global
$ rvm gemset use foobar
Now using gemset 'foobar'
{% endhighlight %}

You can read more about `rvmrc` in [RVM's documentation](http://rvm.beginrescueend.com/workflow/rvmrc/).

## Conclusion

This is all briefly describing what can be found in [RVM's (fantastic) documentation](http://rvm.beginrescueend.com/). Go there and read up, RVM can do a whole lot more than I adressed here. The goal of this post was simply to get you started well, and right with RVM.
