---
title: An Allowance-based Budget
date: 2026-09-15
slug: allowance-budget
description: |
  Control your spending by giving yourself a daily allowance.
image: /images/allowance-header.png
---

It could be inflation, or just lifestyle creep.
Maybe we're eating too much avocado toast?
Or it could be this thing:

![Sandy, mouth open, awaiting more money](/images/sandy-money-vortex.jpg "Insert money here")

Don't be fooled by the cuteness; it's actually just a voracious money-sucking vortex.
Whatever the cause, our household has recently begun spending an unsustainable amount of money.

All my life, I've hated budgeting.
My approach to budgeting has been to try to have my earnings stay one step ahead of my spending.
But while my earnings have plateaued, my spending has continued to increase.
It was time to try to rein it in.

Everyone loves budgeting apps like YNAB, but I've never gotten along with them.
One problem is the privacy policies, which always seem a little vague.
I feel like enough corporations already know my business without adding one more into the mix.
The other is the interfaces, which I find overwhelming -- too much stuff to look at, numbers everywhere.
I think the interfaces are this way because their mental model of budgets doesn't overlap with mine.
I don't want to come up with 20 categories, make a per-category budget, and track them all separately.

## Minimum viable categories

From my perspective, there should only be three expense categories:

1. Fixed expenses
2. Irregular expenses
3. Spending

Fixed expenses are anything you've committed to spending money on each month.
The biggest item here is rent, and smaller examples include utilities, subscriptions, bills, or any other recurring spending.
Think spending on autopilot -- you have to take action to *not* spend this money.

Irregular expenses are anything that comes up out of the blue.
The classic concern here is unexpected medical (or vet!) bills.
You don't really budget for them; the goal here is to have enough savings that such expenses don't wipe you out.

And then there's spending, which I think of as everything else.
Groceries, that cute shirt you needed for work, concert tickets, your morning latte -- I throw everything into this category.
This is the category where I want to budget, and this is where my `allowance` strategy comes in.

Suppose you make $5k in income, and you have $3k in fixed expenses.
That $3k should include savings -- a recurring expense you owe to yourself.
This leaves you with $2k towards your spending budget each month.
In a 30-day month, you have $2k / 30 days = $66 / day of "allowance".
Every day, you give yourself this much money to spend on everything you might want to buy.
If you want to make a big purchase, you might want to save up allowance money for a week or two to pay for it.
If you're in the red, it's like you've borrowed money from future-you.
Better pay it back before the month is up, or you might have to break your own kneecaps.

## Allowance

I've built an app to implement this budgeting strategy, which I've open-sourced [here](https://github.com/igor47/allowance).
Here's what it looks like:

![The allowance dashboard](/images/allowance-dashboard.png "Demo data -- Lenny and Penny are not real, and neither is their $44k")

The big number is the whole point: how much can I spend today, and still be on budget?
Every morning it goes up by the daily target, and it goes down by whatever we spent.
The chart shows each day's spending against the target, so it's obvious which days did the damage.

Using it takes about a minute a day.
I open it, look at the number, and tag whatever's new -- is this `spending`, a `recurring` bill, an `irregular` one-off, or a `transfer` between my own accounts?
The code is smart enough to sort most transactions on its own, but the ritual of going through the transactions helps us stay on top of our spending.

Unspent allowance rolls over from day to day, but each month starts fresh.
If you have allowance left over at the end of the month, a pat on the back; if you blew past your spending -- well, I hope you can forgive yourself.

That's really the whole app.
I put a lot of time into the [README](https://github.com/igor47/allowance#readme), so if you want to know how transfers get detected, how to handle Venmo or a second credit card, or how to set it up for yourself, go read that.

## Lunch Money inside

This entire app is a front-end to [Lunch Money](https://lunchmoney.app/).
It's a little frustrating that I'm paying $100/year to get access to my own financial data.
It gets me a clean, structured feed of transactions from my credit cards, bank accounts, and even Venmo.
But it buys me a few other things, too.
First, I love the Lunch Money philosophy, especially their [privacy policy](https://lunchmoney.app/privacy):

> **Does Lunch Money sell my information?**
> Never. We do not (and will not!) sell any information about our customers to others.

Second, the API allows me to *tag* my transactions in their backend.
As a result, my app gets to have no database at all -- the entire thing is a function of the state stored in LM.
Finally, LM has pretty good functionality for declaring and tracking recurring spending.
I built this into a `/budget` page that does the math from earlier: income, minus commitments, divided by the days in the month.
LM links charges to those recurring items on its own, and my app reads the link, so Netflix never counts as spending.

![The budget page](/images/allowance-budget-page.png "Income, minus commitments, divided by days")

## So? How's it going?

We first began using `allowance` seriously last month, but we already had a bunch of trips and expenses scheduled.
We ended up blowing well past our allowance.
This month, we're doing much better!
We are in the green most days, and it looks like we're going to end the month with the most reasonable credit card bill in the past year.
Getting on top of the finances has also been a forcing function to clean up some of our spending.
For example, I had many recurring transactions for services I wasn't using at all, which I've now cleaned up.

## Your next steps?

I've shown this app to a few friends, and everyone wants one!
The great thing is, you can run it today.
Make your Lunch Money account, connect your sources, teach it about your recurring transactions, and make an API key.
Then, you can just run the `allowance` app directly on your laptop for 5 minutes a day, whenever you want to use it.

I've had some interesting observations about apps like these, though.
In this day of LLM agents, I think it's easier to vibe-code a personalized app than to deploy it.
I've been really wanting a service that would allow other people to start with my code and deploy it on their own infra without being very conversant in the language of code deployment.
I think what this requires is a configuration surface for the app -- an additional UI that can control things like secrets in the environment (the Lunch Money API key) and the necessary config sections of the service's config file.
Thankfully, this particular app doesn't really require it.
Let me know if you find something that fits the bill here!
