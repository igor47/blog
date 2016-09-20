---
layout: post
title: The 12V Music Manifesto
---

Party people, we need to talk.
Every time I go to a renegade event -- a party on the beach, or in the forest, or in an abandoned tunnel -- there is always a generator involved.
The generator powers the sound system, but it also creates a steady hum of undesirable noise and a plume of smelly smoke.
The generator inevitably runs out of gas, causing the party to pause for a minute while it's topped off.
Oh, and topping off the generator is always done using [those annoying CARB cans](http://www.gad.net/Blog/2012/11/22/one-mans-quest-for-gas-cans-that-dont-suck/), in the dark -- and so fuel is always spilled *everywhere*.

## Generator Power Is Inefficient ##

Actually, amps run on DC power.
Inside your amp is a [rectifier](https://en.wikipedia.org/wiki/Rectifier) which turns the 120VAC line supply into DC, and then probably a [voltage regulator](https://en.wikipedia.org/wiki/Voltage_regulator) which dissipates some of that power to get a level usable by the [op-amps](https://en.wikipedia.org/wiki/Operational_amplifier) and [transistors](https://learn.sparkfun.com/tutorials/transistors) in the amp.

Let's assume that the effiency of your small generator is [a generous 20%](https://settysoutham.wordpress.com/2010/05/26/portable-generators-about-half-as-efficient-as-power-plants/), and then [80% for the full-wave rectifier](http://www.brighthubengineering.com/consumer-appliances-electronics/96645-efficiency-of-ac-rectifiers/), and then say another 90% for the voltage regulator.
Then, only `0.20 * 0.80 * 0.9 ≈ .15` or 15% of the power in the gasoline you're burning is actually used to power your sound system.

"Okay, okay, we get it -- you hate generators," you're saying at this moment.
"But like what are we supposed to do?"

## 12V Sound Systems ##

Actually, I love my [Honda EU2000](http://amzn.to/2cE5yk1).
It's quiet, lightweight, runs for a long time on very little gas, and has proven extremely dependable.
It's just that I don't need my generator unless I plan to be running sound for many, many days -- like, a week and a half of Burning Man.
But I can run a great-sounding system for ***about 24 hours*** off a single [120 amp-hour deep-cycle battery](http://amzn.to/2dc97Kk).

Because people often ask me how I manage to run such a sound system without a generator, I am writing this post that breaks down my whole system.
Read on to learn about each component.

### The Battery ###

The 12V batteries that go in your car are ***not correct*** for this task.
Those batteries are meant to start your car's engine, and then be immediately topped off by the alternator.
If you try to draw power off them, they will quickly die, and if they remain dead they will calcify and will need to be replaced.

The batteries I use are sold as either deep-cycle or marine batteries.
These are meant to be used on boats or in RVs, where you're expected to run appliances off the batteries without the engine running.
They're also often used as part of energy storage for a solar system.

The capacity of deep-cycle batteries is measured in [amp-hours](https://en.wikipedia.org/wiki/Ampere-hour)(or `Ah`).
A `120Ah` battery will run a device which consumes 120 amps for an hour, 60 amps for two hours, etc...
I recommend buying the 120 amp-hour ones because they're not much heavier or more expensive than smaller batteries, and give you more capacity.

I buy my deep-cycle batteries at Costco, because they're readily available there, and relatively inexpensive (around $150 per battery).
Also, Costco will let you trade them in if they lose their capacity too quickly.
I've owned maybe fifteen of the Costco-branded or Interstate batteries over the last decade, and I've found most of them to last for three to four years with no problems and when they stop holding their charge you can trade them in for new ones.

I charge my batteries using a couple of [these Duracell battery chargers](http://amzn.to/2cZGlzX).
At $50 each, these are the most economical 12V battery chargers I've found.
Also, their maximum charge rate is 15 amps, which means it can charge a `120Ah` battery from fully empty to totally full in about 8 hours (overnight).
Even at Burning Man, [Camp Warp Zone](http://igor.moomers.org/warpzone/) never ran any lights or art pieces off the generator.
We always run everything off 12V power, but several times during the burn we'll run the generator to recharge all the batteries.

### The Amp ###

The heart of your 12V sound system is a 12V amp.
These amps are made for automotive audiophiles, and so there's a huge range of options to chose from.
I've been using [this Sound Storm 2000W amp](http://amzn.to/2cLB0KO).
I like it because it's totally sealed and fairly compact, and it sounds fine.
One complaint I have is that it puts out a hiss when no audio is playing or connected.

If you want to add a subwoofer to your system, you'll need an additional amp for that.
Amps designed for subwoofers are called "monoblock" amplifiers, because they only have one channel -- unlike stereo amps, which have a left and right channel.
I use [this Audio Pipe 1500W monoblock amp](http://amzn.to/2cDiAeo), which sounds great and comes with nice features like a built-in crossover and a subsonic filter to protect your subwoofer.
One potential problem is that the Audio Pipe is actively cooled with fans which suck air from the environment.
This will probably cause problems over time in dusty outdoor environments.

It's hard to find suitable monoblock amps for hi-fi applications because of impedance mismatch.
Most automotive subwoofers are rated at either 4 Ohm or 2 Ohm.
Alternatively, because of the tight space requirements inside cars, several smaller 8 Ohm or 4 Ohm subs might be installed in parallel, halving the impedance.
As a result, automotive monoblock amps typically put out their rated power at these low impedances.
On the other hand, most performance subs for clubs are 8 Ohm.
So, if you want to match the power supplied by the amp to the power requirements of the sub, you have to buy wildly overpowered monoblock amps.
For example, to power a 1500W subwoofer, you might need an automotive amp which claims to be rated at 4000W, because that rating will typically be at 2 Ohms.
To get the power rating at 8 Ohms, you'll need to divide twice to get 1000W.

Keep in mind that power ratings for both speakers and amps are typically inflated.
There's no way your amp can supply 1000W *continuously*, but neither can your sub sink that much power continuously.
If it looks like your amp is slightly underpowered, that's okay -- just don't try to compensate by turning up the gain, or you'll [risk blowing your speaker cones](http://www.bcae1.com/2ltlpwr.htm).

### Speakers ###

This is a contentious issue -- everyone has their preferred speakers.
I've found that my system sounds okay with just four of [these Behringer B212XLs](http://amzn.to/2cXPMxe).
I like them because they're very lightweight, made of rugged plastic, and fairly inexpensive.
I don't worry about them getting beat up in the back of a van, or sitting directly on the dirt at the party.
They sound much better at higher volumes, which is perfect for parties.

I don't own my own subwoofer yet, but I had great success driving a friend's [Behringer B1800X](http://amzn.to/2cE7qcx).
I wouldn't buy this sub for myself, though, because it's a little too large and unwieldy.
I've been eyeing the [Peavy 118D](http://amzn.to/2cZJdg6) because it's weighs a few pounds less, and it can run in both active and passive mode.
I could run it in passive mode off batteries during parties, and use the built-in amp if I wanted to blast bass in my one-bedroom apartment.

You'll probably want to make up your own mind on which speakers to buy.
Either way, to run a 12V system, the important thing is to buy either ***passive*** speakers or ones which, like the Peavy I linked, can be run in both active and passive mode.

### Extra Goodies ###

I keep a few more components which I think make the system run smoother.
One is a capacitor -- I use [this 2-farad model](http://amzn.to/2cLDd9j).
I got one of these after I noticed that in our theme camp at BM2014, where I was running all of the lighting as well as the sound system off a single battery, the lights would dim when the bass kicked in the music.
Having a large capacitor helps smooth out such problems, and is probably more gentle on the battery.
I doubt if the capacitor has any impact on sound quality, since the amps themselves should already have large-enough internal capacitors to smooth out their own power demands.
I like that the capacitor comes with a built-in volt meter, so I can keep an eye on the charge of the battery and avoid draining it too far.

Another useful component is [this electronic crossover](http://amzn.to/2cyrk3E).
It gives better control over the distribution of signal than the built-in crossover in the monoblock amp, and it also allows me to connect an additional amp if I want to run even more speakers.
I usually configure the sound so that two of the Behringers sit *behind* the DJ but still facing forward, so the DJ gets good monitors but they're still contributing to the party.
But the crossover makes it easy to connect dedicated monitors if desired.

Finally, it's helpful to have some power plugs.
I use [this cigarette lighter block](http://amzn.to/2dc9iVN) to provide USB power, which is nice to charge phones and also to run [little USB lights](http://amzn.to/2dc7WdK) (super-helpful when you need to plug and unplug stuff, or to see the DJ equipment).
I also like to keep a small inverter on-hand, [like this one](http://amzn.to/2cE4ahA).
That's helpful to power any laptops, mixers, or DJ controllers with dedicated power.
However, here, too, I recommend buying devices which natively support 12V.
For instance, I am planning to get the [Xone:23](http://amzn.to/2dc9sNb) as my next mixer because it runs on 12V, so I can just plug it right into the battery without needing an inverter.


## How to Wire Everything Together ##

There are two separate wiring paths -- one for power, and one for signal.
In either case, there's no need to buy into the cable hype.
For instance, if you're shopping for automotive audio, you'll often be told that you need to use at least 4GA wire.
This might be true inside actual cars, where the cable runs might have to be 20 or even 30 feet long.
However, if your sound system, if you keep your power runs to around 6 feet then you can get away with 12GA or 10GA wire, which is much cheaper and much easier to work with than the thick stuff.
I bought a couple of [spools of primary wire](http://amzn.to/2d6d1Iu) in the correct colors, and those have worked fine for me.

Automotive amps always have a `remote` terminal, usually next to the 12V `+` and `-` terminals.
This is meant to attach to the head unit in the car, so you can control power to the amps without digging around in the trunk.
I wire the `remote` terminal to the `+` terminal of the amp via a [toggle switch like this one](http://amzn.to/2dc79cN).
This allows me to wire up everything, double-check it, and only *then* to try to power up the amps.

For signal, I use tons of [these composite cables](http://amzn.to/2cNIbiH) in lengths of 3' or 6'.
To connect from your amps to your speakers, you'll usually need some random connector.
For instance, my speakers use normal XLR connectors, while that Behringer sub used some annoying Nuetrik connector.
In all cases, the side of the cable which connects to the amp is just bare wire, so you'll just need to cut off any connector and wire it straight into your amp.

## Yes, But How Does It Sound? ##

My system has been used in several art installations where sound was nice to have but which weren't full-on dance parties.
In these cases, I just use the four 12" speakers and the amp and keep it simple.
My setup has also been the primary system for several full-blown outdoor dance parties of approx. 50 people.
I have no problem filling a forest clearing with beautiful, clear sound.
I never hit the gain limits on the equipment -- I've always had more volume headroom than I've used.

I can keep the setup running of a single 120-amp-hour battery for two nights, although I like to switch the battery out after one night to avoid draining it down too far and causing damage to the battery.
Of course, with this setup, there's no generator noise -- all you hear is the music!
