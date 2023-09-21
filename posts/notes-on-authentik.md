---
title: Self-Hosted SSO with Authentik
date: 2023-09-15
slug: self-hosted-sso-authentik
description: |
  I finally set up single-signon for my self-hosted services with Authentik.
image: /images/bunch-of-keys.png
draft: true
---

Authentication is one of the weak points of self-hosted services.
It quickly becomes a pain to set up multiple accounts.
If you are a sysadmin for a bunch of services for your friends, managing logins and passwords is a constant chore.
I've been looking into self-hosted SSO providers like [authelia](https://www.authelia.com/), [keycloack](https://www.keycloak.org/) and [authentik](https://goauthentik.io/) for a while, but I finally got time to set it up.
Notes on configuration in this post.

## Running in Docker

I run all my services out of (several) `docker-compose` files.
For `authentik`, I added postgres, redis, and authentik HTTP and worker services.
The full yaml file is [in this repo](https://github.com/Moomers/purr.services/blob/main/docker-compose.yml).

A few notes on my approach:

* I keep all credentials in `env` files in a data dir for each service.
* I assume the postgres db will be multi-tenant.
  This means I initialize it with default credentials, and then add a migration for per-service creds.
  See [`install.sh`](https://github.com/Moomers/purr.services/blob/main/install.sh) and [`init_scripts`](https://github.com/Moomers/purr.services/tree/main/init_scripts) in the repo.
* I pre-emptively set the `routers.authentik.rule` to include a `PathPrefix` catch-all for [single-application mode](https://goauthentik.io/docs/providers/proxy/forward_auth).

I had to reload my `traefik` container because I added the `authentik` middleware in [`traefik.yml`](https://github.com/Moomers/purr.services/blob/main/config/traefik/traefik.yml).
After getting all the containers running, I went to the initial login flow at `/if/flow/initial-setup/` to get my admin account registered in the UI.

## Testing Auth

I added a `whoami` service for the purposes of testing authentication.
Here are the steps I took to get the service authenticated in the Authentik admin UI:

1. Create provider. I called mine `WhoAmI`, used the `implicit-consent` flow, used `Forward auth (single application)` and set `https://whoami.moomers.org` for my `External Host`.
2. Create application. I called mine `WhoAmI` and used the `WhoAmI` provider.
3. Add the application to the `authentik Embedded Outpost`.

Now, when I go to my `whoami` service, I am prompted for authentication via Authentik.

## Fixing the Login Flow

By default, the login flow does not include a password reset option, and also asks for a password on a second page.
The whole flows/stages thing is not really well-documented in Authentik, so I relied on [this youtube video](https://www.youtube.com/watch?v=NKJkYz0BIlA) for these instructions:

* Under `Policies` I created a new password policy with a minimum length + some other things.
* Under `Stages`, create an `Identification Stage` called `recovery-auth-ident` with the `Username` and `Email` fields available
* Under `Stages`, crate an `Email Stage` called `recovery-email` using the `Password Reset` template. I set some sane value for `Subject`.
* Under `Flows` I selected the `initial-setup` flow and deleted it (I don't need it anymore!).
* Under `Flows`, I created a flow called `Recovery`, with a nice `Title` and slug also set to `recovery`. The `Designation` should be `Recovery`.
* Click on the new `recovery` flow and go to it's `Stage Bindings`. I bound my `recovery-auth-ident` stage with `Order` set to `0`, then my `recovery-email` stage with `Order: 10`, then `default-password-change-prompt` with `20`, and finally `default-password-change-write` with `30`.
* Edit the `default-password-change-prompt` stage and add your password policy under the `Validation Policies`.
* Under `Flows`, click `default-authentication-flow` and go to `Stage Bindings`. There, under `default-authentication-identification`, add `default-authentication-password` under the `Password Stage` to allow entering the password on the same page as the username in the login flow. Then, under `Flow Settings` for that stage, add your new `recovery` flow under `Recovery flow`.
* Select the `default-authentication-password` stage and delete it, since we now prompt for the password on the first page.

Test this in a private browser window by trying to reset your password.

## Self-service

I would like users to be able to self-enroll.
I followed another [youtube video from the same person](https://www.youtube.com/watch?v=mGOTpRfulfQ).
Instructions:

* Under `Groups` create a `Users` group.
* Create an `Email Stage` called `email-account-confirmation` with a sensible `Subject` and using the `Account Confirmation` template.
* Create a new flow called `self-service-enrollment`. Use `Designation: enrollment` and configure other fields with sensible values. I also turned on `Compatability Mode` under `Behavior Settings`.
* Bind a `default-source-enrollment-prompt` stage to this flow, with `Order: 10`.
* Edit this stage; I included the `username`, `name`, `email`, `password`, and `password-repeat` fields, and also added my `Password Complexity` policy.
* Bind a `default-source-enrollment-write` stage with `Order: 20`
* Edit this stage; set the `Group` to your new `Users` group, and make sure `Create users as inactive` is set. I also picked `Create users when required`.
* Bind your `email-account-confirmation` stage with `Order: 30`
* Under `Flows`, click `default-authentication-flow` and go to `Stage Bindings`. Edit the  `default-authentication-identification` stage and, under `Flow Settings`, add your new `self-service-enrollment` flow under `Enrollment flow`.

