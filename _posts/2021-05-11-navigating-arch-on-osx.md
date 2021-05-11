---
layout: post
title: x86_64 on an Apple M1 MacBook
---

I started a new job, and this job came with a new computer -- an Apple M1 MacBook.
I had to do quite a bit of work to get my usual dev environment set up, mostly having to do with the transition to the `amd64` architecture from `x86_64`.
Some tips and tricks are documented here.

## Two `homebrew`s

I found [this stack overflow question](https://stackoverflow.com/a/64951025/153995) invaluable.
On my computer, I had already run the normal homebrew install command:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This installed homebrow into `/opt/homebrew`.
To also add an x86_64 version of homebrew, I did:

```
cd /usr/local
sudo mkdir homebrew
sudo chown :staff homebrew
sudo chmod g+w homebrew
curl -L https://github.com/Homebrew/brew/tarball/master | tar xz --strip 1 -C homebrew
```

I then followed the stack overflow question, and added an alias to my `.bash_profile`:

```bash
alias brow='arch --x86_64 /usr/local/homebrew/bin/brew'
```

## Python with `asdf` / `pyenv`

Apparently, Python newer than 3.9.1 [natively supports arm64](https://github.com/pyenv/pyenv/issues/1768).
Alas, I needed Python 3.8.9, which is what my co-workers use:

```
$ asdf install python 3.8.9
python-build 3.8.9 /Users/igor47/.asdf/installs/python/3.8.9
python-build: use openssl@1.1 from homebrew
python-build: use readline from homebrew

<-- snip -->

BUILD FAILED (OS X 11.2.3 using python-build 1.2.27-29-gfd3c891d)

<-- snip -->

configure: error: Unexpected output of 'arch' on OSX
```

This still does not work if you explicitly specify an arch:

```
$ arch -x86_64 asdf install python 3.8.9
python-build 3.8.9 /Users/igor47/.asdf/installs/python/3.8.9
python-build: use openssl@1.1 from homebrew
python-build: use readline from homebrew

<-- snip -->

Installing Python-3.8.9...
python-build: use readline from homebrew
python-build: use zlib from xcode sdk
WARNING: The Python readline extension was not compiled. Missing the GNU readline lib?
ERROR: The Python ssl extension was not compiled. Missing the OpenSSL lib?

BUILD FAILED (OS X 11.2.3 using python-build 1.2.27-29-gfd3c891d)
```

You'll need to install the `x86_64` versions of readline and openssl to make progress!
The second install of brew to the rescue (notice, I'm using my alias, `brow` and not `brew`, below):

```
$ brow install readline
$ brow install openssl
$ brow install xz
```

Now, you need those libraries in your linker and compiler.
I figured I might need to do this again, so I am using my [direnv](https://github.com/asdf-community/asdf-direnv) setup to make this easier.
I created a directory -- `mkdir ~/x86_64` -- and added a `.envrc` that looks like this:

```
use asdf
export BROW="/usr/local/homebrew"
export LDFLAGS="-L${BROW}/opt/openssl@1.1/lib -L${BROW}/opt/readline/lib -L${BROW}/opt/xz/lib"
export CPPFLAGS="-I${BROW}/opt/openssl@1.1/include -I${BROW}/opt/readline/include -I${BROW}/opt/xz/include"
export PATH="${BROW}/bin:$PATH"
export ARCHPREFERENCE="x86_64"
```

A quick `direnv allow`, and now, when I `cd ~/x86_64`, I am in a good place to do Rosetta-type things:

```
$ uname -a
Darwin planetarium.local 20.3.0 Darwin Kernel Version 20.3.0: Thu Jan 21 00:06:51 PST 2021; root:xnu-7195.81.3~1/RELEASE_ARM64_T8101 arm64
$ cd ~/x86_64
direnv: loading ~/x86_64/.envrc
direnv: using asdf
direnv: loading ~/.asdf/installs/direnv/2.28.0/env/3601927912-4079855243-2014015008-304321844
direnv: using asdf rust 1.52.1
direnv: using asdf python 3.8.9
direnv: using asdf direnv 2.28.0
direnv: export +ARCHPREFERENCE +CARGO_HOME +CPPFLAGS +LDFLAGS +RUSTUP_HOME ~PATH
$ arch uname -a
Darwin planetarium.local 20.3.0 Darwin Kernel Version 20.3.0: Thu Jan 21 00:06:51 PST 2021; root:xnu-7195.81.3~1/RELEASE_ARM64_T8101 x86_64
```

Now, from this directory, I can easily install my Python.
I didn't have to specify `-x86_64` to `arch`, because this is already set by my `ARCHPREFERENCE`.

```
$ arch asdf install python 3.8.9
<-- snip -->
Installed Python-3.8.9 to /Users/igor47/.asdf/installs/python/3.8.9
```
