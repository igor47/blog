---
layout: post
title: Website Scalability
---

When I was [at Airbnb](https://igor.moomers.org/thoughts-on-leaving-airbnb), I learned a lot about how to scale a website.
I've recently been working in that space again, helping other websites to scale.
I figured it might be useful to write down some of what I've learned in this space.
This is useful for me, to clarify my thinking, but is also useful for collaboration.
If my colleagues understand how I think about scaling, it would help set the context for what I'm working on, and why.

## A Basic Web App ##

To think through various scaling scenarious, lets imagine a basic hello-world web app.
When you come to the site, it renders an HTML page containing something like `<h1>Hello, World!</h1>` and sends it back to your browser, which displays it.
How does this app scale?

### Caching ###

This initial version of the app is quite static, and you could utilize caching to help you scale.
Caching here would involve routing requests to your app through a CDN, like Akamai or Cloudflare or Cloudfront.
The CDN would keep a copy of your “Hello World”, and when visitors ask for it, it would come from the CDN’s servers, not your server.

Suppose your app, instead of printing “Hello World”, printed `“Hello World, today is <day of week>”`.
This is still almost entirely static – the text only changes once a day.
You will need to carefully configure cache-control headers, so that the CDN mostly serves the file from it’s servers, but will occasionally come back to your servers to retrieve an updated version of the page.

### Horizontal Scaling ###

Suppose your app prints out `“Hello, World! It's <hour>:<minute>:<second> where I’m at.”.`
Also, assume you have to render this server-side (as a client-side app, you could do the rendering in JS, and then this app just become the perfectly-cached one from the section above).

This app would be perfectly horizontally scalable.
You do this by putting a load balancer in front of your server, and then adding more, identical web servers as needed.

If you run a single-threaded web server, it can only serve one visitor at a time.
When a second visitor visitor shows up while your server is busy rendering “Hello, World” for the first visitor, the second visitor has to wait – to get into a queue.
If you have a lot of visitors showing up at the same time, the queue will get quite long – and then some of those visitors will give up before seeing “Hello, World”.
Some of them give up subjectively, because the page isn’t doing anything, and for the really patient ones their browser will give up for them, eventually.

If you were running your single-threaded web server on a 16-CPU machine, or if the reason it took 200ms to serve “Hello, World” is because you called `sleep(0.196)` in your web server code, your server would not *look* overloaded.
You wouldn’t see excessive CPU or memory or IO usage.
The only way to tell that visitors are giving up is by looking at metrics, such as queue size, timed-out connections, number of requests at the load balancer vs. your web app, etc.

If you looked at these metrics, and discovered that you were in fact failing to greet a bunch of visitors, then you might engage in performance engineering.
You would say, “why does it take 200ms to serve this page?"
If it took less time, we'd be able to serve more visitors total.
This might lead you to finding the `sleep(0.196)`, or switching to a more performant programming language or architecture.
Alternatively, you might realize that you have a bunch of under-utilized resources on your server – say, 15 additional CPUs – and then you might use a threaded or forked web server to serve more visitors concurrently.

OR – you might not do any of that.
Instead, you might just decide, since your app is so horizontally scalable, to launch a bunch more web servers behind your load balancer.
The end result would be the same – more satisfied visitors to your site.
But you might end up paying more money for all those extra servers.
However, you would save all the time and money you spend combing through the code looking for sleep, or tuning your server software for concurrency.
This is a relevant trade-off, and should be considered when you want to scale your web app.

### State and Vertical Scaling ###

Suppose that when a visitor came to your page, you would log their IP address and the time of their visit.
Then, you would display either “Hello, visitor, for the first time!” or “Hello, visitor, welcome back!”, depending on whether you had or had not previously seen their IP address.

This version of the web app is stateful – it retains state between requests -- and thus is no longer purely horizontally scalable.
To realize this, think about where you would store the state.
You could store it directly on the server which renders “Hello”.
But, if scale by launching additional servers, then a visitor might get different servers on different requests, and would get the wrong “Hello” message and be sad.

Typically, looking up some data in a database is much faster than rendering a complicated web page, and so you end up with a two-tier web infrastructure.
The first tier is a bunch of horizontally scalable, stateless web servers.
These may have been optimized to some extent, or else just scaled as needed, according to the necessary trade-off (discussed above).
The second tier is the database, which is heavily optimized to be as fast as possible.
Web optimizations are harder, because each website is different, while “retrieve some data” is pretty generic and can be iteratively optimized over time.

However, how the database server can no longer be easily scaled horizontally.
Once you are using all the memory and all the CPUs on your database, you would be up against a wall.
In thise case, ou might decide to scale vertically – by getting a bigger, badder, beefier database server.

In this scenario, your goal is to squeeze the most possible out of the resources on your database server.
You’ll want to watch for high CPU usage, running out of memory, or saturating your disk IO or network buses.
These would alert you that you need to either scale your database server, or reduce the load from your application.

### Scaling through load shedding ###

Suppose that your simple site now has two pages.
The first page is that same one that says “Hello, visitor, for the first time!” or “Hello, visitor, welcome back!”, while the second page shows a cute random kitten.
The kitten page scales horizontally (each server has it’s own kitten repository), but the “Hello” page still requires a DB read/write before you can render it.

Suppose that your DB server is having trouble keeping up with all the demand for the “Hello” page.
As the DB server slows to a crawl, the “Hello” page takes longer and longer to render.
The kitten page would keep working quickly but, alas, visitors to the kitten-page are stuck in line behind the “Hello”-page visitors, and nobody is getting either “Hello”ed or kittened.

Kind of how an escalator that fails becomes stairs, your kitten-and-hello site, when it fails, should become just a kitten-showing site, instead of no site at all.
You can do that if you quickly turn away the “Hello” visitors when you realize that the DB server is having problems.
This can be accomplished through automation, called “circuit breaking”, in the DB layer; as a bonus, it might even help the DB layer automatically recover from transient spikes.

This pattern is often useful with dependencies that scale neither horizontally nor vertically.
For instance, suppose that a page on your site will offer visitors the ability to enter their phone number, and then recieve a “Hello, World” as a text message through Twillio.
Twillio becomes a dependency, but you can neither add more horizontal Twillio capacity, nor increase the size of Twillio’s machines then they’re overloaded.
In fact, the only way you know that Twillio is overloaded is when your own site is totally down – visitors can’t get a “Hello” page and they can’t get a kitten, because there are too many people waiting for Twillio API calls that never complete.
If you used a circuit breaker around calls to Twillio, then you might be able to quickly show those visitors an error message, while the other visitors continue getting “Hello” and kittens.

Coming full circle, caching can also be a form of load shedding.
You may be able to serve visitors a cached version of the page which is not strictly correct (for instance, the time on the "Hello" page is stale), but still more useful than an error page.

### Dependencies as bottlenecks ###

Life was easy for your awesome “Hello, World” site, so long as you could just horizontally scale it.
But, as soon as you began introducing dependencies – DB servers, Twillio APIs – things got a whole lot more annoying.
What’s clear is that any dependency ought to be treated with suspicion – these are what’ll getcha on big launch night.

In fact, only three things will break your site:
    
* You yourself, by accidentally breaking it. This usually happens through a deploy.
* Some malicious actors, by breaking it on purpose
* A non-horizontally-scalable dependency of your site, which breaks suddenly in response to increased traffic

If you want your site to stay up, you have to engineer around all three failure causes.
