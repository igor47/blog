---
layout: post
title: Mailman Behind HTTPS
---

When [Let's Encrypt](https://letsencrypt.org/) became available, I moved most of the vHosts I run on this web server behind HTTPS.
This included my [Mailman](http://www.list.org/) web interface.
However, this broke the admin interface for my mailing lists.
Even though I changed the `DEFAULT_URL_PATTERN` in `/etc/mailman/mm_cfg.py` to `'https://%s/'`, the submit button on the admin interface still took me to `http://mailman.moomers.org`.

I spent way too long debugging this, which is why I'm writing this post.
It turns out that the `InitVars()` function in `MailList.py` is only called once, when the list is created, and the resulting information is stored in the `config.pck` file for the list.
Because I created the lists over HTTP, back in the day, the url in `config.pck` was still `http://mailman.moomers.org` for all my old lists.

To fix this problem, I first wrote the correct url to a file:

```bash
echo "web_page_url = 'https://mailman.moomers.org/'" > /tmp/newurl
```

I then ran the following little bash script to fix all my lists:

```bash
for i in $(list_lists -b); do config_list -i /tmp/newurl -v $i; done
```

Hopefully, if you're having the same problem as me (mailman's admin page still submits to HTTP instead of HTTPS), you might come across this page and save yourself some trouble!
