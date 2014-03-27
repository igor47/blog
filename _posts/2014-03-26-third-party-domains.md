---
layout: post
title: Third-party domain delegation considered harmful
---

Your public domain name is the name that your users use to access your site.
For instance, if you're google, your public domain name is [`google.com`](https://www.google.com).
For Airbnb, it would be [`airbnb.com`](https://www.airbnb.com).

## Delegation ##

Usually, when a user initiates a request for something under your domain name, one of your own servers will respond.
However, this is not always the case.
For instance, you may be using a bulk email provider like [sendgrid](https://www.sendgrid.com) to send email.
In that case, you might want to point `email.yourdomain.com` to sendgrid's servers.
Another example might be your blog, under `blog.yourdomain.com`, which is actually operated by [wpengine](https://wpengine.com).

There are typically two ways to do such delegation.
By far the most common is [DNS](https://en.wikipedia.org/wiki/Domain_Name_System)-based.
You simply edit the DNS entry for `thirdparty.yourmain.com` to resolve to an [ip address](https://en.wikipedia.org/wiki/IP_address) for a server operated by the third party.

In the age of proxying web servers like [nginx](http://nginx.org/en/), another way has emerged to do delegation.
The domain name in question can point to your server, but it can then simply be proxied to the third party.
If you're reading this blog post at the domain [igor.moomers.org](http://igor.moomers.org), you are actually an end-user of such delegation.
The content you're reading actually comes from [igor47.github.io](http://igor47.github.io/).

## Delegation considered harmful ##

There are many reasons why it is a bad idea to do the kind of delegation mentioned above.
This is mostly for security reasons, but might also cause usability issues.

Lets talk about each of the issues in turn.
I will use the example website at `yourdomain.com` with a third-party delegation to a blog provider at `blog.yourdomain.com`.

### Session Leakage ###

If you provide your users with a session cookie, anyone who has this cookie can trivially impersonate the user.
It is very common to serve traffic under `www.yourdomain.com` but set a session cookie for `*.yourdomain.com`.
When your users read your blog, at `blog.yourdomain.com`, the blog provider will get a copy of all of your session cookies.

An attacker that compromises the systems of the blog provider can now steal the identities of all of your users who have visited your blog.
The blog provider is an attractive target, because all the sites that use this provider can be simultaneously compromised.

This attack can be mitigated by setting your cookies to specific subdomains, but this may not be possible if you operate on several subdomains.
This can also be mitigated by serving your production traffic on `https` only and setting your cookies' `secure` flag.
Then, your user's browser will not send the cookies to your blog provider.
Obviously, in this case you should NEVER give your blog provider an SSL certificate covering that subdomain.

### Script Injection ###

Rather than stealing your user's session, attackers an force your users to perform actions on your site via the third-party site.
For instance, suppose that `blog.yourdomain.com` does not properly sanitize javascript in your blog's comments.
This is the equivalent of your own site allowing [javascript injection](https://en.wikipedia.org/wiki/Cross-site_scripting).
An attacker putting malicious javascript into the blog comments will force your users to perform actions on your main site.

### Session Clobbering/Cookie Fixation ###

If your blog provider happens to set the same cookies as you do, you will log out your user or ruin your tracking or analytics.
For instance, if both you and your blog provider use google analytics, you will both be attempting to set the various `_utm*` cookies.

The name collision can cause usability problems for your users.
However, this is also a potential security vulnerability given vulnerable browsers.
An attacker who can set cookies on your domain can set a sensitive cookie to a value he controls and then force you to make that value valid.
[Here is a description](http://homakov.blogspot.com/2013/03/hacking-github-with-webkit.html) of such an attack on Github.

### Personal Data Leakage (PII) ###

You might be leaking other data than your session cookies via additional cookies, such as tracking cookies.
For instance, your [mixpanel](https://mixpanel.com) cookie might contain a bunch of attributes you want to track about your user.
Even if you're diligent about setting proper settings on your session cookies, your mixpanel cookie is likely clear-text.
This means that your blog provider now has a large [PII](https://en.wikipedia.org/wiki/Personally_identifiable_information) dataset on your users.
This could get you into trouble if the blog operator experiences a breech of their log data.

### Social Engineering & Reputation ###

Users assume that content under `yourdomain.com` comes from you.
By gaining access to your delegated domains, an attacker can convince users to simply give you their passwords or other information.
Additionally, you can gain a poor reputation if your delegated domains are defaced or simply contain negative content.
The internet will assume that you endorse that content.

## Workarounds ##

You could try to be very diligent about your security settings, and "do it right" with domain delegation.
However, there are many ways for you to fail here.
The best approach is to avoid delegating domains in the first place.
You should control all of the content that is served at `yourdomain.com` and it's subdomains, and sanitize any user-generated content there.

### Separate top-level domain ###

Typically, for sites operated by third parties, you would use a separate top-level domain.
For instance, when [github](https://github.com) first launched [github pages](http://pages.github.com/), they were hosted under the main `github.com` domain.
However, github quickly [moved this content to it's own top-level domain](https://github.com/blog/1452-new-github-pages-domain-github-io) at `github.io`.
Similarly, google began [hosting user-generated content at \*.googleusercontent.com](http://googleonlinesecurity.blogspot.com/2012/08/content-hosting-for-modern-web.html).

### Avoiding Migrations ###

It may be tempting to just use a single domain for all of your content initially.
However, my experience is that it is much more difficult to migrate than to make the right choice from the beginning.
You will not want to move `blog.yourdomain.com` to `blog.yourdomain.io` later on.
So, if you're just starting out, don't go down the wrong path -- resist the temptation to delegate!
