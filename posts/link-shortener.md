---
title: "A self-hosted URL shortener in Rust"
date: 2023-08-30
slug: self-hosted-link-shortener
description: |
  I wrote a self-hosted link shortener!
image: /images/rusty-scissors.png
---

I embarked on a yak shave so epic, it resulted in me writing an entire URL shortening service in rust.
I'm calling it `smrs` (get it? "`sm`all and in `r`u`s`t!), and [here is the github repo for it](https://github.com/igor47/smrs).
It's hosted publically, but I don't want to share the link because, from a few minutes of casual reading online, it looks like URL shorteners are frequently abused (see below).

## For the love of God, why?

The yak shave is that I want to write some microcontroller code, and as I don't really remember any `C`, I figured I'd better just learn embedded `Rust`.
I cracked open [the embedded Rust book](https://docs.rust-embedded.org/book/), and immediately came across:

> You are comfortable using the Rust Programming Language, and have written, run, and debugged Rust applications on a desktop environment. 

I was like, "Nope, I am not", and proceeded to the [general-purpose Rust book](https://rust-book.cs.brown.edu/) (I've been reading the Brown-hosted version because I want to take the little embedded quizzes).
The book is *really* good, but there's too much reading in between the practical sections, and [I learn by doing](https://psycnet.apa.org/fulltext/2014-55719-001.pdf).
So I resuscitated a previous idea of hosting my own link shortener, and here we are.

## Choices

This project has a really odd mix of new and old technology.
The modern approach is to run the project as a single binary which includes an embedded web server.
The binary is responsible for serving any static files, and also for generating the dynamic responses.

This seemed like too much work, and using an existing web server crate seemed like **too little** work.
So, I am running the service behind Apache and using good-old [CGI](https://en.wikipedia.org/wiki/Common_Gateway_Interface) for the dynamic content.
Remember CGI?
Instead of your application code running as a long-lived process, it's invoked by the web server for each request.
The details of the request are placed in the environment, and whatever is written to `stdout` is sent back to the client as the HTTP response.
It's probably slower than having the process already running (`fork` and `exec` are slow!), but it lets the program be really simple.

For storage, I looked at a bunch of options (like `sled` or `leveldb`) but ended up with good-old `sqlite`.

Also, I'm probably doing a non-conventional thing with sessions.
I didn't want to implement logins, plus probably for lots of things you don't even care about user-level persistence.
But I figured it might be nice, and instead just exposed the user's session ID for them to see.
If they want to return to the site later and see their short links, they can just "log in" with their session ID.

For the front-end, I wanted it to be as lightweight as possible.
I immediately discovered that I need to either have multiple pages, or write an SPA.
But for multiple pages, how do I share common elements like a header/footer?

This is where I learned about Apache's [SSI](https://httpd.apache.org/docs/2.4/howto/ssi.html) (server-side includes).
I factored my header out into a separate file, and was able to include it in each page with a simple `<!--#include virtual="/header.html" -->`.

I still had some javascript to write, and I attempted to just use plain JS with no libraries.
But then I discovered [Alpine.js](https://alpinejs.dev/), which is just **so** lightweight and easy to use.
For CSS, I used [Skeleton](http://getskeleton.com/) but I'm not super-excited about it.
This is because it doesn't have a responsive grid system -- once something is, say, 6 columns, it's **always** 6 columns.
I'm probably going to migrate this to [Bluma](https://bulma.io/) at some point to fix appearance on intermediate-size screens.

## Deploying

I run my self-hosted services via `docker-compose` on my server, and it was really easy to add this one.
I set up [my `Dockerfile`](https://github.com/igor47/smrs/blob/master/Dockerfile) for multi-stage builds -- my `dev` target just contains configured Apache.
I bind-mount my `htdocs` into the container, and iterating on the rust code means building it locally and copying into the container filesystem.

For production, my final stage builds the release version of the code and generates a container with the `htdocs` baked in.
I have this container built and tagged via [Github Actions](https://github.com/igor47/smrs/blob/master/.github/workflows/publish.yaml).
Then, in my `docker-compose`, I can just pull the image from `ghcr.io`.

I ran into trouble because I'm hosting this behind a Cloudflare proxy, and so `traefik` couldn't get an SSL certificate for it.
I had to add a custom `traefik` config for validating SSL via modifying Cloudflare DNS:

```yaml
  # for zones behind cloudflare proxied DNS, we use the cloudflare dns provider
  # see:
  #   https://www.techaddressed.com/tutorials/certbot-cloudflare-reverse-proxy/
  # this relies on credentials in a file on purr. see the `env_file` directive in
  # docker-compose for traefik
  cf:
    acme:
      email: admins@example.org
      storage: /acme/acme-cf.json
      dnsChallenge:
        provider: "cloudflare"
```

I then had to generate a Cloudflare API token with the `Zone.DNS` permission.
I stored that in a file on my server, and then added it to my `docker-compose` via the `env_file` directive:

```yaml
    env_file:
      - ${STORAGE}/traefik/cloudflare.env
```

## Link Shortener Criticism

There's a whole section on [Awesome Self-Hosted](https://awesome-selfhosted.net/index.html) for [URL shorteners](https://awesome-selfhosted.net/tags/url-shorteners.html).
This is where I came across [this Wikipedia section](https://en.wikipedia.org/wiki/URL_shortening#Shortcomings) which lists a bunch of criticisms of URL shorteners.
In fact, a bunch of the shorteners in the Awesome list have a publically-hosted instance, but every one of those seems dead.
Others explicitly say they had to put their public version behind a password or login because of abuse -- for instance, [liteshort](https://git.ikl.sh/132ikl/liteshort) says about their live demo:

> (Unfortunately, I had to restrict creation of shortlinks due to malicious use by bad actors, but you can still see the interface.)

I put mine behind Cloudflare, but I'm still seeing a bunch of nonsense (like wordpress hack attempts) in the request logs.
So, I'm keeping the link a "secret" for now.
I might add a password system to create new links if I see a bunch of abuse.

