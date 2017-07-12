---
layout: post
title: Reflections on Leaving Airbnb
---

April 3rd, 2017 was my last day at Airbnb.
These last 4 ½ years were an intense, wild adventure, and a very important part of both my career and my life.
As I move on, I want to reflect on this experience while it is still fresh in my mind.
Some of the things I want to focus on: what I was able to accomplish while at the company, what I think I could have done better, and my reasons for leaving.

## So.... what would you say you did around here? ##

I joined Airbnb in September of 2012.
At that time, the company was maybe 500 people, the product team around 70 people, and the engineering team around 40.
I was recruited by [a very good friend](https://www.linkedin.com/in/raphaeltlee) who wanted someone to replace the [previous one-and-only infrastructure engineer](https://www.linkedin.com/in/jasondusek/).

When I started, I joined the data infrastructure team run by [Flo Leibert](https://www.crunchbase.com/person/florian-leibert).
I was interested in the Hadoop ecosystem, and felt that this technology was going to become increasingly important going forward.
However, shortly after joining, I went through the first Airbnb Sysops training, which was recruiting people to join the volunteer on-call rotation.
During this training, it became apparent that the production infrastructure had some serious unsolved issues, and was in need of a lot of attention.
By December of 2012, I moved from the data side of the infra to the production side -- specifically, the SRE team -- where I directed my attention for the remainder of my time at Airbnb.

### Configuration Management ###

We began with configuration management.
At that time, Airbnb had [a mechanism for launching new instances](http://airbnb.io/cloud-maker/), but it was unclear how those instances would be configured.
Also, it was unclear how to make new instances and previously-existing instances the same, and no audit trail of configuration changes.
With [Martin Rhoads](https://www.linkedin.com/in/martin-rhoads-a63a0027/), we decided to introduce [Chef](https://www.chef.io/) to solve some of these problems.

We first tried a standard Chef-Server approach, but ran into annoying versioning and clobbering issues.
Shortly, we decided to convert to a Chef-Solo approach based around a monorepo.
The approach we settled on is documented in [this blog post on Chef at Airbnb](https://medium.com/airbnb-engineering/making-breakfast-chef-at-airbnb-8e74efff4707).
It remains in use at Airbnb today, and has also been adopted by several other companies.

Since we had dumped Chef-Server, we now needed an inventory system -- ideally, one that supported custom metadata.
I wrote a very simple proof-of-concept one called [optica](https://github.com/airbnb/optica), which also (surprisingly) remains in-use today.

Also, since we were no longer using `knife ec2`, we needed a tool for launching and bootstrapping instances.
Martin wrote another proof-of-concept, called [stemcell](https://github.com/airbnb/stemcell).
This has been refactored several times to support more advanced features, but also continues to be in-use at Airbnb today.
While it's still possible to use stemcell on an engineer's laptop (and indeed, would be required to re-bootstrap in case of catastrophic failure), most engineers probably shouldn't have the AWS credentials to launch these instances.
Most engineers at Airbnb use stemcell though a web service UI.
The web interface helps avoid tedius command-line invocations, is responsible for authorization, and eases other common cluster management tasks (AZ balancing, scaling up/down, cluster-wide chef runs).

### Service Discovery ###

Around the same time as we were introducing configuration management, in the spring of 2013, we had an additional problem.
There was growing consensus that we couldn't (and shouldn't) write all of our code inside our Rails monolith.
However, we didn't have the tooling to build an SOA.
Configuration management (how to configure the instances running individual services) was certainly part of the problem, but another part was connecting the services together.

We had already written some services in Java, using the Twitter Commons framework which included a service discovery component.
However, this service discovery had to be implemented in every service, and required ZK and Thrift bindings inside that service.
A team was working on a NodeJS service for the mobile web version of the site, and NodeJS had neither of these available at the time.

We decided that we would abstract this problem away -- first, with [Synapse](https://github.com/airbnb/synapse) as a service discovery component, and then with [Nerve](https://github.com/airbnb/nerve) for service registration.
The entire system was called SmartStack, and the design is more comprehensively justified in the [SmartStack blog post](https://medium.com/airbnb-engineering/smartstack-service-discovery-in-the-cloud-4b8a080de619#.m0x2ks9ja).

SmartStack was very easily to deploy incrementally via our new configuration management system.
Registerng a service via `nerve` and making it available through `synapse`/`haproxy` required only configuration changes in the Chef monorepo.
Actual deployment of SmartStack involved merely changing where a service finds it's dependent services, and also killing any retry or load balancing mechanisms (since these would now be handled by `haproxy`).
By the end of the summer of 2013, all of our services were communicating via an HAProxy, and we were able to kill lots of Zookeeper and server-set-management code in the Rails monolith and other services.
SmartStack also remains in-use at Airbnb today.

### Load Balancing ###

Once our services were talking internally through HAProxy, we wanted to bring the same approach to our upstream load balancing.
At the time, all traffic inbound to Airbnb always went directly from an ELB to a rails monolith instance, and managing the set of instances registered with the ELB was a manual process.
Initially, we planned an ambitious service that would accept all incoming traffic and would be able to mutate it -- for instance, handling authentication and session management and setting authoritative headers for downstream services.
However, we quickly learned that writing a proxy service that could handle Airbnb traffic, even in 2013, was nontrivial.
After several attempts to deploy a Java version, we punted and instead deployed Nginx.

The Nginx instances, collectively known as Charon, become our front-end load balancer.
These were entered into DNS manually, and all inbound traffic would arrive at them.
`Synapse` for any service that accepted front-end traffic -- such as the mobile web service or the rails monolith -- was enabled on these boxes.
Nginx would dispatch traffic to `haproxy` based on request parameters, most often the hostname in the request.
Load balancing to the service instances happened inside `haproxy` as usual.
Once this system was deployed, I was able to kill our ELBs.
It was very convenient to have service routing be consistent throughout the stack -- an instance would receive traffic if and only if `nerve` was active on that instance.

This system worked well enough until Spring 2016.
At that time, several problems arose.
The biggest was that all traffic bound for the Charon boxes was coming from Akamai, and Akamai was not doing a good job load-balancing between the Charon instances.
Since some of these instances were receiving a lion's share of the traffic, and since haproxy is single-threaded, were starting to hit high CPU usage on those instances.
Scaling the Charon cluster wasn't helping, since we would still end up individual hot instances.

Akamai claimed that Route53 weighted resource sets were to blame, since they return only a single IP address every time a name is resolved.
To avoid Akamai internally caching a single IP, we switched to vanilla `A`-record sets, which return all the IP addresses for a name with each request.
We hoped that this would result in Akamai traffic being balanced between Charon nodes, but the approach did not work.
Eventually, we resorted to re-introducing ELB into our stack, this time as a way to load-balance between Charon (not rails monolith) instances, at the cost of an additional 3ms of latency per request.
Insert yo-dawg joke about load balancers here.

As part of this project, we spent a lot of time manually managing DNS or ELB registration for Charon instances.
To ease this burn, I wrote a service called `Themis`, which read `nerve` entries from Zookeeper and then took action when the set of these entries changed.
I wrote actions to manage ELB registration, or to create Route53 entries for either multi-IP `A` records or weighted record sets.
As a bonus, this made our stack fully consistent.
Now, even a load balancer would only receive traffic if and only if `nerve` was up on that instance.
This system remains in use at Airbnb today.
Alas, I did not have a chance to open-source Themis before I left Airbnb; maybe someone at the company would take that on as a project.

### Internal Load Balancing ###

While Charon was handling our load balancing needs for production, we were starting to deploy a lot of internal services, too.
To make writing internal services easier, Pierre Carrier and I launched Dyno in the fall of 2013.
This was Nginx configured, just like Charon.
If an engineer marked a service as an internal web service, then `<service name>.dyno` took you to an instance of that service.

Dyno eventually added an authentication mechanism, so internal services didn't have to write their own authentication code.
While the `.dyno` instances were initially manually entered into DNS, once Themis become available we allowed it to handle DNS registration for those boxes as well.

### Monitoring ###

In the beginning of 2014, our systems monitoring was pretty spotty.
At that time, we were using Scout for instance monitoring, but monitoring was inconsistently available.
Also, Scout was a dead-end for metrics -- it only supported system-level stats that it's agent was able to collect.
At the time, several cool monitoring SaaS companies were getting started, and I embarked on a project to evaluate our options.

In the end I ended up choosing DataDog.
A strong reason was DataDog's very good haproxy integration.
This integration allowed us to have metrics for how much traffic each service was getting, where this traffic was coming from, and the distribution of response sizes, result codes, and other interesting statistics.
Another reason was that the DataDog agent accepted StatsD metrics, so we could monitor instance statistics like CPU, memory, and other resource utilization alongside custom service metrics.
Furthermore, DataDog had server-side CloudWatch scraping, which meant we could see CloudWatch specific information like RDS utilization stats alongside all other metrics (and avoid asking engineers to log into the AWS console just to see CloudWatch metrics).
Finally, DataDog had a very comprehensive API, so it seemed possible to do more automation as time went on.

In early 2014, I rolled out DataDog and removed Scout from all of our systems.
I would be a primary point of contact for managing Airbnb's relationship with DataDog until my departure from the company.
As I was leaving Airbnb, there were teams contemplating what it would look like for us to run at least some of our own monitoring tools.
However, on the whole the decision to use DataDog worked out.
Despite some bumps, the product scaled well with Airbnb, and the company was very responsive in managing problems and rolling out new features.
I strongly recommend DataDog.

I also became a primary point of contact for anything monitoring-related at Airbnb.
After rolling out the DDAgent to systems, I added DatDog's StatsD client to many of our applications.
I encouraged other developers to liberally instrument their code with StatsD calls.
Additionally, I ended up writing lots of internal documentation on monitoring best practices.
I also developed monitoring curriculum, originally for the SysOps group but later as a bootcamp class for all new hires.
I encouraged engineers to formulate hypothesises about what could be causing issues, and then to use the available monitoring tools to test these hypothesises.
Since it is impossible to formulate such hypothesises without at least some understanding the overall infrastructure, my bootcamp class became a primer on Airbnb infrastructure as a whole as well as the monitoring tools that illuminate that infrastructure.

### Alerting ###

After migrating metric monitoring to DataDog, I was able to tackle alerting.
I had several strong requirements.
I wanted alerts to be defined automatically, so new hosts get alerts as they're spun up and alerts are cleaned up when hosts go away.
I wanted the notifications to be automatically routed to the right people.
Finally, I wanted alerts to be configuration-as-code, not created via manual clicking in the UI.

First, I had to take a stab at the ownership issue.
This was a constant problem during my tenure at Airbnb, and we never really solved it.
As people moved around and teams formed and dissolved, systems would become orphaned, and the maintenance burden would fall on "whoever cares most".
However, I at least made an initial system for assigning ownership, even if the data in that system was not always consistent.

Next, I created Interferon.
This project uses a Ruby DSL to programmatically create alerts.
I chose a DSL because I wanted complicated filtering logic, and found myself inventing mini-programming languages inside pure-data formats like JSON or YAML.

As an example for how Interferon was used, lets take CPU utilization.
I was able to write a single alert file which specified a CPU utilization threshold.
Whenever Interferon ran, it would pull a list of all hosts from inventory and make sure that each host had a CPU alert, cleaning up stale alerts for any terminated hosts.
The alerts would be routed to the owners for each host, and the alert file could be modified to explicitly filter out any systems where high CPU usage is expected.
Because all changes are code changes, the usual review process applies, so there are no surprises for new alerts or alerts suddenly going missing.
Also, writing alerts in a file encourages developers to write longer, more informative alert messages, and the DSL allows information about hosts to be encoded in the alert, making alerts more actionable.

### Product Work ###

In the middle of 2014, I was becoming burned out on SRE work.
Also, although I had been running systems at Airbnb, I hadn't done any work on the product -- I didn't even know how to work with Rails.
To change things up, I transitioned to a product team which was building an experimental cleaning integration for Airbnb.
I worked with a front-end engineer for six months to build this product, and we launched it in several markets.
However, in the end it wasn't viable and was shut down.

### Developer Happiness ###

In early 2015, it was clear that the cleaning product I had been working on wasn't going to ship, and the team would dissolve.
I was looking around for new problems to focus on, and they weren't hard to spot.

Shipping code to the Airbnb Rails monolith was becoming increasingly difficult.
Build and test times were increasing rapidly.
Spurious test failure was a constant problem and required regular re-builds, further delaying shipping.
The build-test-deploy pipeline was unowned, meaning that whenever it broke it was up to whoever was most frustrated to fix it.
Overall, the experience of being a product engineer was quite frustrating because of gaps in tooling, documentation, ownership, and communication.

So, when my product was finally terminated, Topher Lin and I started the Airbnb Developer Happiness team.
Our broad mandate was to work on whatever was causing the most frustration.
Our initial top target was build times, but we envisioned tackling a wide range of issues around internal communication and tooling.
To understand our problem space and to get buy-in for our projects, we began conducting the Airbnb developer survey.
I collected and analyzed the data, which showed widespread frustration with our tooling and infrastructure.

I spent most of my remaining time at Airbnb working in this problem space.
The team Topher and I started ended up expanding to over 40 engineers and at least 4 sub-teams.
Although we never got time to work on many of the broader problems we initially envisioned tackling (like internal communication practices), the intersection of people and tooling is the area I remain most passionate about.

### Build System ###

The Developer Happiness Team's initial target was slow build times, at that time creeping into 30-minute-plus territory.
At the time, we were using Solano, a third-party ruby testing platform, to run any commit-time tasks including builds.
We had hacked building an artifact into this system as a fake test.
We were also using Solano to build non-ruby projects, including any fat JARs from our Java monorepo.
Solano was running on AMIs provided by the company, and we didn't understand the build environment, how to debug any problems or build failures, or how to control system dependencies for builds.

We decided that we would start by moving builds to our own hardware, where we could optimize the environment.
Since we would have multiple systems performing build and test tasks, we decided to create a unified UI where all such tasks could be collected and visualized.
I also began evaluating multiple build systems to replace Solano, with an eye towards a system which supported arbitrary pipelines to support optimizations to the Java builds as well as Ruby builds.

A build system is just a task executor which performs tasks in response to events, usually commit events.
We already had a system that fed all commit events from Github Enterprise into RabbitMQ, providing a convenient trigger.
We were already very familiar, too, with Resque, a Ruby task executor for delayed or long-running tasks which we used throughout our production infrastructure.
Finally, we were tired of writing build tasks as shell scripts (which can't be tested) and which integrated with the build system by making API calls via `curl`.
We envisioned instead a small library of common tasks, written as Ruby functions with good test coverage, and which could report their status, progress, and results directly into log systems and databases.

These design considerations lead us to decide to roll our own build system.
We built it into Deployboard, the tool we were already using to deploy the builds.
Instead of learning about new builds via API calls, Deployboard would generate them using Ruby executed in response to RabbitMQ events.
It would display any progress and error logs.
The end result was the Deployboard Build System -- built in less than 4 months by just three engineers, who were also supporting frequently-failing CI for an engineering team of 400+.

We migrated the Airbnb Rails monolith to this system in summer of 2015.
This system immediately improved the speed and reliability of builds by an order of magnitude.
In November of 2015, I wrote a Ruby test splitter which allowed arbitrary parallelism on our monolith's RSpec suite, and migrated the tests from Solano to Deployboard as well.
This improved test times from 30+ minutes to around 10 minutes, as well as reduced spuriousness and made test result tracking easier.
By March of 2016, we completely terminated Solano, migrated all builds to Deployboard, and introduced and integrated Travis CI for testing most projects except the Rails monolith and the Java monorepo (which were tested in Deployboard for performance reasons).
The combination of Deployboard Build System and Travis CI remains in use for all projects at Airbnb today.

### Ruby Migration ###

In mid-2016, after a brief break to focus on load balancing and Themis, I embarked on what became my final project at Airbnb.
At the time, we were still using Ruby 1.9.3 on Ubuntu 12.04 for all of our projects.
In general, we had no story around how to upgrade system dependencies of any kind for our projects.
My goal was to create such a mechanism, and then to use it to upgrade the Ruby version for our Rails monolith.

Our build artifacts were generated directly on build workers, using system versions of any dependencies.
This meant that system dependencies had to match between build workers and production workers for a deploy to work correctly, and required upgrading build workers and production workers in concert -- a difficult operation that would be difficult to roll back in case of trouble.
Also, we didn't know what these dependencies even were for each given build.

I began by tagging builds with system dependencies used to create the build -- things like ruby version, NodeJS version, and Ubuntu version (as a shorthand for any dynamic library dependencies).
Next, I transitioned our deploy system UI, which previously asked engineers to pick a specific build artifact to deploy.
The new system asked engineers to pick a specific version (SHA) of the code, which may be associated with any number of build artifacts.
Finally, I modified the system which actually performed deploys on instances.
Previously, that system would receive a specific artifact (like a tarball of Ruby code along with it's `bundle install`ed dependencies) and then go through the steps (untar, link, restart) to deploy that artifact.
In the new version, the system would receive a list of possible artifacts, along with their tags.
It would then compare local dependency versions with the tags on artifacts, and pick an artifact that matched the system (or error out if, for instance, the system Ruby version didn't match the Ruby version on any available artifact).

This system allowed me to build the Rails monolith concurrently for Ruby 1.9.3 and Ruby 2.1.10.
It also allowed me to have web workers for both versions of Ruby in production -- each worker, upon receiving a deploy, would pick a correct artifact.
I also began running tests for the monolith under both versions of Ruby, fixing any spec failures that were version-dependent.

By February of 2017, this preliminary work was completed.
I began running some upgraded Ruby workers to watch for unexpected errors, and also to compare performance between the populations.
The vanilla Ruby 2.1.10 build actually had *worse* performance than the Brightbox PPA build of Ruby 1.9.3 we had been using.
In the end, I created a custom build of Ruby 2.1.10 with several performance patches.

In March 2017, I performed the Ruby upgrade for the monolith.
Also, the system dependency upgrade system I created was used to upgrade our Ubuntu version from 12.04 to 14.04.
Other engineers were beginning to use the system to upgrade other system dependencies, including NodeJS versions for Node projects and Ruby versions of other services in our SOA.
After completing the migration and documenting the work, I announced my departure.


