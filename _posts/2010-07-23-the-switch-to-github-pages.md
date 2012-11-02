---
layout: post
title: The switch to Github Pages
updated_at: Nov 2012
---

<div class="intro">I recently ditched my VPS to migrate my blog to Github
Pages. Which is an incredibly simple platform to host a hacker's blog.</div>

Until recently I'd never owned a server. I hosted my previous Wordpress blog on
my dad's server. This limited me in terms of technological mobility. The lack of
free deployment methods kept me from using languages other than PHP.

A few months ago, I decided to rent a VPS. I looked at [low end box][low-end]
for a light option, since a personal blog like this requires minimal power.
Although I wanted to retain enough power to stand a slashdot as when I published
[What I wish a Ruby programmer had told me one year ago][wish], requiring juice
which isn't needed the majority of the time. Adding a caching layer to avoid the
dynamic web server layer seemed like a redundant move.

Pretty soon I had to switch VPS host due to latency issues, and realized it
might not be such a bad idea to have my blog hosted externally to be
independent. My blog was mostly static anyway: All blog posts I wrote in
[Markdown][markdown] in Vim, no comment system or any dynamic interaction with
the site.

I looked into [Github Pages][pages], which runs [Jekyll][jekyll] allowing you to
host a static blog in a more sophisticated way, supporting the mandatory things
for a hacker's blog such as code highlighting and some automation in terms of
the blogging. It's super easy to set up, and you deploy just by pushing to your
Github repo with the name "<username>.github.com", i.e. I push to the repo at
[Sirupsen/sirupsen.github.com][source].
Here's a little guide to [migrate your blog from other blogging
systems][migrate].

I've since cancelled my VPS, since I no longer have the need. I don't need to
worry about caching or uptime. It all just works. You're welcome to [fork my
blog][source] to create your own.

[lowendbox]: http://www.lowendbox.com/
[pages]: http://pages.github.com
[jekyll]: http://github.com/mojombo/jekyll
[markdown]: http://daringfireball.net/projects/markdown/
[source]: https://github.com/Sirupsen/sirupsen.github.com
[liquid]: http://www.liquidmarkup.org/
[wish]: /what-I-wish-a-ruby-programmer-had-told-me-one-year-ago/
[migrate]: http://wiki.github.com/mojombo/jekyll/blog-migrations
