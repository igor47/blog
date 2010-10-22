---
layout: post
title: Setting up Nginx and Unicorn
---

Unicorn is a cool new server, and [we like it because it's Unix][tomayko].

So what is Unicorn?

> Unicorn is an HTTP server for Rack applications designed to only serve fast clients on low-latency, high-bandwidth connections and take advantage of features in Unix/Unix-like kernels.

# Design 

It's design is Unix. It uses the OS features where they are better. Unicorn has [a whole document][udesign] dedicated to address it's design. Let's take a few points from there that are essential to Unicorn.

## Load balancing

> Load balancing between worker processes is done by the OS kernel. All workers share a common set of listener sockets and does non-blocking accept() on them. The kernel will decide which worker process to give a socket to and workers will sleep if there is nothing to accept().

This is really, really cool. Normally load balancers reverse proxy to the worker that is *most likely* to be ready, based on when the last request was sent. But there's a few problems to that:

* Some requests take longer than others to complete
* Software fails

Unicorn sets up a shared Unix socket. When a worker is not currently serving a request, it listens on the socket and throws an `accept()` when a request is ready. This is called **push balancing**.

### Slow clients

Some clients are slow. And this slows down everything. Twitter has put this issue nicely in [their blog post][twitter] on why they moved to Unicorn:

> Every server has a fixed number of workers (cashiers) that handle incoming requests. During peak hours, we may get more simultaneous requests than available workers. We respond by putting those requests in a queue.

Welcome to the (retro)world of evented I/O; here's the catch:

> This is unnoticeable to users when the queue is short and we handle requests quickly, but large systems have outliers. Every so often a request will take unusually long, and everyone waiting behind that request suffers. Worse, if an individual worker's line gets too long, we have to drop requests. You may be presented with an adorable whale just because you landed in the wrong queue at the wrong time.

And then they talk a bit about supermarket queues, [read the whole thing][twitter].

Unicorn dislikes slow clients. Instead of stacking people up in long queues behind some guy who's connection fails miserably, we let that guy fail: The Unicorn master process knows exactly how long each of its workers has been processing a request, and if it takes longer than `timeout` (configured; usually 30s) to finish the request, it kills the worker and immediately forks a new one ready to serve requests. The slow client is given a 502 error page.

## Deploying

This is rad:

> You can upgrade Unicorn, your entire application, libraries and even your Ruby interpreter without dropping clients.

The Unicorn master and worker processes [responds](usignal) to `SIGNALS`. Here's what Github does:

> First we send the existing Unicorn master a USR2 signal. This tells it to begin starting a new master process, reloading all our app code. When the new master is fully loaded it forks all the workers it needs. The first worker forked notices there is still an old master and sends it a QUIT signal.

> When the old master receives the QUIT, it starts gracefully shutting down its workers. Once all the workers have finished serving requests, it dies. We now have a fresh version of our app, fully loaded and ready to receive requests, without any downtime: the old and new workers all share the Unix Domain Socket so nginx doesn’t have to even care about the transition.

> We can also use this process to upgrade Unicorn itself.


[tomayko]: http://tomayko.com/writings/unicorn-is-unix
[udesign]: http://unicorn.bogomips.org/DESIGN.html
[usignal]: http://unicorn.bogomips.org/SIGNALS.html
[twitter]: http://engineering.twitter.com/2010/03/unicorn-power.html
