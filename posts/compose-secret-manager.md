---
title: Docker Compose Secrets Manager
date: 2023-12-15
slug: secrets-in-docker-compose
description: |
  A service and an approach for managing secrets in docker compose repos.
image: /images/whales-with-secrets.png
---

TL;Dr: store your secrets in `git` alongside your `compose.yml` file.
My new service, [`dcsm`](https://github.com/igor47/dcsm), decrypts the secrets and templates them into your config files.

## Primer on `docker compose` Repos

Lately, there is a thriving ecosystem for running self-hosted services using `docker`.
Packaging services with docker means abstracting away the complexities of configuring a local environment.
Updates are consistent across services.
Plus, there are lots of utilities to make life easier.
For instance, [`traefik`](https://traefik.io/) will automatically terminate SSL and reverse-proxy to your service -- no more manual certificate management.
As a result, I am running increasingly more services using `docker compose` files.

I consider each `compose.yml` file to define a "cluster" of services which are logically grouped.
For instance, I have a media cluster which handles movie ([jellyfin](https://jellyfin.org/)), music ([navidrome](https://www.navidrome.org/)), book ([calibre-web](https://github.com/janeczku/calibre-web)), and audiobook ([audiobookshelf](https://www.audiobookshelf.org/)) hosting services.

I keep each cluster in it's own git repo.
The repo includes the `compose.yml` file and also the configuration for all the services in that file.
Many services do not need any configuration beyond what is in the [`environment` key](https://docs.docker.com/compose/compose-file/compose-file-v3/#environment) of the `compose.yml`.
Often, though, a config file is needed, or is a more ergonomic way to specify the configuration.
For instance, all my clusters have a `config/traefik/traefik.yml` file to configure `traefik`.
I then bind-mount the config files into the container filesystem:

```yaml
volumes:
  - ./config/traefik:/etc/traefik
```

## How to Manage Secrets?

Suppose I needed a credential inside that config file?
Before writing [`dcsm`](https://github.com/igor47/dcsm), I was at the mercy of the service author.
For instance, every piece of `grafana`'s configuration [can be overridden with environment variables](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#override-configuration-with-environment-variables).
So, I could check a `grafana.ini` file into the repo with most of my config.
Then, to add a secret (e.g., an OpenID-Connect client id/secret pair), I would:

1. create a `grafana/environment` file containing just the overriden secret keys
1. add the file to `compose.yml` under `env_file`:

```yaml
grafana:
  env_file:
    - path/to/grafana/environment
```

This is confusing -- now the configuration is split between several places.
Also, the `grafana/environment` file could not be checked into the repo.
It's management becomes out-of-band -- as a DevOps practitioner, I don't like that.

And grafana is one of the better services here.
Lots of services require using a config file.
Sometimes, you can extract just the secret-containing part of the config, and manage *that* out-of-band.
But, for example, [`synapse`](https://matrix-org.github.io/synapse/latest/usage/configuration/config_documentation.html) requries a bunch of secrets in a common config file, there's no mechanism for including environment variables in the config, and no mechanism for including sub-files.
Now, your entire config file cannot be checked into the repo.

## DCSM

[`dcsm`](https://github.com/igor47/dcsm) is a simple service containing some python code and [`age`](https://age-encryption.org/) for symmetric-key encryption.
To use DCSM, you add it to your `compose.yml`:

```yaml
  dcsm:
    build: .
    environment:
      - DCSM_KEYFILE=/example/key.private
      - DCSM_SECRETS_FILE=/example/secrets.encrypted
      - DCSM_SOURCE_FILE=/example/secrets.yaml
      - DCSM_TEMPLATE_DIR=/example/templates
    volumes:
      - ./example:/example
```

The variables `DCSM_KEYFILE` and `DCSM_SECRETS_FILE` are required for basic operation.
You may optionally set `DCSM_SOURCE_FILE` to tell `dcsm` about your unencrypted secrets source.
This allows you to use the `encrypt` and `decrypt` commands, though you can also perform those operations by running `age` locally.

Your secrets source is a `yaml` file containing your secrets.
For example:

```yaml
GRAFANA_OAUTH_CLIENT_ID: this_is_secret
GRAFANA_OAUTH_CLIENT_SECRET: "this is also a secret"
```

This file, along with your `DCSM_KEYFILE`, should be `.git-ignore`ed from your repo
The keyfile must be copied out-of-band between your dev environment and your cluster runtime machine.

You may set any number of directories with the environment variable prefix `DCSM_TEMPLATE_`.
In these directories, `dcsm` will find files ending with `.template` and replace template strings with secrets from your encrypted `DCSM_SECRETS_FILE`.
For example, here is that grafana config file:

```ini
[auth.generic_oauth]
enabled = true
client_id = $DCSM{GRAFANA_OAUTH_CLIENT_ID}
client_secret = $DCSM{GRAFANA_OAUTH_CLIENT_SECRET}
scopes = openid profile email
```

This approach enables you to keep your cluster repo consistent.
You can easily refer to a secret in multiple places.
Finally -- if you need to pass secrets as environment variables, you can just template an `env_file`.
For instance, your template could be:

```bash
GF_AUTH_GENERIC_OAUTH_CLIENT_ID=$DCSM{GRAFANA_OAUTH_CLIENT_ID}
GF_AUTH_GENERIC_OAUTH_CLIENT_SECRET=$DCSM{GRAFANA_OAUTH_CLIENT_SECRET}
```

If you store this file in your repo at `config/grafana/oauth.env.template`, then you could use it like so:

```yaml
services:
  dcsm:
    image: ghcr.io/igor47/dcsm:v0.3.0
    environment:
      - DCSM_KEYFILE=/secrets/key.private
      - DCSM_SECRETS_FILE=/secrets/secrets.encrypted
      - DCSM_SOURCE_FILE=/secrets/secrets.yaml
      - DCSM_TEMPLATE_DIR=/config
    volumes:
      - ./secrets:/secrets
      - ./config:/config

  grafana:
    image: grafana/grafana-enterprise
    restart: unless-stopped
    depends_on:
      dcsm:
        condition: service_completed_successfully
    env_file:
      - ./config/grafana/oauth.env
```

You can see that `grafana` has a `depends_on` the success of `dcsm`.
This allows `dcsm` to run first and template your config files with your secrets.
By the time the `grafana` service starts, the config files are ready for action!

## That's It

I wrote this tool to meet my own need, but I hope others will find it useful as well.
I think managing clusters via a configuration-as-code/infrastructure-as-code repo works pretty well.
Secret management was the missing piece -- but, with [`dcsm`](https://github.com/igor47/dcsm), no longer.
