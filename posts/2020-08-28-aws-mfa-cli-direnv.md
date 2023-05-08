---
layout: post
title: AWS MFA on the CLI with `direnv`
---

You might already be using multi-factor authentication (MFA) for logins to your AWS account.
This will cause AWS to prompt you for your MFA token when you log in via the web console.
However, if you use AWS via command-line tools (e.g., `terraform` or `aws s3`), you might have issued yourself access keys.
Those are single-factor, and if they leak, anyone on the internet can use them to do horrible things to your account.

We can make your admin AWS accounts safer by requiring MFA, even for API requests.
First, put your account, and the account of all other admins in your AWS account, in a group like `AdminMFA`.
This group should have a policy that looks like this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "*"
      ],
      "Resource": "*",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

## Direnv Config ##

Now, you'll need a mechanism to authenticate via your MFA token, get a session token, and put that session token into your environment.
I do this using [`direnv`](https://direnv.net/).
I've only recently learned about `direnv`, and I'm already using it, in combination with [`asdf`](https://asdf-vm.com/#/core-manage-asdf-vm), to replace [`rbenv`](https://github.com/rbenv/rbenv), [`pyenv`](https://github.com/pyenv/pyenv), and [`nodenv`](https://github.com/nodenv/nodenv).
`direnv` and `asdf` setup is beyond the scope of this post, but you can check out [my dotfiles repo](https://github.com/igor47/dotfiles) to get an idea of how I have it configured.

Here's my configuration in a `.envrc` file of a [terraform](https://www.terraform.io/) repo for a project hosted on AWS:

```bash
use asdf

export MASTER_AWS_ACCESS_KEY_ID=AKIA<redacted>
export MASTER_AWS_SECRET_ACCESS_KEY=<redacted>
export AWS_MFA_ARN=arn:aws:iam::<redacted>:mfa/igor
export AWS_SESSION_FILE="${HOME}/.config/aws/session-${MASTER_AWS_ACCESS_KEY_ID}"

watch_file $AWS_SESSION_FILE
direnv_load ~/bin/aws_load_session
```

This file causes 4 environment variables to be exported into my environment whenever I `cd` into this repo's directory.
The `MASTER_AWS_ACCESS_KEY_ID` and `MASTER_AWS_SECRET_ACCESS_KEY` are just the access key ID and key that I created for my account via IAM.
I've prefixed their usual environment variable names with `MASTER` to distinguish them from the session-specific keys created by authenticating with MFA.
The `AWS_MFA_ARN` variable contains the ID of my MFA token.
You can get this from [your security credentials page](https://console.aws.amazon.com/iam/home#/security_credentials), under the `Multi-factor authentication (MFA)` section.
Finally, the `AWS_SESSION_FILE` variable will keep track of where my MFA session is stored in my filesystem.

The next two lines handle reloading the MFA session.
I've told `direnv` to reload my local environment whenever the contents of the file at `$AWS_SESSION_FILE` change.
Next, we use `direnv_load` (from the [direnv stdlib](https://direnv.net/man/direnv-stdlib.1.html)) to load the environment exported by my `aws_load_session` script.

## Session-management Scripts ##

I have two custom scripts to manage the MFA session.
The first is `aws_get_session`, and it's responsible for prompting me for my MFA token, creating an MFA session, and storing it into the `AWS_SESSION_FILE`.
I run this script whenever my MFA session expires.
Here's the script:

```bash
#!/bin/bash

TOKEN=$1
shift

if [[ -z $TOKEN ]]; then
    echo "Usage: aws_get_session <mfa token value>"
    exit 1
fi

set -u

mkdir -p `dirname ${AWS_SESSION_FILE}`
unset AWS_SESSION_TOKEN

AWS_ACCESS_KEY_ID=${MASTER_AWS_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${MASTER_AWS_SECRET_ACCESS_KEY} aws sts get-session-token --serial-number $AWS_MFA_ARN --token-code ${TOKEN} > ~/.config/aws/session-${MASTER_AWS_ACCESS_KEY_ID} > ${AWS_SESSION_FILE}
echo "saved session info to ${AWS_SESSION_FILE}"
```

The other script, `aws_load_session`, loads the MFA session into my environment.
It's run by `direnv`, whenever the `AWS_SESSION_FILE` changes.
Here's the script:

```bash
#!/bin/bash

set -u

if [[ ! -f ${AWS_SESSION_FILE} ]]; then
  echo "No session found; did you run `aws_get_session <mfa token>` ?"
fi

export AWS_ACCESS_KEY_ID=`cat ${AWS_SESSION_FILE} | jq --raw-output .Credentials.AccessKeyId`
export AWS_SECRET_ACCESS_KEY=`cat ${AWS_SESSION_FILE} | jq --raw-output .Credentials.SecretAccessKey`
export AWS_SESSION_TOKEN=`cat ${AWS_SESSION_FILE} | jq --raw-output .Credentials.SessionToken`
direnv dump
```

Both of these scripts depend on having `aws` and `jq` installed and in your `PATH`.

## Example Session ##

Here's how this looks in real use, with a terraform repo that stores it's state in AWS S3.

```bash
igor47@fortress:~/repos/terraform/roots/prod {master} $ terraform plan

Error: error using credentials to get account ID: error calling sts:GetCallerIdentity: ExpiredToken: The security token included in the request is expired
	status code: 403, request id: abfd729b-4dad-41f4-857f-2539170f68a9


igor47@fortress:~/repos/terraform/roots/prod {master} $ aws_get_session 123456
saved session info to /home/igor47/.config/aws/session-AKIA<redacted>
direnv: loading ~/repos/terraform/.envrc
direnv: using asdf
direnv: loading ~/.asdf/installs/direnv/2.21.2/env/733966593-20565860-1008169379-2914714444
direnv: using asdf python 2.7.18
direnv: using asdf python 3.8.3
direnv: using asdf nodejs 12.13.1
direnv: using asdf ruby 2.7.1
direnv: using asdf direnv 2.21.2
direnv: using asdf terraform 0.12.29
direnv: export +AWS_ACCESS_KEY_ID +AWS_MFA_ARN +AWS_SECRET_ACCESS_KEY +AWS_SESSION_FILE +DD_API_KEY +DD_APP_KEY +MASTER_AWS_ACCESS_KEY_ID +MASTER_AWS_SECRET_ACCESS_KEY +NPM_CONFIG_PREFIX +RUBYLIB ~AWS_SESSION_TOKEN ~PATH

igor47@fortress:~/repos/terraform/roots/prod {master} $ terraform plan
Refreshing Terraform state in-memory prior to plan...
The refreshed state will be used to calculate this plan, but will not be
persisted to local or remote state storage.
```

Here, `terraform plan` fails because my MFA session has expired.
I re-run `aws_get_session` to update my `AWS_SESSION_FILE`.
`direnv` notices that the file has been updated, and reloads the environment.
I can then continue using `terraform` as normal.
As a bonus, in any other shell, the session will also be re-loaded automatically whenever I get a new prompt.
