---
title: Local tunnel using SSH and traefik
date: 2026-03-18
slug: basic-tunnel
description: |
  Expose your local dev services to the public internet via this basic SSH tunnel and traefik.
image: /images/basic-sweet-ass-tunnel.jpg
---

I occasionally need to allow some external service to interact with code that's running on my laptop.
A few recent examples included building a UI in [Retool](https://retool.com/) against a local API and allowing webhooks from [Resend](https://resend.com) to hit my dev server.
I've used [ngrok](https://ngrok.com/) and [localtunnel](https://localtunnel.github.io/www/) for this, but I've always wanted my own, self-hosted version.

Popular options for self-hosting a tunnel service include [Pangolin](https://docs.pangolin.net/) and [frp](https://github.com/fatedier/frp).
I recently saw [rustunnel](https://github.com/joaoh82/rustunnel) on [HN](https://news.ycombinator.com/item?id=47425918), and the discussion pointed me to [this giant list of other alternatives](https://github.com/anderspitman/awesome-tunneling).

All of these solutions tend to be pretty heavy-weight, because creating dynamic tunnels is actually pretty difficult.
You can use wildcard DNS to point `*.tunnel.example.com` to your service, but getting a wildcard cert from LE requires a DNS-based challenge.
This means your DNS must be hosted at some dynamic provider like Cloudflare, and you must give your tunnel service some sort of DNS provider API access and credentials.
Pangolin supports provisioning named (non-wildcard) SSL certs at tunnel creation time, but this involves some lag for the tunnel to spin up.

If you're a small-time dev with only an occasional need, you might be happy to just have a static tunnel name, like `mytunnel.example.com`.
A static name also has a security benefit -- with dynamic tunnels, if you release a name that still has webhooks pointed at it, the next person to claim it could receive your traffic.
Here's an approach I use, which works well for me because I already run a `docker compose` stack with an instance of `traefik` in it.

## Simple Tunnel

Here's a step-by-step guide for setting up your simple private tunnel.
I'm going to give some TL;DR steps, followed by an explanation of what's happening if you're curious.
This setup is meant to run on a machine which has a public IP address and is already configured to send HTTP/s traffic from that IP to a docker compose stack fronted by `traefik`.

### DNS

First, pick a DNS name for your tunnel.
Update your DNS provider to point the tunnel name at your `traefik` instance.
We're going to stick with `tunnel.example.com` for this tutorial.

### Docker compose network

We need to make your compose stack's default bridge network have an explicit, not an auto-assigned, IP address.
Here's an example config for the [top-level `networks` key](https://docs.docker.com/reference/compose-file/networks/), which you can customize:

```yaml
networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.1.0/24
          ip_range: 172.20.1.0/24
          gateway: 172.20.1.1
    driver_opts:
      com.docker.network.bridge.name: "tunnelnet"
```

For the bridge name, you can use whatever descriptive name fits your stack, or you can just omit it.
For the subnet, you can pick any available network in a [private network](https://en.wikipedia.org/wiki/Private_network) address range; I think a `/24` should be plenty for most compose stacks.
You'll probably need to take your compose stack down and then back up for this change to take effect.

<details class="card mb-3">
<summary class="card-header h6 mb-0">More details about docker networking</summary>
<div class="card-body">

To understand this, you need to understand docker's networking model.
Most compose stacks run in bridge mode, and we're sticking with that here.
In bridge mode, when your stack boots up, docker creates a virtual [network bridge](https://en.wikipedia.org/wiki/Network_bridge) and allocates it a private network.
Containers in the stack get allocated an address within this network, and traffic between containers is routed via this virtual bridge.
If you need outside traffic to get to a container in the stack -- for example, HTTP/s traffic intended for the stack's `traefik` instance -- then you can configure forwarding using the [`ports` key](https://docs.docker.com/reference/compose-file/services/#ports).

We're going to be telling traefik to forward our tunnel traffic to a port on the virtual bridge.
This means we need the bridge to have a specific -- not a randomly assigned -- gateway address.

Note that docker also supports host-based networking, where instead of a virtual bridge your containers just listen on the host's network interfaces.
In this case, you don't need this bridge config.
But I don't recommend host-based networking, since it allows your compose services to access other, potentially private services running on the machine or in other compose stacks.

</div>
</details>

### Configure Traefik

We need to tell Traefik to send traffic intended for the tunnel name to a specific port on the stack's bridge.
This requires setting up an entrypoint and a service; here's an example:

```yaml
entrypoints:
  https:
    address: ":443"

http:
  routers:
    tunnel:
      rule: "Host(`tunnel.example.com`)"
      service: "tunnel"
      entryPoints: ["https"]
      tls:
        certResolver: le

  services:
    tunnel:
      loadBalancer:
        servers:
          - url: "http://172.20.1.1:8642"
```

You might need to restart your `traefik` instance for these changes to take effect.

<details class="card mb-3">
<summary class="card-header h6 mb-0">More details about traefik config</summary>
<div class="card-body">

The entrypoint tells traefik to listen on port 443.
You probably already have this configured if you're using Traefik for other services.
Next, we define a tunnel router, which causes Traefik to provision an SSL cert for that name (this assumes you already have a `le` [`certificatesResolvers`](https://doc.traefik.io/traefik/https/acme/) configured in your Traefik static config).
Finally, we tell Traefik to send traffic coming into this service to port `8642` on the stack's bridge interface.
You can pick a different port if you don't like `8642` -- just be consistent in the sections below.

</div>
</details>

### Configure SSHD

Your SSH server config is probably located in `/etc/ssh`.
Edit `sshd_config` to include the line:

```ini
GatewayPorts clientspecified
```

Make sure there are no other `GatewayPorts` lines ahead of this.
You might need to restart SSHD for this to take effect:

```console
# /usr/sbin/sshd -t && systemctl reload ssh
```

<details class="card mb-3">
<summary class="card-header h6 mb-0">More details about GatewayPorts</summary>
<div class="card-body">

We want our SSH remote tunnels to attach directly to the compose stack's bridge.
However, by default SSHD only allows reverse tunnels to bind to the host's loopback interface.
This change to the config allows us to specify a different address -- in our case, the address of the stack's bridge -- for the remote tunnel to bind to.

</div>
</details>

### Configure Firewall

If your server is like mine, it is running some sort of firewall to restrict which services can be accessed.
In our case, we need to allow `traefik` to access our tunnel port (`8642`) on the bridge interface.
If you're using `ufw`, run:

```console
# ufw allow in from 172.20.1.0/24 to 172.20.1.1 port 8642 proto tcp comment 'Tunneled traffic for tunnel.example.com'
```

If you're using `iptables` or `nftables` directly, or some other firewall system, you'll need to translate that command.

### Activate your tunnel

On your computer running the dev service you're trying to expose, run:

```console
$ ssh -N -R 172.20.1.1:8642:localhost:3000 tunnel.example.com
```

This command exposes the local service on port `3000` to the internet at `tunnel.example.com`.
Congratulations, your tunnel is now complete!
When you're done with it, simply `Ctrl-C` the `ssh` command.
