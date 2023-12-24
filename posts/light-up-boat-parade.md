---
title: Light Up Boat Parade 2023
date: 2023-12-18
slug: light-up-boats
description: |
  We decorated a boat for the Sausalito light-up boat parade!
image: /images/lights.png
---

In October, I completed [ASA104](https://asa.com/certifications/asa-104-bareboat-cruising/) with [Modern Sailing](https://www.modernsailing.com/content/bareboat-cruising-asa-104).
I wanted to take out some of their larger cruising boats, but due to the [wind patterns in the San Francisco Bay](https://boardsportscalifornia.com/understanding-san-francisco-bay-area-weather-the-wind-beneath-our-wings/), there's no wind in the winter.

Sailboats are for sailing -- I am not a huge fan just sitting around burning diesel for fun.
My excuse came in the form of the [Sausalito light-up boat parade](https://www.winterfestsausalito.com/).
I could get on the water in a big boat, and not feel **too** bad about just motoring around all day.
Plus, I had never been in a parade before!

## Decoration

Modern Sailing rentals are a 24-hour period starting at 9am.
Our plan was to get the boat first thing in the morning and spend the day decorating.
We would go to the parade at 6 pm, then sleep on the boat and take the decorations down in the morning.

Here's our final result:

<p>
<video controls muted loop disablepictureinpicture>
  <source src="/videos/lightupboat.webm" type="video/webm" />
  Download the <a href="/videos/lightupboat.webm">WEBM</a>.
</video>
</p>

## Rigging The Mainsail

A friend had a giant cache of [twinkly strings](https://twinkly.com/en-us/products/strings-multicolor).
Our plan was to hang them up in the mainsail triangle, and display some cool mapped patterns in 2D.
Here's our rigging plan:

![Rigging Plan](/images/light-up-boat-rigging.svg)

I was really worried about losing the main halyard, so we used a serious line with some extra-redundant knots to secure it at the mainsail clip and on the deck.
For the rigging, we used paracord with some alpine butterflies tied into it:

![Alpine Butterfly](/images/alpine-butterfly.jpg)

The first few twinkly strings, next to the mast, used the entire length of the string.
For the later strings, we could start at the top, go back down to the boom, then go back up to the top again.
This required hosting the rigging, figuring out where the string would end up, and securing it on the rigging that ran along the boom.
Then we could lower the whole rigging, and secure the other end of the string in the loop that ran along the topping lift.

This was a huge pain.
Christmas lights **want** to get tangled, and hosting them up and down gives them just the chance they're looking for.
It took us until the very end to figure out that we could just put extra paracord through the loops, and use it to hoist one string at a time.
Next time, we'll definitely just install extra paracord in every loop from the very beginning.

We ended up using 2 strings of 400 lights, and 1 string of 600 lights -- 1400 LEDs total on just the mainsail triangle.

## Mapping

We hoped to use the Twinkly app to map the lights to a 2D image.
This **absolutely** did not work.
First, the mast is really tall -- it was difficult to even get the whole set of lights in the frame.
To do that, we had to stand pretty far back, which made each LED hard to distinguish in the picture.
Finally, the strings swayed in the wind, and the whole boat rocked in the water -- no way to get a still image.

Thankfully, with just the default unmapped patterns, the Twinkly lights look pretty good.
However, I am now kind of obsessed with the idea of mapping the lights to a 2D image.
I think using a hybrid automatic-manual approach should work well.
I should be able to take a single photo as the base of the scene.
Then, I should be able to turn on sections of the lights, and then indicate their position in the base image.
It doesn't have to be perfect -- just good enough to get the general shape of the boat.

I would like to try writing some software for this in time for next year's parade.

## Other Lights

I bought some of [these lights](https://amzn.to/3RSKvv1) to put on the lifelines.
My plan was to control them with [WLED](https://kno.wled.ge/).
But I discovered that, though they are individually addressable, they have some bug in the implementation of the protocol that causes them to flicker unpredictably.

I did bring some of [these strings](https://amzn.to/3NI0LfP).
Unlike the previous lights, these don't explicitly advertise WS2812.
However, they do work well with WLED.
Their implementation of WS2812 is kind of [odd](https://todbot.com/blog/2021/01/01/ws2812-compatible-fairy-light-leds-that-know-their-address/).
Rather than shifting out the bits for the next light, they allow the controller to wiggle the entire common data line, and each LED knows its own address.
This means you cannot link multiple strands together serially -- the second string will just mirror the first.

I didn't have time to do anything fancy with these lights.
We used them with their default controllers using some built-in patterns.

## Future Work

For next time, I would dispense with the fancy Twinkly lights (which, wow, are pretty expensive!).
Instead, I would use the cheap strings off Amazon and write my own software to control them over WS2812.
Let me know if you have ideas for how to create a 2D mapping UI for this!

## The Parade

Oh yeah, there was a parade!
That part was super-fun.
We got to see all the other boats up-close, and listening to the marine radio chatter with the stressed-out parade organizers trying to keep everything going was pretty entertaining.
Next time I would like some other crew to feel confident driving -- turns out operating a 40' boat in close quarters with a bunch of other boats, in the dark, in a shallow marina, is stressful!
We didn't win any prizes, but we had a great time.
