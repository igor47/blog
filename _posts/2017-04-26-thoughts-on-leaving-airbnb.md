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
I wrote a very simple proof-of-concept one called [optica](https://github.com/airbnb/optica), which (surprisingly) remains in-use today.
(In fact, because optica is now queried from many places, it has become quite embedded, and any replacement would have to re-implement it's rudimentary API.)

Also, since we were no longer using `knife ec2`, we needed a tool for launching and bootstrapping instances.
Martin wrote another proof-of-concept, called [stemcell](https://github.com/airbnb/stemcell).
This has been refactored several times to support more advanced features, but also continues to be in-use at Airbnb today.
While it remains possible to use stemcell on an engineer's laptop (and indeed, this would be required to re-bootstrap the infrastructure in case of catastrophic failure), most engineers probably shouldn't have the AWS credentials to launch instances.
Instead, engineers at Airbnb use stemcell though a web service UI.
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
The entire system is called SmartStack, and the design is more comprehensively justified in the [SmartStack blog post](https://medium.com/airbnb-engineering/smartstack-service-discovery-in-the-cloud-4b8a080de619#.m0x2ks9ja).

SmartStack was very easy to deploy incrementally via our new configuration management system.
Registering a service via `nerve` and making it available through `synapse`/`haproxy` required only configuration changes in the Chef monorepo.
Actual deployment of SmartStack involved merely changing where a service finds it's dependent services, and also killing any retry or load balancing mechanisms (since these would now be handled by `haproxy`).
By the end of the summer of 2013, all of our services were communicating via an HAProxy, and we were able to kill lots of Zookeeper and server-set-management code in the Rails monolith and other services.
SmartStack also remains in-use at Airbnb today.

### Load Balancing ###

Once our services were talking internally through HAProxy, we wanted to bring the same approach to our upstream load balancing.
At the time, all traffic inbound to Airbnb always went directly from an [ELB](https://aws.amazon.com/elasticloadbalancing/) to a Rails monolith instance, and managing the set of instances registered with the ELB was a manual process.
Initially, we planned an ambitious service that would accept all incoming traffic and would be able to mutate it -- for instance, handling authentication and session management and setting authoritative headers for downstream services.
However, we quickly learned that writing a proxy service that could handle Airbnb traffic, even in 2013, was nontrivial.
After several attempts to deploy a Java version, we punted and instead deployed [Nginx](https://www.nginx.com/resources/wiki/).

The Nginx instances, collectively known as Charon, become our front-end load balancer.
The Charon instances were discovered by Akamai through DNS, where they were entered manually.
After inbound traffic arrived at a Charon instnace, it would be routed to the correct service based on request parameters -- most often the hostname in the request headers.
`HAProxy` took traffic for a specific service (by port number on `localhost`) and load balance it to actual instances providing that service.
Once this system was deployed, I was able to kill our ELBs.
It was very convenient to have service routing be consistent throughout the stack -- an instance would receive traffic if and only if `nerve` was active on that instance, whether or not it was a "backend" or "frontend" service.

This system worked well enough until Spring 2016.
At that time, several problems arose.
The biggest was that all traffic bound for the Charon boxes was coming from Akamai, and Akamai was not doing a good job load-balancing between the Charon instances.
Since some of these instances were receiving a lion's share of the traffic, and since `haproxy` is single-threaded, we were seeing traffic queueing due to high CPU usage on those instances.
Scaling the Charon cluster wasn't helping, since we would still end up with individual hot instances.

Akamai claimed that [Route53](https://aws.amazon.com/route53/) [weighted resource sets](http://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html#routing-policy-weighted) were to blame, since they return only a single IP address every time a name is resolved.
To avoid Akamai internally caching a single IP, we switched to vanilla `A`-record sets, which return all the IP addresses for a name with each request.
We hoped that this would result in Akamai traffic being balanced between Charon nodes, but the approach did not work.
Eventually, we resorted to re-introducing ELB into our stack, this time as a way to load-balance between Charon instances.
Insert yo-dawg joke about load balancers here.

As part of this project, we spent a lot of time manually managing DNS or ELB registration for Charon instances.
To ease this burden, I wrote a service called `Themis`, which read `nerve` entries from Zookeeper and then took action when the set of these entries changed.
I wrote actions to manage ELB registration, or to create Route53 entries for either multi-IP `A` records or weighted record sets.
As a bonus, this made our stack fully consistent.
Now, even a load balancer instance would only receive traffic if and only if `nerve` was up on that instance.
This system remains in use at Airbnb today.
Alas, I did not have a chance to open-source Themis before I left Airbnb; hopefully, someone at the company takes that on as a project.

### Internal Load Balancing ###

While Charon was handling our load balancing needs for production, we were starting to deploy a lot of internal services, too.
To make writing internal services easier, [Pierre Carrier](https://github.com/pcarrier) and I launched Dyno in the fall of 2013.
This was Nginx configured, just like Charon.
If an engineer marked a service as an internal web service, then `<service name>.dyno` took you to an instance of that service.

Dyno eventually added an authentication mechanism, so internal services didn't have to write their own authentication code.
While the `.dyno` instances were initially manually entered into DNS, once Themis become available we allowed it to handle DNS registration for those boxes as well.
Today, Airbnb engineers regularly interact with dozens of dyno services.

### Monitoring ###

In the beginning of 2014, our systems monitoring was pretty spotty.
At that time, we were using [Scout](http://server-monitor.pingdom.com/) for instance monitoring, but monitoring was inconsistently available.
Also, Scout was a dead-end for metrics -- it only supported system-level stats that it's agent was able to collect.
At the time, several cool monitoring SaaS companies were getting started, and I embarked on a project to evaluate our options.

In the end I ended up choosing [DataDog](https://www.datadoghq.com/).
A strong reason was DataDog's very good `haproxy` integration.
This integration allowed us to have metrics for how much traffic each service was getting, where this traffic was coming from, and the distribution of response sizes, result codes, and other interesting statistics.
Another reason was that the [DataDog agent](https://github.com/DataDog/dd-agent) accepted [StatsD metrics](http://docs.datadoghq.com/guides/dogstatsd/), so we could monitor instance statistics like CPU, memory, and other resource utilization alongside our own custom metrics.
Furthermore, DataDog had [server-side CloudWatch scraping](http://docs.datadoghq.com/integrations/aws/), which meant we could see CloudWatch specific information like RDS utilization stats alongside all other metrics (and avoid asking engineers to log into the AWS console just to see CloudWatch metrics).
Finally, DataDog had a [very comprehensive API](http://docs.datadoghq.com/api/), so it seemed possible to do more automation as time went on.

In early 2014, I rolled out DataDog and removed Scout from all of our systems.
I would be a primary point of contact for managing Airbnb's relationship with DataDog until my departure from the company.
As I was leaving Airbnb, there were teams contemplating what it would look like for us to run at least some of our own monitoring tools.
However, on the whole the decision to use DataDog worked out.
Despite some bumps, the product scaled well with Airbnb, and the company was very responsive in managing problems and rolling out new features.
I strongly recommend DataDog.

I also became a primary point of contact for anything monitoring-related at Airbnb.
After rolling out the `dd-agent` to systems, I added [DatDog's StatsD client](https://github.com/DataDog/dogstatsd-ruby) to many of our applications.
I encouraged other developers to liberally instrument their code with `statsd` calls.
Additionally, I ended up writing lots of internal documentation on monitoring best practices.
I also developed monitoring curriculum, originally for the SysOps group but later as a bootcamp class for all new hires.
I encouraged engineers to formulate hypothesises about what could be causing issues, and then to use the available monitoring tools to test these hypothesises.
Since it is impossible to formulate such hypothesises without at least some understanding the overall infrastructure, my bootcamp class became a primer on both the Airbnb infrastructure as a whole as well as the monitoring tools that illuminate that infrastructure.

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
I stored the information in the Chef repo, inside the role files which defined instances, and made it available for querying via `optica`.

Next, I created [Interferon](https://github.com/airbnb/interferon).
This project uses a Ruby DSL to programmatically create alerts.
I chose a DSL because I wanted complicated filtering logic, and found myself inventing mini-programming languages inside pure-data formats like JSON or YAML.

As an example for how Interferon was used, lets take CPU utilization.
I was able to write a single alert file which specified a CPU utilization threshold.
Whenever Interferon ran, it would pull a list of all hosts from inventory and make sure that each host had a CPU alert, cleaning up stale alerts for any terminated hosts.
The alerts would be routed to the owners for each host, and the alert file could be modified to explicitly filter out any systems where high CPU usage is expected.
Because all changes are code changes, the usual review process applies, so there are no surprises for new alerts or alerts suddenly going missing.
Also, writing alerts in a file encourages developers to write longer, more informative alert messages, and the DSL allows information about hosts to be encoded in the alert, making alerts more actionable.

I gave [a talk about this work](https://www.usenix.org/conference/srecon15/program/presentation/serebryany) at SREConf 2015, which includes more details if you're interested.
There's also a [blog post about Interferon/the Alerts Framework](https://medium.com/airbnb-engineering/alerting-framework-at-airbnb-35ba48df894f) on the Airbnb blog.  

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

So, when my product was finally terminated, [Topher Lin](https://github.com/clizzin) and I started the Airbnb Developer Happiness team.
Our broad mandate was to work on whatever was causing the most frustration.
Our initial top target was build times, but we envisioned tackling a wide range of issues around internal communication and tooling.
To understand our problem space and to get buy-in for our projects, we began conducting the Airbnb developer survey.
I collected and analyzed the data, which showed widespread frustration with our tooling and infrastructure.

I spent most of my remaining time at Airbnb working in this problem space.
The team Topher and I started ended up expanding to more than 20 engineers on at least 4 sub-teams.
Although we never got time to work on many of the broader problems we initially envisioned tackling (like internal communication practices), the intersection of people and tooling is the area I remain most passionate about.

### Build System ###

The Developer Happiness Team's initial target was slow build times, at that time creeping into 30-minute-plus territory.
At the time, we were using [Solano](https://www.solanolabs.com/), a third-party ruby testing platform, to run any commit-time tasks including builds.
We had hacked building an artifact into this system as a fake test.
We were also using Solano to build non-ruby projects, including all fat JARs from our Java monorepo.
Solano was running on AMIs provided by the company, and we didn't understand the build environment, how to debug any problems or build failures, or how to control system dependencies for builds.

We decided that we would start by moving builds to our own hardware, where we could optimize the environment.
Since we would end up with multiple systems performing build and test tasks, we decided to create a unified UI where all such tasks could be collected and visualized.
I also began evaluating multiple build systems to replace Solano, with an eye towards a system which supported arbitrary pipelines to support optimizations to the Java builds as well as Ruby builds.

A build system is just an executor which performs tasks in response to events, usually commit events.
We already had a system that fed all [webhook events](https://developer.github.com/webhooks/) from Github Enterprise into RabbitMQ, providing a convenient trigger.
We were already very familiar, too, with [Resque](https://github.com/resque/resque), a Ruby task executor for delayed or long-running tasks which we used throughout our production infrastructure.
Finally, we were tired of writing build tasks as shell scripts (which can't be tested) and which integrated with the build system by making API calls via `curl`.
We envisioned instead a small library of common tasks, written as Ruby functions with good test coverage, and which could report their status, progress, and results directly into log systems and databases.

These design considerations lead us to decide to roll our own build system.
We built it into Deployboard, the tool we were already using to deploy the builds.
Instead of learning about new deployable builds via API calls, Deployboard would now generate them using Ruby executed in response to RabbitMQ events.
It would display any progress and error logs.
The end result was the Deployboard Build System -- built in less than 4 months by just three engineers, who were also supporting frequently-failing CI for an engineering team of 400+.

We migrated the Airbnb Rails monolith to this system in summer of 2015.
This system immediately improved the speed and reliability of builds by an order of magnitude.
In November of 2015, I wrote a Ruby test splitter which allowed arbitrary parallelism on our monolith's RSpec suite, and migrated the tests from Solano to Deployboard as well.
This improved test times from 30+ minutes to around 10 minutes, as well as reduced spuriousness and made test result tracking easier.
By March of 2016, we completely terminated Solano, migrated all builds to Deployboard, and introduced and integrated Travis CI for testing most projects except the Rails monolith and the Java monorepo (which were tested in Deployboard for performance reasons).
The combination of Deployboard Build System and Travis CI remains in use for all projects at Airbnb today.

There are a few talks about Deployboard online.
One is [a talk Topher and I gave at Github Universe 2015](https://www.youtube.com/watch?v=4etQ8s74aHg).
There is also [a talk I gave at FutureStack 2015](https://blog.newrelic.com/2015/12/15/airbnb-democratic-deploys-futurestack15-video/).
However, Deployboard was also unfortunately never open-sourced, mostly due to lots of Airbnb-specific code and it's use of O2, an internal Bootstrap-style CSS framework.

### Ruby Migration ###

In mid-2016, after a brief break to focus on load balancing and Themis, I embarked on what became my final project at Airbnb.
At the time, we were still using Ruby 1.9.3 on Ubuntu 12.04 for all of our projects.
In general, we had no story around how to upgrade system dependencies of any kind for our projects.
My goal was to create such a mechanism, and then to use it to upgrade the Ruby version for our Rails monolith.

Our build artifacts were generated directly on build workers, using system versions of any dependencies.
They are deployed as tarballs to instances which are required to have matching versions of these system dependencies.
Upgrading such dependencies had to happen in concert between the build and production systems -- a difficult operation that would be more difficult still to roll back in case of trouble.
We had no way of even tracking what system dependencies a given artifact required.

I began by tagging builds with system dependencies used to create the build -- things like ruby version, NodeJS version, and Ubuntu version (as a shorthand for any dynamic library dependencies).
Next, I rebuilt our deploy system UI, which previously asked engineers to pick a specific build artifact to deploy.
The new UI asked engineers to pick a specific version (SHA) of the code, which may be associated with any number of build artifacts.
Finally, I modified the system which actually performed deploys on instances.
Previously, that system would receive a specific artifact (e.g. a tarball of Ruby code along with it's `bundle install`ed dependencies) and then go through the steps (untar, link, restart) to deploy that artifact.
In the new version, the system would receive a list of possible artifacts, along with their tags.
It would then compare local dependency versions with the tags on artifacts, and pick an artifact that matched the system (or error out if, for instance, the system Ruby version didn't match the Ruby version tag on any of the available artifact).

This system allowed me to build the Rails monolith concurrently for Ruby 1.9.3 and Ruby 2.1.10.
It also allowed me to have web workers for both versions of Ruby in production -- each worker, upon receiving a deploy, would pick a correct artifact.
I also began running tests for the monolith under both versions of Ruby, fixing any spec failures that were version-dependent.

By February of 2017, this preliminary work was completed.
I began running some upgraded Ruby workers to watch for unexpected errors, and also to compare performance between the populations.
The vanilla Ruby 2.1.10 build actually had *worse* performance than the [Brightbox PPA](https://www.brightbox.com/docs/ruby/ubuntu/) build of Ruby 1.9.3 we had been using.
In the end, I created a custom build of Ruby 2.1.10 with several performance patches.

In March 2017, I performed the Ruby upgrade for the monolith.
Also, the system dependency upgrade system I created was used to upgrade our Ubuntu version from 12.04 to 14.04.
Other engineers were beginning to use the system to upgrade other system dependencies, including NodeJS versions for Node projects and Ruby versions of other services in our SOA.
After completing the migration and documenting the work, I announced my departure.

### Non-Technical Projects ###

Besides the big chunks of code I wrote while at Airbnb, I was also involved in lots of non-technical (or at least, non-coding) projects.
In hindsight, some of those projects were arguably more important than any of the strictly technical work that I did; see the section below on a post-mortem around those thoughts.
It seems worthwhile to document those here, too, while I still remember them.

One big area of focus was SysOps.
I spent a lot of time on-call, especially during the hectic years in 2013 and 2014 when we were growing rapidly and our infrastructure was in flux.
I eventually transitioned into a leadership role of the SysOps group.
This involved organizing training for new members, planning the on-call schedule, and running the weekly postmortem meetings.
The SysOps group was incredibly successful, and I frequently hear astonishment from my peers when I tell them that Airbnb has a strictly volunteer on-call rotation.
The group was so successful that we eventually had more people who wanted to be in the on-call rotation than we could fit into slots during a 6-month period.
We ended up reducing on-call shift duration from a week to just two days.
In 2015 several long-tenured members, including me, began stepping back from the group to allow newer engineers to take the lead.

Another big focus was our overall technical vision.
I was a member of Tech Leads, an initial stab at such a vision, in 2013.
However, when [Mike Curtis](https://www.linkedin.com/in/curtismike/) became VP of Engineering, he dissolved the group as part of his efforts to abolish any hierarchy among engineers.
However, we still needed a way to collectively decide how to evolve our infrastructure.
I took lead on an initial stab at such a system, called Tech Decisions, in late 2013, but that system was too bureaucratic and never had much adoption.

In 2014, a crisis around whether and how we run an SOA precipitated another attempt, called the Infrastructure Working Group.
We held a series of meetings to come up with a shared set of principles for our infrastructure, which formed the basis of any future decision-making.
I drafted several of the principles we eventually settled on.
We also created a structure called the Infrastructure Working Group, which worked to influence individual teams and engineers to make technical decisions in accordance with the principles.
I was heavily involved with the group, at least until the Developer Happiness Team began taking all my time.

I was very involved with our Bootcamp efforts for new hires.
I participated in the meetings that created the Airbnb Bootcamp.
Afterwards, I ended up regularly teaching two of the sessions.
The first was on monitoring our infrastructure.
The second was titled "Contributing and Deploying", and covered the developer workflow from committing code (including how to write good commit messages -- a personal quest) to getting that code successfully out in production.
This was the only mandatory session of the bootcamp.

Finally, as a technical leader and senior engineer, I spent a lot of time on mentorship and code review.
During our Chef roll-out, I ended up reviewing almost every pull request to our Chef repo in an effort to broadly seed Chef best practices.
Later, as I transitioned on working primarily on Deployboard, I reviewed most PRs to that repo, trying to ensure consistent architecture, style, and test coverage.
As the Developer Happiness/Infrastructure group of teams grew and hired many new engineers, I worked to get them up to speed on the codebase and to become productive and self-sufficient contributors.

Finally, I spent a large amount of time maintaining what I call "situational awareness".
This meant engaging with the firehouse of stuff that the Airbnb engineering team was doing, from project proposals and infrastructure decisions down to individual pull requests, email threads, and even Slack conversations.
I attempted to inject vision and guidance wherever I could, connect the dots between disparate projects, and in general to be helpful.
For instance, I could tell an engineer that a project they were trying to accomplish would become easier when another engineer on a different team completed a different project.
I could catch PRs that were likely to cause problems, or connect outages to specific changes.
This connector role was performed by several people in the engineering organization, and these people never got the credit they deserved for this thankless and never-ending task.

## What Didn't Work? ##

It took me quite a while to write the preceding section.
I knew that I had been incredibly productive at Airbnb, but writing it down really threw it into relief.
Looking back over that I worked on, I see that my technical projects -- Chef, SmartStack, Deployboard, the work on Monitoring -- were very successful.
They made life easier for other engineers, and have survived the test of time to continue providing value.

However, I always had more grand ambitions than to just accomplish a specific project.
I had a vision for how I wanted our infrastructure and our engineering team to function, and I did not succeed, in most cases, in making that vision a reality.

A great example of this is our original vision for the Developer Happiness team.
We did not set out to become the CI team, although that's where we eventually ended up.
We wanted to improve documentation, communication, and make being an Airbnb engineer easier and more fun.
I ran the engineering team survey and collected pain points, but never had enough bandwidth to address more than a few of these pain points.

Why didn't I have enough bandwidth?
I think it's because I failed to navigate the transition from individual contributor to technical leader.
The easiest way for me to get things done at Airbnb was to just do the things I thought needed doing.
When our builds were slow, I jumped in with both feet and made them faster -- by writing a build system and a test splitter and a Javascript UI for result visualization, etc...

In the meantime, I let things fall to the floor.
I ignored the structural problems that lead to the situation, or merely kvetched about them and left others to try to solve them.
I spent too much time writing code, and not enough time influencing or guiding other contributors -- which would have allowed me to focus on a broader range of problems.
I let myself be seduced by the promise of definitely solving a smaller problem in favor of some probability of solving a larger one.

This wasn't *entirely* my fault.
Airbnb could have done better to support my transition.
The engineering team is completely flat -- even though we have engineering levels, they're supposed to be secret.
Expectations around what engineers should be focusing on at each level are vague at best, and there's no consensus among managers about what makes a more senior engineer.
Mike Curtis once told me, in a one-on-one, that it should be possible to reach the highest engineering levels by focusing on deep technical work, but I think that assertion would come as a surprise to most of his engineering managers.

My constant argument to the eng management at Airbnb was to make technical leadership an explicit role, rather than something a few engineers did in their spare time.
I think I failed to convince anyone, least of all Mike Curtis, of this argument.
However, some Airbnb engineers were able to make the transition on their own, despite lack of official support.
I was not one of them.

Finally, I think my biggest failure at Airbnb was making it personal.
I invested so much life and energy into my work that it became all too easy to become frustrated when things didn't seem to be working out.
When things got really tough -- see next section -- I lashed out and became a liability.
I failed to keep my reactions in check, and injected negativity into my entire team.

If I could change anything about my time at Airbnb, it would be a change in focus.
I wish I was more focused on building relationships, and less on accomplishing objectives.
In the end, when I was leaving, it was the relationships that I did manage to build that persisted in my life -- the technical stuff is all someone else's problem now.

## Why I Quit ##

It took about 6 months for the Developer Happiness team to go from three to 4 engineers.
During this time, it felt like the world was on fire.
The builds and tests were constantly broken.
It could take an entire day to ship a simple change, and we were concerned about a code backlog so deep we couldn't clear it in one day.
We were trying to keep the existing system running through multiple crises, even while trying to build and roll out a replacement with minimal headcount.
It was very frustrating to feel like we were holding the world up on our shoulders while being ignored by the engineering management and failing to secure any help for our team.

So, in the summer of 2015, when our existing engineering manager approached me about potentially taking over as the new manager, I refused.
Besides, being in the middle of several technical projects which I felt couldn't afford to lose me as an IC, I also had an ideological aversion to going into management.
Although Airbnb had a narrative about parallel career paths for ICs and managers, I didn't feel that we were living up to our words.
I wanted to continue being an example of a successful IC who got things done without transitioning.

Instead, another recently-hired team member took on the management role, and was joined by a newly-hired project manager.
Together, the two of them came up with broad roadmap for the team, and then conducted offsites to plan specific projects to meet the roadmap.

This process turned out to be incredibly frustrating for me.
I was spending all my time putting out fires and shipping high-impact code, but the new roadmap had no room for several of the projects I thought were most important, including some that I was in the middle of working on.
I was very angry at losing control over what I saw as 'my team', and at being sidelined in the decision-making.
It felt like I was demoted from a technical leadership role that I carved out for myself to just being another IC.

The combination of high-stress firefighting and loss of control in planning lead me to utterly burn out.
I ended up taking a two-month leave of absence in March 2016.
First, however, I made an ass of myself in several team meetings.
I claimed (who knows how accurately) that our work was so undervalued by the management organization as to be structurally doomed, and that we would never be able to effect the changes we sought.

As a result, when I returned from leave, I was even further sidelined.
My manager, as well as his manager, asked me to join a different team, which was a sort of dumping ground for cranky senior engineers.
One argument was that "there's no need for an engineer of your level on the developer infrastructure projects" -- an argument that seemed patently false.

In several conversations, it became apparent that I had a very different vision of the engineering team from the engineering managers.
I thought that technical leaders with proven technical accomplishments should play a more active and official role throughout the team -- in creating new teams, planning projects, and guiding newer engineers.
Instead, I was asked to minimize my input, let teams come up with roadmaps and projects that I felt were destined to fail, and in general stay out of the way.

As a result, instead of continuing my technical leadership work with Developer Infrastructure, I picked a nice and hard technical project I could do by myself -- the Ruby upgrade.
While I resolved to finish this project, it was clear both that this wasn't the kind of work I wanted to be doing and that it wasn't the kind of work that was likely to get me any brownie points with the engineering management.
I quit as soon as the project was complete.
