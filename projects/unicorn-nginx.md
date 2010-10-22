---
layout: post
title: Setting up Nginx and Unicorn
---

Unicorn is a cool new server, and [we like it because it's Unix][tomayko].

So what is Unicorn?

> Unicorn is an HTTP server for Rack applications designed to only serve fast clients on low-latency, high-bandwidth connections and take advantage of features in Unix/Unix-like kernels.

# Design 

It's design is Unix.

> Do one thing and do it right.

For instance, load balancing in Unicorn is done by the OS kernel.

Unicorn has [a whole document][udesign] dedicated to address its design. Let's take a few points from there that are essential to Unicorn:

## Load balancing

> Load balancing between worker processes is done by the OS kernel. All workers share a common set of listener sockets and does non-blocking accept() on them. The kernel will decide which worker process to give a socket to and workers will sleep if there is nothing to accept().

This is really, really cool. Normally load balancers reverse proxy to the worker that is *most likely* to be ready, based on when the last request was sent. But there's a few problems to that:

* Some requests take longer than others to complete
* Software fails

Unicorn sets up a shared Unix socket. When a worker is not currently serving a request, it listens on the socket and throws an `accept()` when a request is ready. This is called **push balancing**.

## Slow clients

Some clients are slow. And this slows down everything. Twitter has put this issue nicely in [their blog post][twitter] on why they moved to Unicorn:

> Every server has a fixed number of workers (cashiers) that handle incoming requests. During peak hours, we may get more simultaneous requests than available workers. We respond by putting those requests in a queue.

Welcome to the (retro)world of evented I/O; here's the catch:

> This is unnoticeable to users when the queue is short and we handle requests quickly, but large systems have outliers. Every so often a request will take unusually long, and everyone waiting behind that request suffers. Worse, if an individual worker's line gets too long, we have to drop requests. You may be presented with an adorable whale just because you landed in the wrong queue at the wrong time.

And then they talk a bit about supermarket queues, [read the whole thing][twitter].

Unicorn dislikes slow clients. Instead of stacking people up in long queues behind some guy who's connection fails miserably, we let that guy fail: The Unicorn master process knows exactly how long each of its workers has been processing a request, and if it takes longer than `timeout` (configured; usually 30s) to finish the request, it kills the worker and immediately forks a new one ready to serve requests. The slow client is given a 502 error page.

## Deploying

With zero downtime. This is rad stuff:

> You can upgrade Unicorn, your entire application, libraries and even your Ruby interpreter without dropping clients.

The Unicorn master and worker processes [responds][usignal] to `SIGNALS`. Here's what Github does:

> First we send the existing Unicorn master a USR2 signal. This tells it to begin starting a new master process, reloading all our app code. When the new master is fully loaded it forks all the workers it needs. The first worker forked notices there is still an old master and sends it a QUIT signal.

> When the old master receives the QUIT, it starts gracefully shutting down its workers. Once all the workers have finished serving requests, it dies. We now have a fresh version of our app, fully loaded and ready to receive requests, without any downtime: the old and new workers all share the Unix Domain Socket so nginx doesn’t have to even care about the transition.

> We can also use this process to upgrade Unicorn itself.

This requires a bit of Unicorn-config-fu to achieve, but Github has shared [their config][gconfig] with us.

# Rails on Unicorns

Ready to be powered by rainbows?

We're going to set up Nginx in front of Unicorn.

## Nginx

Start by installing [Nginx][nginx]. Afterwards we need to configure it for Unicorn, we're gonna grab [the Nginx.conf example shipped with Unicorn][unginx], the Nginx configuration file is usually located at `/etc/nginx/nginx.conf`, tweak it to your likings, read the comments--they're quite good.

In `nginx.conf` you may have stumbled upon and wondered about this line:

{% highlight bash %}
user nobody nogroup; # for systems with a "nogroup"
{% endhighlight %}

While this works, it's generally adviced to run as a seperate user. Let's create an Nginx user, and a web group:

{% highlight bash %}
$ sudo useradd -s /sbin/nologin -r nginx
$ sudo usermod -a -G nginx web
{% endhighlight %}

Configure your static path to `/var/www`, and give permissions to the web group:

{% highlight bash %}
$ sudo mkdir /var/www
$ sudo chgrp -R web /var/www # set /var/www owner group to "web"
$ sudo chmod -R 755 /var/www # group write permission
{% endhighlight %}

Then add add yourself to this group so you can modify the contents of `/var/www`:

{% highlight bash %}
$ sudo usermod -a -G web USERNAME
{% endhighlight %}

## Unicorn

Time for flying rainbow horses. Start by installing the Unicorn gem:

{% highlight bash %}
$ gem install unicorn
{% endhighlight %}

You should now have Unicorn installed: `unicorn` (for non-Rails rack applications) and `unicorn_rails` (for Rails applications version >= 1.2) should be in your path.

Time to take a test run! (You may wish to relogin with `su - USERNAME` if you haven't already so your permission tokens are set, else you will not have write permission to `/var/www`)

{% highlight bash %}
$ cd /var/www
$ rails new unicorn
{% endhighlight %}

There we go, we now have our Unicorn Rails test app. in `/var/www`! Let's fetch a config and start the madness. We're going for the `unicorn.conf` example that comes with the Unicorn source:

{% highlight bash %}
$ curl -o config/unicorn.rb http://github.com/defunkt/unicorn/raw/master/examples/unicorn.conf.rb
{% endhighlight %}

You might want to tweak a few things:

{% highlight ruby %}
APP_PATH = "/var/www/unicorn/"
working_directory APP_PATH

stdeer_path APP_PATH + "/log/unicorn.stderr.log"
stdout_path APP_PATH + "/log/unicorn.stderr.log"

pid APP_PATH + "/tmp/pid/unicorn.pid"
{% endhighlight %}

Unicorn is ready!

## Rainbow magic

Start Nginx, how this is done depends on your OS. Then start Unicorn:

{% highlight bash %}
$ unicorn_rails -c /var/www/unicorn/config/unicorn.rb -D
{% endhighlight %}

`-D` deamonizes it. `-c` should be pretty obvious; it specifies the configuration. In production you will probably want to pass `-E production` as well to run the app. in the production environment.

That's it! Visiting [localhost](http://localhost) should take you to the Rails default page.

You've been served by Unicorn magic!


[tomayko]: http://tomayko.com/writings/unicorn-is-unix
[gconfig]: http://gist.github.com/206253
[udesign]: http://unicorn.bogomips.org/DESIGN.html
[usignal]: http://unicorn.bogomips.org/SIGNALS.html
[twitter]: http://engineering.twitter.com/2010/03/unicorn-power.html
[unginx]: http://github.com/defunkt/unicorn/blob/master/examples/nginx.conf
[nginx]: http://nginx.org
