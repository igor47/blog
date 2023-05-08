---
layout: post
title: Recovering OpenID
---

I recently became locked out of [my StackOverflow account](https://stackoverflow.com/users/153995/igor-serebryany).
This was because, back in the day when I first created the account, I set it up to authenticate via OpenId.
However, I never ran my own OpenId provider, which seemed like a huge hassle.
Instead, I started out delegating to an OpenID provider called `MyOpenid`.
This worked for a while, but eventually this provider went out of business.
I then delegated to google, which actually acted as an openid provider for a little while.
However, it seems like in the past few years google also stopped providing any sort of OpenId services.

I had a long-lived session with StackOverflow, but at some point it expired.
So, unable to log in, I found myself using StackOverflow a lot less.
Several times, I had urges to add an answer to a question, or to post my own question/answer pair on some obscure issue, but I would just skip it because I was logged out.

I finally decided to recover my access to my account.
I did it using [local-openid](https://bogomips.org/local-openid/).
Here's how!

1. Install local-openid -- I just did `gem install local-openid`.

2. Start the local-openid server.
  I just ran `local-openid`, which booted up a WEBRick server on port 4567.

3. Forward traffic to the local-openid server from apache.
  I did this in my `<VirtualHost>` section:

   ```apacheconf
   ProxyPass / http://localhost:4567/
   ProxyPassReverse / http://localhost:4567/
   RewriteEngine on
   RewriteCond %{HTTP:Authorization} !^$
   RewriteCond %{QUERY_STRING} openid.mode=authorize
   RewriteCond %{QUERY_STRING} !auth=
   RewriteCond %{REQUEST_METHOD} =GET
   RewriteRule (.*) %{REQUEST_URI}?%{QUERY_STRING}&auth=%{HTTP:Authorization} [L]
   ```
  I made sure that this was the only ProxyPass directive that was uncommented, and then ran `apache2ctl restart`.

4. Attempt to log in via my OpenID at StackOverflow.
  This caused some output like so to be printed out from the running server:

   ```
   localhost - - [23/Apr/2016:19:59:48 CDT] "GET /xrds HTTP/1.1" 200 567
   - -> /xrds
   Not allowed: 172.5.245.84
   You need to put this IP in the 'allowed_ips' array in:
    /home/igor47/.local-openid/config.yml
   ```

5. Edit my `~/.local-openid/config.yml` file.
  This file had an `allowed_ips` section into which I added the IP address that was making requests.
  I also saw a section like so:

   ```yaml
   https://stackoverflow.com/users/authenticate/:
     assoc_handle:
     updated: 2016-04-24 01:01:39.873137626 Z
     expires: 1970-01-01 00:00:00.000000000 Z
     session_id: 1461459588.9306.0.1628395514528984
     expires1m: 2016-04-24 01:02:39.873137626 Z
   ```
  I removed the `expires` key and renamed the `expires1m` key to `expires`.

6. Reload the auth page in the browser. Viola! I was logged in!

Hopefully this helps you if you also lost access to some old OpenId account and would like to regain access.
