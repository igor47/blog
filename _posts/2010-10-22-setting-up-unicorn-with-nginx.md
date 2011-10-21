---
layout: post
title: "Setting up Unicorn with Nginx"
published: true
---

Unicorn is a cool new Ruby HTTP server, and [we like it because it's Unix][tomayko].

> Unicorn is an HTTP server for Rack applications designed to only serve fast clients on low-latency, high-bandwidth connections and take advantage of features in Unix/Unix-like kernels.

I'm going to talk about Unicorn's design, and then I'll walk you through setting it up on your server.

# Design 

Its design is Unix:

> Do one thing and do it right.

For instance, load balancing in Unicorn is done by the OS kernel and you manage the processes by sending signals.

Unicorn has [a whole document][udesign] dedicated to address its design. Here are some of the things:

## Load balancing

> Load balancing between worker processes is done by the OS kernel. All workers share a common set of listener sockets and does non-blocking accept() on them. The kernel will decide which worker process to give a socket to and workers will sleep if there is nothing to accept().

This is really, really cool. Normally load balancers reverse proxy to the worker that is *most likely* to be ready, usually based on when the last request was sent to that worker. But there are a few problems to that method:

* Some requests take longer to complete (e.g. heavy I/O)
* Software fails (and it always does, at 2am if you are a software engineer)

Unicorn uses a shared Unix socket (although it can also use TCP, but Unix domain sockets are faster). When a worker is not currently serving a request, it listens on the Unix socket and fights with the other workers to `accept()` connections. This is called **push balancing**. It's great because it solves the problems from above.

## Slow clients

Some clients are slow. And those clients can slow down everything. Twitter has put this issue nicely in [their blog post][twitter] on why they moved to Unicorn:

> Every server has a fixed number of workers that handle incoming requests. During peak hours, we may get more simultaneous requests than available workers. We respond by putting those requests in a queue.

Welcome to the (retro)world of evented I/O; here's the catch:

> This is unnoticeable to users when the queue is short and we handle requests quickly, but large systems have outliers. Every so often a request will take unusually long, and everyone waiting behind that request suffers. Worse, if an individual worker's line gets too long, we have to drop requests. You may be presented with an adorable whale just because you landed in the wrong queue at the wrong time.

And then they continue to talk about supermarket queues, [read the whole thing][twitter].

Unicorn disfavors slow clients. Instead of stacking people up in long queues behind some guy who's connection fails miserably; Unicorn lets that one guy fail. The Unicorn master process knows exactly how long each of its workers has been processing a request, and if it takes longer than `timeout` (configured; usually 30s) to finish the request, it kills the worker and immediately forks a new one ready to serve requests. Affected clients are given a 502 error page.

## Deploying

With Unicorn one can deploy with *zero* downtime. This is rad stuff:

> You can upgrade Unicorn, your entire application, libraries and even your Ruby interpreter without dropping clients.

The Unicorn master and worker processes [respond][usignal] to `SIGNALS`. Here's what Github does:

> First we send the existing Unicorn master a `USR2 SIGNAL`. This tells it to begin starting a new master process, reloading all our app code. When the new master is fully loaded it forks all the workers it needs. The first worker forked notices there is still an old master and sends it a QUIT signal.

> When the old master receives the QUIT, it starts gracefully shutting down its workers. Once all the workers have finished serving requests, it dies. We now have a fresh version of our app, fully loaded and ready to receive requests, without any downtime: the old and new workers all share the Unix Domain Socket so nginx doesn’t have to even care about the transition.

> We can also use this process to upgrade Unicorn itself.

This behaviour requires a bit of Unicorn-config-fu to achieve, but Github has shared [their config][gconfig] with us. There's a handy bash script taking advantage of the `SIGNAL` Unicorn API [baked in][init] with Unicorn.

Unicorn makes 100% uptime possible.

# Rails on Unicorns

Ready power your app by rainbows?

We're going to set up [Nginx][nginx] in front of Unicorn.

## Nginx

Start by installing [Nginx][nginx] via your favorite package manager. Afterwards we need to configure it for Unicorn, we're gonna grab [the `nginx.conf` example configuration shipped with Unicorn][unginx], the Nginx configuration file is usually located at `/etc/nginx/nginx.conf`, so place it there, and tweak it to your likings, read the comments--they're quite good.

In `nginx.conf` you may have stumbled upon this line:

{% highlight bash %}
user nobody nogroup; # for systems with a "nogroup"
{% endhighlight %}

While this works, it's generally adviced to run as a seperate user for security reasons and increased control. Let's create an Nginx user, and a web group:

{% highlight bash %}
$ sudo useradd -s /sbin/nologin -r nginx
$ sudo usermod -a -G web nginx
{% endhighlight %}

Configure your static path in `nginx.conf` to `/var/www`, and give permissions to that folder to the web group:

{% highlight bash %}
$ sudo mkdir /var/www
$ sudo chgrp -R web /var/www # set /var/www owner group to "web"
$ sudo chmod -R 775 /var/www # group write permission
{% endhighlight %}

Then add yourself to the web group so you can modify the contents of `/var/www`:

{% highlight bash %}
$ sudo usermod -a -G web USERNAME
{% endhighlight %}

## Unicorn

Time for flying rainbow horses. Start by installing the Unicorn gem:

{% highlight bash %}
$ gem install unicorn
{% endhighlight %}

You should now have Unicorn installed: `unicorn` (for non-Rails rack applications) and `unicorn_rails` (for Rails applications version >= 1.2) should be in your path.

Time to take it for a spin! (You may wish to re-login with `su - USERNAME` if you haven't already, this ensures your permission tokens are set, otherwise you will not have write permission to `/var/www`)

{% highlight bash %}
$ cd /var/www
$ rails new unicorn
{% endhighlight %}

There we go, we now have our Unicorn Rails test app in `/var/www`! Let's fetch some Unicorn config and start the madness. We're going for the `unicorn.conf` example that comes with the Unicorn source:

{% highlight bash %}
$ curl -o config/unicorn.rb https://raw.github.com/defunkt/unicorn/master/examples/unicorn.conf.rb
{% endhighlight %}

You might want to tweak a few things:

{% highlight ruby %}
APP_PATH = "/var/www/unicorn"
working_directory APP_PATH

stdeer_path APP_PATH + "/log/unicorn.stderr.log"
stdout_path APP_PATH + "/log/unicorn.stderr.log"

pid APP_PATH + "/tmp/pid/unicorn.pid"
{% endhighlight %}

Our Unicorn is ready!

## Rainbow magic

Start the Nginx deamon, how this is done depends on your OS. And then start Unicorn:

{% highlight bash %}
$ unicorn_rails -c /var/www/unicorn/config/unicorn.rb -D
{% endhighlight %}

`-D` deamonizes it. `-c` should be pretty obvious; it specifies the configuration. In production you will probably want to pass `-E production` as well to run the app in the production environment.

That's it! Visiting [localhost](http://localhost) should take you to the Rails default page.

[tomayko]: http://tomayko.com/writings/unicorn-is-unix
[gconfig]: http://gist.github.com/206253
[udesign]: http://unicorn.bogomips.org/DESIGN.html
[usignal]: http://unicorn.bogomips.org/SIGNALS.html
[twitter]: http://engineering.twitter.com/2010/03/unicorn-power.html
[unginx]: http://github.com/defunkt/unicorn/blob/master/examples/nginx.conf
[nginx]: http://nginx.org
[init]: http://github.com/defunkt/unicorn/blob/master/examples/init.sh
