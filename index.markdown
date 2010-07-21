---
layout: default
title: Sirupsen and his codeabouts
---

# Hello World

I'm a [Tweeter](http://twitter.com/Sirupsen), [blogger](http://blog.sirupsen.com), <span class="pink">rubyist</span>, <span class="simplicity">minimalist</span>, student and [developer](http://github.com/Sirupsen).

Primarily I do <span class="pink">Ruby</span>, in which I hack together my (sometimes) crazy ideas, some never reach out - others end up at [Github](http://github.com/Sirupsen)

I work at [The Hybrid Group](http://hybridgroup.com/) where I work with a bunch of awesome people to build amazing things. Some [open-source ones](http://github.com/hybridgroup), too!

## Blog Posts

<ul class="posts">
  {% for post in site.posts %}
    <li>{{ post.date | date_to_string }} » <a href="{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

<p class="gray">Reach me at <a href="mailto:sirup@sirupsen.com">sirup@sirupsen.com</a></p>
