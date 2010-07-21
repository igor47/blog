---
layout: default
title: Sirupsen and his codeabouts
---

# Hello World

I'm a [tweeter](http://twitter.com/Sirupsen), [blogger](http://blog.sirupsen.com), <span class="red">rubyist</span>, <span class="simplicity">minimalist</span>, <span class="red">dane</span>, student and [developer](http://github.com/Sirupsen).

Primarily, I do <span class="red">Ruby</span>, in which I hack together my own (and others) crazy ideas, some of these end up at [Github](http://github.com/Sirupsen).

I work at [The Hybrid Group](http://hybridgroup.com/) where I build amazing things with a bunch of awesome people. Some [open-source things](http://github.com/hybridgroup), too!

## Blog Posts

<ul class="posts">
  {% for post in site.posts %}
    <li><span class="date">{{ post.date | date_to_string }}</span> <span class="red">»</span> <a href="{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

<p class="gray">Reach me at <a href="mailto:sirup@sirupsen.com">sirup@sirupsen.com</a></p>
