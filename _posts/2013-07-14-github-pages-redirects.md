---
layout: post
title: Github pages: proxies and redirects
---

When I wanted to start a github pages blog, github was serving it's page requests on `<username>.github.com`.
These days, they service it on `<username>.github.io`, probably for security reasons (session cookies?).

Anyway, when I wanted my page to be at `igor.moomers.org`, my own domain name.
I also wanted the same thing under `igor.monksofcool.org`, which is another domain name that is also my OpenID.
So, I configured apache to just proxy my domains to the github page.
Here is my config:

```
   ProxyPass / http://igor47.github.com/
   ProxyPassReverse / http://igor47.github.com/
```

This change made my openid inaccessible.
I [had my openid settings in my head](https://github.com/igor47/igor47.github.com/commit/1b7b28605aa5b74e7f150e1a1a5e67f93b8d6138).
However, when I would sign in to my openid, [stackoverflow](http://stackoverflow.com/) would ask me if I wanted to create a new account for `igor47.github.io`.
In fact, I realized that even though I was proxying, I would get redirected to `github.io` in my browser.

Looks like the github web server only accepts requests on one hostname.
You can tell it's just one because they say so [here](https://help.github.com/articles/my-custom-domain-isn-t-working#multiple-domains-in-cname-file).
So, I figured I could fix my problem by setting a [custom cname page](https://help.github.com/articles/setting-up-a-custom-domain-with-pages).
I tried that, [here](https://github.com/igor47/igor47.github.com/commit/2d3ce308de32dd734d35633f32442db6759cec68).

This resulted in strange behavior.
Even going to `igor.monksofcool.org` in my browser resulted in an infinite 301 redirect loop to `igor.monksofcool.org`!

This finally made me realize what was happening.
I was proxying all requests to `github.com` and should have been using `github.io`.
Even requests to `igor.monksofcool.org` would go to `igor47.github.com`, which is NOT the domain name in my CNAME file.
Github would redirect away, and hitting that domain would again issue an improper sub-request.

To fix the problem, I removed my CNAME file and fixed my apache config to go to proxy to `github.io`.
Suddenly, everything was magically working again!
