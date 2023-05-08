
Recently, I wanted the ability to more reliably check email while on my phone.
So far, I had gotten by with [VX ConnectBot](http://connectbot.vx.sk/), which I would use to SSH into my phone and connect to my `tmux` session running `mutt`.
But I wanted to be able to check personal email while on the go without a laptop more often, and I wanted the ability to access attachments without having to forward them to my gmail address.

It turns out that setting up IMAP is easier than I thought, because the software is so good.
What's difficult is navigating the maze of confusing, overlapping email standards and options.
Here's how I did my setup, but YMMV.

## Migrate existing mail

I decided to run [Dovecot](https://www.dovecot.org/) as an IMAP server.
Dovecot has excellent documentation.
For instance, on their page about [MailLocation](http://wiki.dovecot.org/MailLocation), I learned that it is "not possible to mix maildir and mbox formats".

This was going to be a problem because I use [Maildir](http://www.qmail.org/man/man5/maildir.html) for my personal email folders, but [Postfix](http://www.postfix.org/), my SMTP server, delivers to an [mbox](https://en.wikipedia.org/wiki/Mbox) file as it's inbox.
I was going to need to standardize on one or the other.

I chose Maildir, IMHO a superior format that is more reliable without complicated locking.
Maildir seemed like the correct choice if I wanted to continue using `mutt` locally while also accessing those same emails via Dovecot remotely.
So, I began by using [mb2md](http://batleth.sapienti-sat.org/projects/mb2md/) to migrate all of my existing messages to a local Maildir.

I installed this program into `/usr/local/bin` by downloading it from the link above.

```bash
$ cd /usr/local/bin
$ wget http://batleth.sapienti-sat.org/projects/mb2md/mb2md-3.20.pl.gz
$ gunzip mb2md-3.20.pl.gz
$ chmod a+rx mb2md-3.20.pl
$ ln -s mb2md-3.20.pl mb2md.pl
```

I ran it like so:

```bash
igor47@purr:~/procmail $ mb2md.pl -s /var/mail/igor47 
Converting /var/mail/igor47 to maildir: /home/igor47/Maildir
Source Mbox is /var/mail/igor47
Target Maildir is /home/igor47/Maildir 
2766 messages.
```

Afterwards, I removed my pre-existing `mbox` inbox to prevent confusion:

```bash
$ echo > /var/mail/igor47
```

## Procmail to local Maildir

Next, I wanted to ensure that new mail would continue to be delivered to my Maildir folder.
I was already using [Procmail](https://wiki.archlinux.org/index.php/Procmail) to filter spam and other kinds of messages, but I didn't have a final fallback rule.
This meant that any mail not delivered to a specific location by Procmail would come back to Postfix, which delivered it to the `mbox` inbox.
To resolve the situation, I added a new catch-all rule to my `procmailrc`:

```bash
$ echo INCLUDERC=${PMDIR}/rc.final > ~/procmail/procmailrc
```

`rc.final` looks like so (my `procmailrc` sets `$MAILDIR` to `~/Maildir`):

```
:0:
$MAILDIR/new
```

As always, [this reference](http://www.zer0.org/procmail/quickref.html) is inestimably helpful to write these obscure Procmail filter rules.

## `mutt` uses new inbox

Now, mutt should be told where my mail is coming in.
I set the following variable in my .muttrc:

```
mailboxes ~/Maildir
```

Note that I am continuing to get an error (`/var/mail/igor47 is not a mailbox`) when I first open mutt, but it seems to cause no trouble after I open the correct inbox.

## SSL certs for mail

I used [Let's Encrypt](https://letsencrypt.org/) to get SSL certs for my mail server.
Because let's encrypt uses HTTP to authenticate that you really own the domain, I first needed my mail server (`mail.moomers.org`) to be accessible on an HTTP port.
I did this in Apache by making `mail.moomers.org` a [`ServerAlias`](https://httpd.apache.org/docs/2.4/mod/core.html#serveralias) for the [www.moomers.org](https://www.moomers.org) virtual host.

That done, I invoked Let's Encrypt like so:

```bash
$ letsencrypt certonly -a webroot -d mail.moomers.org -w /var/www/moomers.org/htdocs
```

Once the cert was acquired, I double-checked that automatic renewal works, too:

```bash
$ letsencrypt renew --dry-run
```

[This article was very helpful with helping to configure Dovecot/Postfix for SSL](https://ubuntu101.co.za/ssl/postfix-and-dovecot-on-ubuntu-with-a-lets-encrypt-ssl-certificate/).

## Configure Dovecot

I was ready to [install Dovecot](https://help.ubuntu.com/community/Dovecot):

```bash
$ aptitude install dovecot-imapd
```

I want system users to also be Dovecot users, but I didn't want passwords to be transmitted unencrypted over the web.
I modified `10-auth.conf` (all of the config files here are relative to `/etc/dovecot/conf.d`) like so:

```
disable_plaintext_auth = yes
auth_mechanisms = plain login
```

To enable SSL, I set these in `10-ssl.conf`:

```
ssl = yes
ssl_cert = </etc/letsencrypt/live/mail.moomers.org/fullchain.pem
ssl_key = </etc/letsencrypt/live/mail.moomers.org/privkey.pem
```

I wanted Postfix to SASL-auth against Dovecot (so, Dovecot users, who are system users, are also Postfix users).
I set this in `10-master.conf`:

```
  # Postfix smtp-auth
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
```

Finally, I wanted Dovecot to read my Maildir inbox.
I set this in `10-mail.conf`:

```
mail_location = maildir:~/Maildir
```

I was ready to start dovecot:

```bash
$ service dovecot restart
```

## Configure Postfix

We use [SASL](http://www.postfix.org/SASL_README.html) to allow postfix to authenticate users.
Given that we've already configured Dovecot, above, we can skip straight to [here](http://www.postfix.org/SASL_README.html#server_sasl_enable) in the Postfix documentation.
We also need to [enable TLS on postfix](http://www.postfix.org/TLS_README.html).

In the end, my config (the relevant parts) looks like this:

```
# Enable TLS using Let'sEncrypt certs:
smtpd_use_tls=yes
smtpd_tls_cert_file=/etc/letsencrypt/live/mail.moomers.org/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/mail.moomers.org/privkey.pem
smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache

# Disable Poodle
smtp_tls_security_level = may
smtpd_tls_security_level = may
smtp_tls_mandatory_protocols=!SSLv2,!SSLv3
smtpd_tls_mandatory_protocols=!SSLv2,!SSLv3
smtp_tls_protocols=!SSLv2,!SSLv3
smtpd_tls_protocols=!SSLv2,!SSLv3

# Changes to SSL Ciphers
tls_preempt_cipherlist = yes                                                                                                                                                                  smtpd_tls_mandatory_ciphers = high                   
tls_high_cipherlist = ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:DHE-DSS-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA256:ADH-AES256-GCM-SHA384:ADH-AES256-SHA256:ECDH-RSA-AES256-GCM-SHA384:ECDH-ECDSA-AES256-GCM-SHA384:ECDH-RSA-AES256-SHA384:ECDH-ECDSA-AES256-SHA384:AES256-GCM-SHA384:AES256-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:DHE-DSS-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-SHA256:DHE-DSS-AES128-SHA256:ADH-AES128-GCM-SHA256:ADH-AES128-SHA256:ECDH-RSA-AES128-GCM-SHA256:ECDH-ECDSA-AES128-GCM-SHA256:ECDH-RSA-AES128-SHA256:ECDH-ECDSA-AES128-SHA256:AES128-GCM-SHA256:AES128-SHA256:NULL-SHA256

# Enable SASL
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous, noplaintext
smtpd_sasl_tls_security_options = noanonymous
smtpd_tls_auth_only = yes

# Permit SASL-authenticated users to relay mail
smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
```

## Mail Client

First, I made sure that the Dovecot IMAP port (143) was accessible from the internet through the firewall on my server.
I didn't need to punch a hole for port 25, because it was already open to allow SMTP traffic from the internet.
I did notice, while testing, that my ISP (AT&T) blocks outbound port 25 from my local network.
I had to VPN out from my devices to test things, and will continue to need to do that to send email while my phone is on my local network.

To configure my mail client, I selected IMAP.
My user name is my local system unix account, and my password is my normal unix password.
Set up your client for incoming mail via IMAP on port 143, using TLS.
Outbound mail goes through port 25, via `STARTTLS`.
