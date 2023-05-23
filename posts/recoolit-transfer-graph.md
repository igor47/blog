---
title: Purchase Allocation via Graph
date: 2023-05-11
slug: purchase-allocation-via-graph
description: |
  Recoolit is focused on transparency, and every purchase is allocated to a specific molecules recovered in the field. This post describes how we do that.
image: /images/transfer-graph-2.png
---

<small>**Note**: This is cross-posted to the [Recoolit blog](https://www.recoolit.com/blog).</small>

When you [buy carbon credits from Recoolit](https://www.recoolit.com/buy), you are buying a specific amount of prevented atmospheric warming.
We prevent warming by preventing the release of refrigerants into the atmosphere.
(Note: if you want to learn more about how refrigerants cause warming, check out [our post on refrigerants](/posts/refrigerants-what-are-they).)
Our purchase receipts are designed to be transparent -- you see exactly how much warming you are preventing, and exactly how.
This post explains the technical details of how we create this transparency.

## Brief Overview of Recoolit

When refrigerators, air conditioners, or other kinds of heat pumps reach end-of-life or need maintenance, the refrigerants inside need to be removed from the system.
This might be because the refrigerant is contaminated, or maybe just because the refrigerant is at high pressure inside the system, and needs to be de-pressurized before the system can be serviced safely.
It is common for refrigerants to be vented into the atmosphere during this process.
Recoolit provides technicians with the tools, know-how, and incentives to capture these waste gasses instead of releasing them.
Then, we destroy the captured gasses in a high-temperature incinerator, permanently preventing their release into the atmosphere.

Our main mechanism for incentivizing refrigerant capture is to pay technicians for the refrigerants they capture.
We also have to pay for the cost of destroying the refrigerants, including getting the destruction facility inspected and certified to international standards.
Finally, we have to cover our operational expenses.
This includes buying and maintaining the pumps and cylinders that we use to capture and store refrigerants.
We maintain several depots, where technicians can borrow the equipment needed for recovery.
Finally, we pay for a warehouse were we store refrigerants before they are destroyed.

We cover all of these costs by selling carbon credits to individuals and organizations that want to offset their carbon emissions.
None of this work could happen without your support.
Feel free to take a break from this post and [buy some carbon credits](https://www.recoolit.com/buy)!

## Why Transparency?

The world has almost no way to pay for pollution remediation.
Sometimes, governments will force polluters to pay for the cost of cleaning up their pollution.
Other times, governments will directly pay for cleanup using tax dollars, especially when the pollution is a public health hazard and there is no obvious responsible party who can be forced to tackle the cost.

So, even with the growing awareness that climate change is a big, looming problem, there are too few ways to get money to organizations that are tackling the issue.
The voluntary carbon credit markets -- where individuals and companies pay for carbon credits out of a sense of social responsibility, and not for any regulatory reason -- are one of the few ways to pay for climate change remediation.

However, the voluntary carbon credit markets have been a bit of a mess.
There are no international agreements or standards on how to quantify the impact of carbon credits.
A few private organizations have stepped in to fill this gap, but their standards are not universally accepted.
Finally, some of the largest private organizations -- known as registries -- have faced controversy.
For instance, Verra, one of the largest registries, [has been criticized](https://www.theguardian.com/environment/2023/jan/18/revealed-forest-carbon-offsets-biggest-provider-worthless-verra-aoe) for allowing carbon credits to be sold for projects that were already underway, and for projects that were not actually preventing warming.

For these reasons, Recoolit's founder Louis was determined for the company to be as transparent as possible from day one.
We collect detailed data on every step of our operational process.
When you make a purchase, we show you all of the data we've collected that pertains to the molecules that went into your purchase.
Finally, we show as much data as possible on [our public registry](https://registry.recoolit.com/registry), so that anyone can see exactly what we are doing.

## What Is Our Data?

Every Recoolit carbon credit begins with a recovery.
This is where a technician captures refrigerants from a refrigerator, air conditioner, or other heat pump.
At this step, we collect photos of the equipment that's being serviced, the reason for the refrigerant recovery, the amount of gas recovered, and the type of gas recovered (though we don't always know the exact type of gas at this point).

Next, technicians return the cylinder used for the recovery to one of our depots.
We verify the amount of gas recovered, and we also test the gas using a basic refrigerant identifier device.
We pay the technician for the amount of gas they collected.
This payment compensates the technician for the time and effort they spent performing the recovery.

Because we want to return the smaller recovery cylinders back into the field, we will often consolidate the gas from multiple recovery cylinders into a larger storage cylinder.
We cannot mix different types of refrigerants, so we have to keep track of the type of gas in each cylinder.
Every time gas is transferred, we keep detailed records on the source and destination cylinders and weights.
Some small amount of gas is always lost during transfers, and the loses are not included in the carbon credits we sell.

Next, we transport the gas to our destruction facility.
Every time we transport gas, we weigh and test the cylinders at both ends.
We maintain a chain of custody for the cylinders at all times, using signed transport manifests.
Some of the refrigerants we transport are becoming expensive, because they are no longer allowed to be produced under internal agreements.
Our procedures ensure that no loss or theft of refrigerants occurs during transport.

Finally, our refrigerants go through the destruction process.
First, we taking a sample of each cylinder that has arrived at the destruction facility.
The sample is lab-tested under rigorous standards, to confirm the exact makeup of the contents of the cylinder.
Next, the cylinder is hooked up to a high-temperature incinerator.
In Indonesia, we partner with cement kiln operators, because their facilities reach the high temperatures needed to destroy refrigerants and need only minimal modifications to do so.

After destruction, the cylinders are shipped back to us.
We vacuum-test the cylinders to make sure they're not leaking, and use them for future recoveries or consolidations.

## Building the transfer graph

When you buy a carbon credit from Recoolit, you are buying a specific quantity of a specific gas that was destroyed.
In order to show you all of the data that went into your destruction, we need to trace the path of the gas from the recovery to the destruction.
We call this data structure the "transfer graph", and it is the core of our transparency system.

The transfer graph is a directed acyclic graph (DAG).
In this graph, the edges are transfers from a source to a destination node.
Each edge has a weight, which is the amount of gas transferred, as well as a gas type.

Because cylinders are reused, the nodes are actually a specific cylinder ID during a specific time interval.
A node is created when gas is first transferred into it, and "closes" when all of the gas is transferred out and we vacuum out the cylinder.
A subsequent transfer into the same cylinder ID would create a new node.

Each node can have multiple incoming and also outgoing edges.
This is because we sometimes do partial transfers.
Finally, each node can have a series of "events" associated with it.
Events include things like "the gas was tested", "the cylinder was transported", or "the cylinder was weighed".

## An example

This might be easier with an example, so lets use some real data from our public registry.
I bought some credits from Recoolit, and [here is my receipt for that purchase](https://registry.recoolit.com/purchases/f436f5ca-a6fe-49c4-b10c-f4e46cafcb8d).
Lets look at the same data in our internal system:

![Igor's purchase graph](/images/igor-purchase-graph.png)

To allocate this purchase, we first look through all of our destructions to find one that has enough gas to cover the purchase.
We might need to combine multiple destructions to cover the purchase.
In this case, we find that we destroyed about 50kg of R-22 from cylinder `berkabut-panas-bebek`.
R-22 is such a high-GWP refrigerant that only 511 grams of it were needed to cover my purchase of 1 tonne of CO2e.

Next, we do a depth-first search through the graph, starting at the destruction node, and looking for a path that has enough gas to cover the purchase.
We see that about 10 kg of R-22 arrived in `berkabut-panas-bebek` from `dingin-kering-harimau`, so we allocate 511 grams of that 10kg.
Finally, we see that 5.8 kg of R-22 was recovered directly into `dingin-kering-harimau`, so we allocate 511 grams of that 5.8kg.

This was a fairly easy case, as it only involved a single trajectory through the graph.
Here's an example of a more complicated sale, which involved multiple kinds of gas allocated through multiple destructions:

![A more complicated purchase graph](/images/complicated-purchase-graph.png)

In this case, the purchase of 30 tonnes of CO2e was covered by 3 different destructions.
We destroyed 13235 grams of R-410a and 193 grams of R-32 to cover this purchase, and these gases were recovered by two technicians on 3 different occasions.
Three of the five recoveries were on the same day into three different cylinders, indicating a large recovery job that filled up multiple cylinders!

## Allocating purchases

We allocate purchases using a depth-first search through the graph, starting at the destruction node.
Every time we find a node that has enough gas to cover the purchase, we recursively look through the source nodes.
The recursion terminates at a recovery node.
We then propagate the list back up through the stack, allocating the purchase to each node in the path.

Allocating the purchase means creating edges.
For each purchase, we create a `sale` node in the graph.
For each node that contributes gas to the purchase, we create a `sale` edge, from the source node to the `sale` node.
To find all the nodes involved in allocating a sale, we look for all nodes connected to the `sale` node through a `sale` edge.

Each `sale` edge includes the amount of gas that was allocated to the sale.
To figure out if a node still has enough gas to cover the sale, we subtract the sum of all `sale` edges from the weight of the node's outgoing transfer edge.

## Formatting for display

We've already discussed all of the data we collect during operations to enable this kind of transparency.
You can now also know how our system allocates your purchase to destructions and recoveries.
The final piece is presenting this data in a way that is easy to understand.

In your receipt, we show you a path-decomposed version of the transfer graph.
A path is a linked list of edges and nodes, starting at a recovery and ending at a destruction.
However, in your purchase subgraph, a single node or edge might be involved in multiple paths.
When we do the decomposition, we clone the shared nodes and edges, so that each path has its own copy.
Here's an example of a non-decomposed graph:

![Non-path decomposed graph](/images/transfer-path.png)

You can see that this includes two recoveries -- one in the blue box, and one in the red box.
The green box includes a consolidation and destruction nodes that are shared between the two paths.
When we display it, it would look more like this:

![Decomposed paths](/images/transfer-path-decomposed.png)

There are two paths in this graph -- the one on the left, and the one on the right -- and the nodes in green are duplicated between the two paths.
Doing this is surprisingly non-trivial because it's not clear, just from the subgraph, how many paths through a particular node there are.
To make it easier, we actually keep track of the paths when we construct the graph.
Each time we begin trying to allocate gas from a destruction, we generate a path identifier.
When we find a path that works, we store the path identifier in the `sale` edges that track the allocated purchase.
This means that a node might actually have multiple edges connecting it to a `sale` node, each with a different path identifier.

## Wrapping up

As you can see, we've put a lot of thought into how to make our data as transparent as possible.
Our goal is to create the highest-quality carbon credits, with the greatest possible assurance to buyers that their purchase is actually making a difference.
If you like what we're doing here, and want to support us, we urge you again to [buy some carbon credits](https://registry.recoolit.com/buy)!
