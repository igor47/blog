---
layout: post
title: SmartStack vs. Consul
---

I am one of the primary authors of Airbnb's SmartStack, which is composed of two pieces: [nerve](https://github.com/airbnb/nerve) and [synapse](https://github.com/airbnb/synapse).
When we released this software, we documented a lot of the reasoning behind it in a [very comprehensive post](http://nerds.airbnb.com/smartstack-service-discovery-cloud/) on service discovery.
I recommend reading that post carefully to understand why we made the design decisions we did.

Recently, I've been getting a lot of questions on how SmartStack compares to [Consul](http://www.hashicorp.com/blog/consul.html), which is an alternative take on service discovery from the amazing guys at [HashiCorp](http://www.hashicorp.com/).
I am excited to see more people taking on this operational challenge.
In general, better service discovery will lead to more available SOA infrastructures, which makes for a better web experience for all web users.
Also, it will lead to a better engineering experience for the people maintaining those SOAs.

Recently, HashiCorp put out [a comparison between Consul and SmartStack](http://www.consul.io/intro/vs/smartstack.html), which gets somethings right but also some things wrong.
This post aims to complement HashiCorp's comparison from my perspective.
Of course, I welcome constructive criticism to the opinions expressed here.

## The Gossip Protocol ##

> Consul uses an integrated [gossip protocol](http://www.consul.io/docs/internals/gossip.html) to track all nodes and perform server discovery.
> This means that server addresses do not need to be hardcoded and updated fleet wide on changes, unlike SmartStack.

This is a fair criticism of SmartStack -- the addresses of the [Zookeeper](https://zookeeper.apache.org/) machines must be statically configured.
Of course, [Serf must also be bootstrapped](http://www.serfdom.io/intro/getting-started/join.html) with at least one existing node to join the cluster.
If all of the bootstrapped nodes you have hard-coded into your configuration management system (like [Chef](http://www.getchef.com/chef/) or [Puppet](http://puppetlabs.com/)) die, new nodes will not be able to join the cluster.

Really, there are two choices here.
The first is statically hard-coding a list of Zookeeper instances and relying on Zookeeper.
The second is static configuration of bootstrapping information for Serf and relying on Serf's [gossip protocol](http://www.serfdom.io/docs/internals/gossip.html).

The gossip protocol is a modified version of [SWIM](http://www.cs.cornell.edu/~asdas/research/dsn02-swim.pdf).
Consul uses this not just for bootstrapping but for propogate ALL information, including the availability information you're trying to discover.
I have many unanswered questions about the gossip protocol.
For instance, in the case of a network partition, it seems like a partitioned-off node will be alternatively marked suspected-down and then back up by different group members.
This may result in a partitioned-off node never leaving the cluster.

In the end, replacing ZooKeeper with Serf may be a viable option for SmartStack.
I would welcome pull requests to [synapse](https://github.com/airbnb/synapse) that use Serf, or maybe Consul, as a [service watcher](https://github.com/airbnb/synapse/tree/master/lib/synapse/service_watcher) instead of [Zookeeper](https://github.com/airbnb/synapse/blob/master/lib/synapse/service_watcher/zookeeper.rb).

## Service Discovery ##

> For discovery, SmartStack clients must use HAProxy, requiring that Synapse be configured with all desired endpoints in advance.
> Consul clients instead use the DNS or HTTP APIs without any configuration needed in advance.
> Consul also provides a "tag" abstraction, allowing services to provide metadata such as versions, primary/secondary designations, or opaque labels that can be used for filtering.
> Clients can then request only the service providers which have matching tags.

The first sentence here doesn't really even make sense.
Sure, Synapse must be configured to discover the services you are going to want to talk to, but you could just as easily configure it to discover ALL of your services.
On the other hand, explicitly specifying which services you are going to want to talk to from which box is extremely useful, because it allows you to build [a dependency graph of your infrastructure](/static/images/airbnb-infrastructure-oct13.png).
I view this as a benefit, not a drawback.

Another benefit is using [HAProxy](http://haproxy.1wt.eu/#desc) to actually route between services.
Whenever a service inside Airbnb talks to a dependency SmartStack, that service knows nothing about the underlying implementation.
The ability to avoid writing a client (even a simple, HTTP client) for service discovery into each application was a fundemental design goal for us.
If you want a third-party application you didn't write to run on your network and consume Consul information, you must use DNS.
However, DNS is even worse -- when, how, and for how long will DNS resolutions be cached by your underlying libraries or applications?

Instead of insisting on a simple HTTP API, Consul provides you with the ability to do complex tag-based discovery.
It is almost certainly a mistake to utilize these features.
Your infrastructure should aim to be as simple and flat as possible.
A service instance is a service instance, and if it's different then it is a different service!
If you find yourself 6 months in, only talking to instances of service Y which provide property X from some unknown number of clients which have requirement X hardcoded into an HTTP request buried in their codebase, you are going to wish that you hadn't done that.

Finally, HAProxy is an extremely stable, popular, well-tested, well-utilized, fundemental component of the internet which provides amazing introspection.
That we use HAProxy means that synapse and zookeeper can just go away, and your service will keep on working (although it won't get updates about new or down instances).
Using connectivity checks in HAProxy means that we can survive network partitions -- services which remain registered will be taken out of rotation by HAProxy.
Using HAProxy's [built-in load balancing algorithms](http://docs.neo4j.org/chunked/stable/ha-haproxy.html) meant that we didn't have to write them.
Using HAProxy's [built-in status page](http://haproxy.1wt.eu/img/haproxy-stats.png) means we can easily see what's happening on a particular box with that box's service dependencies.
Using HAProxy's logging, we can see a detailed history of communications between services.
And using monitoring tools that scrape and aggregate HAProxy's stats, we can get instant insight into what kinds of load services are seeing, from which kinds of other services.

Many of these advantages can again be gained by configuring synapse to use Consul as a discovery source.
But I strongly feel that synapse/HAProxy combo is better in many ways than Consul, and urge you to consider the benefits I've outlined above.

## Health Checking ##

> Consul generally provides a much richer health checking system.
> Consul supports Nagios style plugins, enabling a vast catalog of checks to be used.
> It also allows for service and host-level checks.

The current list of health checks in nerve is minimal at best, although it's been sufficient for our needs here at Airbnb.
I like the simple model, of nerve doing a direct check on a service from the machine it's running on.
Conceptually, it's easier to wrap your head around.
Why is this box deregistered?
Because it failed it's nerve health check?
Or because Nagios is down or overloaded, or because the application pinged your service to ask to be deregistered and then kept running, or for what other unseen reasons?

Although I would discourage the use of complex health checks, I can see the advantages, and I would welcome PRs to nerve to add better health checking.

## Multi-DC ##

> While it may be possible to configure SmartStack for multiple datacenters, the central ZooKeeper cluster would be a serious impediment to a fault tolerant deployment.

I am not certain that I would want to run a UDP-based gossip protocol across the public internet.
Running a Zookeeper cluster across the public internet is also not an ideal situation.

I think that the correct approach is to provide mostly-local service clusters per datacenter.
A single, global Zookeeper cluster will contain only the list of services that are truly cross-DC (like the front-end load balancers), while most services only talk to services inside their local DC.
Assuming a flat cross-DC topography is setting yourself up for much higher than necessary latancy.

Of course, with Consul you could probably configure your services to discover only dependencies tagged with your local datacenter.
But this reaches into the realm of configuration management, and at that point both Consul and SmartStack become equivalent -- a Chef change is a Chef change.
