
I've been running a personal Linux server for just about ten years.
This makes me a [Gladwellian expert](http://gladwell.com/outliers/the-10000-hour-rule/) at the task!
One of the chores of running a personal server is backups.
Recently, I got access to a second machine with enough disk space to back up at least the most important files.
This documents how I set up [duplicity](http://duplicity.nongnu.org/) to regularly back up the data to the remote machine.

I was inspired by other guides, primarily [this one by Marc Gallet at zertrin](https://zertrin.org/how-to/installation-and-configuration-of-duplicity-for-encrypted-sftp-remote-backup/).
Marc offers a script which makes using `duplicity` easier, especially if you're backing up to S3.
I also found the [duplicity man(1) page](http://duplicity.nongnu.org/duplicity.1.html) a useful reference.
[This guide by Justin Ellingwood](https://www.digitalocean.com/community/tutorials/how-to-use-duplicity-with-gpg-to-securely-automate-backups-on-ubuntu) is also substantiatively similar.

My focus was on security on both ends.
I wanted to make sure that
1. Since the remote machine is untrusted, that machine cannot be used to read the content of the backups
2. The backup user cannot be used to get access to anything on the remote machine

(1) is ensured by using duplicity and pgp-encrypting the backups.
(2) is ensured by creating a very limited remote user which can only access the backup data.
I also create a local user dedicated to running backups, to encapsulate the configuration.
You can probably use `root` to run the backups, in which case you can skip the user and `sudo` configuration below.
But I don't like to keep too much configuration under the root user.

## Setting up users for secure communication

On the local machine, lets set up a user that will own the backup process.
Since I'm backing up the `moomers.org` server, I named the user `moobacker`.

    igor47@local:~$ sudo useradd -N -m -s /bin/false moobacker

I prevent the creation of any groups for the user (`-N`), cause `useradd` to create a home directory in `/home/moobacker` (via `-m`), and set the shell to `bin/false` (via `-s /bin/false`) to limit what this user can do.
Note that setting the login shell to `/bin/false` is not foolproof -- someone can still run `/bin/bash` as the user if they manage to log in, for instance.
However, we prevent any logins as this user by not setting a password (never running `sudo passwd moobacker`) and by not setting up an `.ssh/authorized_keys` file.
The only way to run commands as that user is via `sudo` or from cron.

We will need `moobacker` to have an ssh key to get into our remote server.

    igor47@local:~$ sudo -u moobacker ssh-keygen -t rsa
    igor47@local:~$ sudo cat /home/moobacker/.ssh/id_rsa.pub

Don't pick a passphrase for the key -- we won't be using it interactively.
I originally used the new elliptic-key type ssh key (via `-t ed25519`), but switched back to RSA after the Paramiko SSH implementation in `duplicity` had trouble with this key type.
We `cat` out the public component of the key we just created; we're going to need it shortly.

Next, we should set up a user on the remote machine who will own the backups.
I named the user `purrbackups` because I'm backing up a server called `purr`.
On the remote server, do the following:

    igor47@remote:~$ sudo useradd -N -m -s /bin/false purrbackups
    igor47@remote:~$ sudo -u purrbackups mkdir /home/purrbackups/.ssh
    igor47@remote:~$ echo 'from="<local-server-ip>" <public key> | sudo -u purrbackups tee /home/purrbackups/.ssh/authorized_keys

This will allow the `moobacker` user from the local server to log into the `purrbackups` account on the remote server.
Copy-pasta the actual SSH public key in place of `<public key>`.
Also, replace `<local-server-ip>` with the actual IP address of the source server.
The `from=` option in `authorized_keys` only allows this user to log in from that IP address for greater security, even if the SSH private key leaks out.

At this point, you should test the setup so far by trying to SSH from the local server to the remote server as the two new users we set up:

    igor47@local:~$ sudo -u moobacker ssh purrbackups@<remote>

After accepting the host keys, you should connect and then immediately get a `Connection closed` error.
Congratulations -- we got the two machines talking to each other!

We should still lock down the `purrbackups` user so it can only be used for sftp purposes.
To do this, lets edit the `/etc/ssh/sshd_config` file.
Find a line containing `Subsystem sftp` and make sure it is uncommented (no `#` at the beginning) and looks like this:

    Subsystem sftp internal-sftp

Then, at the end of the file, add a section like so:

```
Match User purrbackups
  ForceCommand internal-sftp
  ChrootDirectory /home/purrbackups
  AllowAgentForwarding no
  AllowTCPForwarding no
  X11Forwarding no
```

This will only allow the `purrbackups` user to use SFTP (for file-copying purposes), and will further only allow it access to it's own home directory.
Finally, set permissions on the `Chroot` directory, and add another directory for backup purposes:

    igor47@remote:~$ sudo chown root:root /home/purrbackups
    igor47@remote:~$ sudo chmod 755 /home/purrbackups
    igor47@remote:~$ sudo mkdir /home/purrbackups/backups
    igor47@remote:~$ sudo chown purbackups /home/purrbackups/backups

Now, test this config again via `sftp`:

    igor47@local:~$ sudo -u moobacker sftp purrbackups@<remote>

You should get an SFTP prompt.
Hooray!

## Allow local user to run backups

We want the backup user to be able to access files owned by other users on the system.
This means the backup user will need to run the backup program as root.
Lets set up a backup script for this purpose.

```bash
#!/bin/bash

whoami
```

Save this as `/home/moobacker/backup.sh`, and then set permissions appropriately:

    igor47@local:~$ sudo chown root:root /home/moobacker/backup.sh
    igor47@local:~$ sudo chmod 755 /home/moobacker/backup.sh

Next, lets allow the backup user to run this as root.
Use `visudo` to edit `/etc/sudoers.d/backups`:

    igor47@local:~$ sudo visudo /etc/sudoers.d/backups

The contents should be:

```
moobacker ALL = (root) NOPASSWD: /home/moobacker/backup.sh
```

This will allow the `moobacker` user to invoke the script as root.
Test it like so:

    igor47@local:~$ sudo -u moobacker sudo /home/moobacker/backup.sh

The output should be the word `root`

## Set up GPG key for `duplicity`

We will use this key to encrypt the backups.
Since the key will need to be distributed to other systems (so you can decrypt your backups in case you need them), set a passphrase on the private key.
You can pass this passphrase to the backup script when it runs.

    igor47@local:~$ sudo -H -u moobacker gpg --gen-key

Accept all the defaults.
You can pick some values for the name and email addresses.
The command will take a while to generate the entropy required for the keys -- you can run some random tasks in the meantime (like `aptitude update`).
Note the `-H` option to `sudo` -- we need this, otherwise `gpg` won't know where the home directory is and won't save the resulting keys.

Normally, private keys should remain on the system where they were generated.
In this case, you'll want to copy the private key to another system so you can decrypt your backups if necessary.
I used the `ccrypt` program to encrypt the backup with a symmetric key:

    igor47@local:~$ sudo -u moobacker tar -czf - /home/moobacker/.gnupg | ccencrypt > /tmp/moobacker.gnupg.tgz.cc

You can then distribute the file freely.
You'll need the passphrase to the `.cc` file containing the GPG private key, as well as the GPG key passphrase, to recover your backups.
If you don't have the `ccencrypt` binary, it can be had on most distros by installing the `ccrypt` package.

## Set up backups

Let's put all of the pieces together.
Remember the script we created earlier, in `/home/moobacker/backup.sh`?
Here's what the final version of mine looks like:

```bash
#!/bin/sh

set -o errexit
set -o nounset

encryption_key_id="DC3EEE04"
duplicity="duplicity --verbosity error --no-print-statistics --encrypt-key $encryption_key_id"
remote="sftp://purrbackups@remote/backups"

# back up /etc
$duplicity /etc ${remote}/etc

# back up /var
$duplicity /var ${remote}/var

# back up /home
$duplicity /mnt/raid/home ${remote}/home
```

The `encryption_key_id` can be gotten like so:

    igor47@local:~$ sudo -H -u moobacker gpg --list-keys

I picked the ID of the `sub` key, which is typically used for encryption.
For initial runs of the script, you might wish to use a more verbose output model, so you can see any errors:

```bash
duplicity="duplicity --encrypt-key $encryption_key_id"
```

Perform an initial run (or two) of the script:

    igor47@local:~$ sudo -H -u moobacker /home/moobacker/backup.sh

If this succeeds, it's time to add the script to a cron tab to run regularly.

    igor47@local:~$ sudo -H -u moobacker crontab -e

My `moobacker` user's crontab looks like this:

```crontab
MAILTO="admins@example.org"

# m h  dom mon dow   command
23 23 * * 0 sudo /home/moobacker/backup.sh
```

This will run backups at 23:23 every Sunday.
I expect the backup script to produce no output -- any output indicates errors.
The `MAILTO` setting will send any error output to me via email.
