---
layout: post
title: WIP - Getting up and running with Ruby and RVM
---

*Work in progress*

I've always run Ruby, and I've always used RVM. But it's not until recently I realized how wrong I was using RVM. Basically, I'm somewhat always using system Ruby, installing all gems with `sudo`. However, digging into RVM I found useful features, such as gemsets. And installing gem not as `sudo`, and so forth. Thus I realized I should actually run my Ruby environment through RVM, instead of only using RVM when I had to run some code that was not compatible with whatever Ruby version I was using on the system, usually the latest.


## Step 0: Uninstalling all gems in system Ruby (Optional)

*Now this is not required, I just did it to clean my system. Therefore you can safely skip this step.*

I figured I'd take the change to clean my system; I'd remove all my old gems. I found this nifty command, [via Google](http://geekystuff.net/2009/1/14/remove-all-ruby-gems):

{% highlight bash %}
$ gem list | cut -d" " -f1 | xargs gem uninstall -aIx
{% endhighlight %}

Before running this though, for safety, I wanted a file that contained all my old gems, from which I could install everything, just for some safety, this is easy with RVM (if you don't have RVM installed, install it first via Step 1, and then come back):

{% highlight bash %}
$ rvm gemset export backup.gems
{% endhighlight %}

I ended out with [*quite of a file*](http://gist.github.com/568262). If you want to install all these gems again (and no, I personally don't, just look at that file!), you could just run:

{% highlight bash %}
$ rvm gemset import backup.gems
{% endhighlight %}

And now.. to run the command discussed in the first place!

{% highlight bash %}
$ gem list | cut -d" " -f1 | xargs gem uninstall -aIx
{% endhighlight %}

So now, everything should be gone--and we have a clear install; exciting! We can verify it by issuing `gem list`.

## Step 1: Installing RVM

If you don't already have RVM installed, you should do it now. It's fairly simple to install:

{% highlight bash %}
$ bash < <( curl http://rvm.beginrescueend.com/releases/rvm-install-head )
{% endhighlight %}

And then add what it says to `.bashrc`, `.bash_profile` or whatever you use.

{% highlight bash %}
$ echo '[[ -s "$HOME/.rvm/scripts/rvm" ]] && source "$HOME/.rvm/scripts/rvm"' >> .bashrc
{% endhighlight %}

Then you should be up and running! Verify it:

{% highlight bash %}
$ type rvm | head -n1
rvm is a function
{% endhighlight %}

Check your system notes, also verify `RVM` is working:

{% highlight bash %}
$ rvm notes
{% endhighlight %}

## Step 2: Installing Rubies

Rubies are essentially Ruby versions, let's go ahead and get `Ruby 1.9.2` first, and set that as our default interpreter. Afterwards, we'll install `Ruby 1.8.6`. And switch between the two environments.

Installing `1.9.2` is very easy, it's simply a matter of issuing:

{% highlight bash %}
$ rvm install 1.9.2
{% endhighlight %}

It can take a while, since it downloads the source, and compiles it all. Let's switch to it, and then verify it all works!

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

Restart your shell, and run `ruby -v` to verify it's all working. Let's install `1.8.6` along with `1.9.2`:

{% highlight bash %}
$ rvm install 1.8.6
{% endhighlight %}

And then we can switch to it, like we switched to `1.9.2` before:

{% highlight bash %}
$ rvm 1.8.6
{% endhighlight %}

(Which is a shortcut for `rvm use 1.9.2`). Now you should be up and running fine with RVM!

## Step 3: Gemsets

So what are gemsets? The shortest explanation, is found within the name. Gem-sets. As RVM's documentation puts it:

> RVM gives you compartmentalized independent ruby setups. This means that ruby, gems and irb are all separate and self-contained from system and from each other.  
> You may even have separate named gemsets.  
> Let's say, for example, that you are testing two versions of a gem with ruby 1.9.2-head. You can install one to the default 1.9.2-head and create a named gemset for the other version and switch between them easily.

So then let's create one of those fancy gemsets:

{% highlight bash %}
$ rvm gemset create foo
'foo' gemset created (/home/sirup/.rvm/gems/ruby-1.9.2-p0@foo).

$ rvm 1.9.2@foo
$ gem list
*** LOCAL GEMS ***
{% endhighlight %}

This is rather self-explanatory. First we create our gemset, then we change to use that gemset. And then we can see we are within the empty gemset, because no gems are installed. Let's try to install a few gems, note again, we do not use `sudo` to install gems, they are all kept in `~/.rvm`:

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

Great! Let's switch back to our `global` gemset:
    
{% highlight bash %}
$ rvm 1.9.2@global
{% endhighlight %}

And `gem list` here returns an empty list. This has a lot of uses, for instance if you are working on one project, you can work in a gemset for that specific project only. Then you can export your gemset, so others can easily get up and running with exactly your gems. Let's try that out quickly:

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

You could send `rails.gem` to someone else, and that person would simply import the gemset like so:

{% highlight bash %}
$ rvm gemset create rails
$ rvm 1.9.2@rails
$ rvm gemset import rails.gems
{% endhighlight %}

Which would install all the gems that the first guy had, and the exact same versions. This is great when you work in teams, because we all tried messing up the versions..
