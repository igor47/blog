---
title: 'Now: March 2024'
date: 2024-03-17
slug: now-march-2024
description: |
  Now page for March 2024
image: /images/rr-jira-pica.png
isNowPage: true
---

**Note**: This is an old NowNowNow post!
The next post after this one [is here](/posts/now-feb-2025).
The most recent post [is here](/now).

---

I'm finally getting around to making a [now page](https://nownownow.com/about).
I've been meaning to do this for a while, ever since I heard about `now` pages from [Raph Lee](https://www.linkedin.com/in/raphaeltlee/).
Thanks as always, Raph!

### Work ###

Direct emissions from just residential buildings are [almost 6% of all CO2 emissions](hhttps://www.iea.org/data-and-statistics/charts/global-co2-emissions-from-buildings-including-embodied-emissions-from-new-construction-2022) -- that's 2x the emissions from aviation.
Indirect emissions -- that is, emissions due to energy use in residential buildings -- are another **11% of all** emissions.
To reduce building emissions, we have to electrify buildings and then/simultaneously de-carbonize the grid.
The [IRA](https://home.treasury.gov/policy-issues/inflation-reduction-act) has a number of provisions to accelerate building electrification.
For instance, sections [25C and 25D](https://assets.ctfassets.net/v4qx5q5o44nj/3FYfJiYMILiXGFghFEUx0D/279f180456183d560d9c68d4de8baa67/factsheet_25C_25D.pdf) provide generous tax credits for moving to heat pump or geothermal home heating.

Besides the federal tax incentives, there are also local incentives at the state, county, city, and utility provider level.
Combined, these can make the cost of projects like replacing fossil-gas furnaces with heat pumps much cheaper.
However, actually getting these incentives is a complex process.
There are barriers at every step of the way:
* Finding out about the incentives
* Understanding the requirements
* Applying for the incentives
* Budgeting and executing the actual project

To help with this process. I've joined [Rock Rabbit](https://rockrabbit.ai), so far as a contract software engineer.
At RR, we've built a database of the available incentives, including their eligibility and application requirements.
We turned this data into a wizard which allows homeowners or contractors to plan a project, understand how much money they'll get back in rebates or credits, and smooth the application process.
In some cases, we can directly submit the application to an incentive provider and track the rebate progress.

I've been playing a hybrid full-stack tech lead / eng manager role.
On the backend, I've implemented CI, cleaned up our infrastructure and deployment process, and added tests to help us be more confident that we're returning the correct set of incentives for a project.
On the front-end, I've built the scaffold for a web app (we've been mobile-only so far).
I'm particularly excited about auto-generating an API client from our our FastAPI/OpenAPI spec.
This allows us to keep backend Python types in sync with FE TypeScript types automatically.

### Projects ###

Besides this blog, my main project has been my self-hosted infra.
In my ideal world, there are no giant cloud service providers who make money by selling my data and my attention.
I generally agree with the likes of [Yuval Noah Harari](https://www.ynharari.com/), [Jaron Lanier](https://www.jaronlanier.com/), or [Cory Doctorow](https://pluralistic.net/) that those business model of the internet are unsustainable, unethical, and harmful to individual and collective well-being.

Instead, I want small groups of friends to collectively run personal infrastructure.
This is connected both with my ideas on electronic liberty, and also with my ideas of group cohesion and bonding.
Traditionally, we've relied on our social groups for our survival.
Today, we all work remotely for different organizations from our own bedrooms.
When we have friends at all, it's merely for entertainment.
I would like to bring back a world in which we depend on each other and collaborate to accomplish shared goals.
Digital infra is a good place to start.

My personal cloud started with an email server back in 2003 or so.
We've been running a shared media collection with services like [Subsonic](https://www.subsonic.org/) for more than a decade.
However, usability has been limited to my nerdiest friends.
My goal over the past few months has been to both set up more services, and to make them more usable.

Setting up more services has been much easier thanks to Docker and Docker Compose.
Things got even better once I nailed secret management with [dcsm](/posts/secrets-in-docker-compose).
For usability, I wanted to create an SSO system and a login portal.
I brought up [Authentik](https://goauthentik.io/) for SSO, so now there's a self-service signup flow.
I had to modify several services to get them to support SSO.
For instance, I have [a PR](https://github.com/janeczku/calibre-web/pull/2899) to [Calibre Web](https://github.com/janeczku/calibre-web) to add SSO support.

A big milestone was announcing the project to my broader group of friends.
I did that a few weeks ago, and now have almost a dozen active users in the system!

### Travel ###

I'm still living in Sacramento, with regular trips to the Bay Area.
However, over the next month I have some big trips coming up.
First, I'm going to Cabo San Lucas for a cousin's wedding.
I'm hoping to get at least a couple of days of scuba diving while I'm there.

After that, I will be driving to Austin, Texas with a friend.
We'll be at the [Texas Eclipse Gathering](https://seetexaseclipse.com/), and then road-tripping back home.
Excited to do another long EV road trip, and am curious how the infrastructure has come along in the past year.
Fingers crossed that Rivian rolls out NACS charging on the Tesla network and ships me an adapter before we leave!

### Reading ###

I've been reading mostly fiction lately.
A big project for me was re-reading [Anathem](https://bookshop.org/p/books/anathem-neal-stephenson/8961850) by [Neal Stephenson](https://www.nealstephenson.com/).
It's been a decade since I read it the first time, and I enjoyed it even more the second time around.
It made me wish I was living in the Mathic world, spending all my time learning and debating ideas with my friends.
I also enjoyed the mind-bending multiverse hijinks the concept of [Hylean flow](https://anathem.fandom.com/wiki/Hylean_Flow).

I also re-read [Recursion](https://bookshop.org/p/books/recursion-blake-crouch/9597794) by [Blake Crouch](https://www.blakecrouch.com/).
I pulled it up randomly in my library, and initially had no memory of reading it the first time -- a fun trip for a book all about memory!

Currently, I'm reading [The Deluge](https://bookshop.org/p/books/the-deluge-stephen-markley/18405115).
The book is quite well-written, with realistic characters, a good understanding of climate policy, and lots of fun insider-baseball politics.
On the other hand, is it explicitly a dystopian novel?
It anyway feels like one, and there's enough catastrophe to go around in the book, both for the planet and for the lives of the characters.
I generally avoid dystopian fiction, but now that I'm in it, I want to see how it turns out.

In the last few months I also plowed through all of the [Bobiverse](https://bookshop.org/p/books/we-are-legion-we-are-bob-dennis-e-taylor/6389676) books.
Just a fun, hard sci-fi romp through the galaxy.

### Future ###

I am still thinking about whether I want to go to grad school and do a career transition into energy engineering.
I still really want to work on the transmission and distribution grid.
I want to tackle [GETs](https://inl.gov/national-security/grid-enhancing-technologies/) and the problem of the [interconnection queue](https://www.utilitydive.com/news/energy-transition-interconnection-reform-ferc-qcells/628822/).
I am sure there is a lot of work for a skilled software engineer in this space.
If you work in the space or have ideas for me, please reach out!
